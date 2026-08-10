import type { ApiProduct, Application, Product } from '../types';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('gd_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('gd_token', token);
  else localStorage.removeItem('gd_token');
}

export type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | object | null;
};

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body: BodyInit | null | undefined;
  if (options.body == null) {
    body = options.body as null | undefined;
  } else if (
    typeof options.body === 'string' ||
    options.body instanceof FormData ||
    options.body instanceof Blob ||
    options.body instanceof ArrayBuffer ||
    ArrayBuffer.isView(options.body)
  ) {
    body = options.body as BodyInit;
  } else {
    body = JSON.stringify(options.body);
  }

  const opts: RequestInit = { ...options, headers, body };

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    let detail: unknown = 'Request failed';
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    vendorId: p.vendor_id,
    name: p.name,
    price: p.price,
    profit: p.profit,
    category: p.category,
    type: p.type,
    savingFactorElectric: p.saving_factor_electric,
    savingFactorFuel: p.saving_factor_fuel,
    description: p.description || '',
    warranty: p.warranty ?? null,
    installation: p.installation ?? null,
    monthlySaving: p.monthly_saving,
    annualSaving: p.annual_saving,
    payback: p.payback ?? null,
    rating: p.rating,
    vendor: p.vendor,
  };
}

export function mapApp(a: Record<string, unknown>): Application {
  const repayments = (a.repayments as Record<string, unknown>[] | undefined) || [];
  return {
    id: a.id as number,
    userId: a.user_id as number,
    productId: a.product_id as number,
    vendorId: a.vendor_id as number,
    status: a.status as string,
    appliedDate: a.applied_date ? String(a.applied_date).slice(0, 10) : '',
    reviewedDate: a.reviewed_date ? String(a.reviewed_date).slice(0, 10) : null,
    approvedDate: a.approved_date ? String(a.approved_date).slice(0, 10) : null,
    downPayment: a.down_payment as number,
    monthlyInstallment: a.monthly_installment as number,
    tenure: a.tenure as number,
    totalDeferred: a.total_deferred as number,
    paidAmount: a.paid_amount as number,
    remainingAmount: a.remaining_amount as number,
    nextDueDate: a.next_due_date ? String(a.next_due_date).slice(0, 10) : 'N/A',
    repayments: repayments.map((r) => ({
      id: r.id as number,
      dueDate: r.due_date ? String(r.due_date).slice(0, 10) : '',
      paidDate: r.paid_date ? String(r.paid_date).slice(0, 10) : null,
      amount: r.amount as number,
      status: r.status as string,
    })),
    applicationDetails: (a.application_details as Record<string, unknown>) || {},
    product: a.product as Application['product'],
    vendor: a.vendor as Application['vendor'],
    user: a.user as Application['user'],
  };
}

export function formatCurrency(amt: number): string {
  return 'PKR ' + Number(amt).toLocaleString();
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    completed: 'Completed',
    reviewed: 'Reviewed',
  };
  return map[status] || status;
}

export async function uploadDocuments(
  files: FileList | File[],
  docType: string,
  applicationId: number | null = null,
) {
  const list = Array.from(files);
  if (!list.length) return [];
  const results = [];
  for (const file of list) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', docType);
    if (applicationId != null) fd.append('application_id', String(applicationId));
    results.push(await api('/documents/upload', { method: 'POST', body: fd }));
  }
  return results;
}

export async function listDocuments(applicationId?: number) {
  const qs = applicationId != null ? `?application_id=${applicationId}` : '';
  return api<
    {
      id: number;
      doc_type: string;
      original_name: string;
      size_bytes?: number;
      application_id?: number | null;
      created_at?: string;
    }[]
  >(`/documents/${qs}`);
}

export async function downloadDocument(documentId: number, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/documents/${documentId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loginRequest(email: string, password: string) {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json() as Promise<{
    access_token: string;
    user: { id: number; name: string; email: string; role: string };
  }>;
}

export async function registerVendorRequest(data: {
  name: string;
  email: string;
  password: string;
  description?: string;
}) {
  return api('/auth/register-vendor', { method: 'POST', body: data });
}
