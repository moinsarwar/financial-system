import api from './client';

export interface Claim {
  id: string;
  client_id: string;
  client_name: string;
  product_type: string;
  product_label: string;
  policy_id: string;
  type: string;
  amount: number | string;
  currency: string;
  current_step: string;
  step_index: number;
  steps: string[];
  outcome: string | null;
  incident_date: string;
  created_at: string;
  updated_at: string;
  description: string;
  severity: string;
  reserve_amount: number | string;
  approved_amount: number | string;
  fraud_indicator: boolean;
  payment_ref: string | null;
  insurer_ref: string | null;
  timeline: Array<{
    time: string;
    event: string;
    user: string;
  }>;
  resolution_reason_code?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
}

export interface ClaimCreate {
  client_id: string;
  policy_id: string;
  type: string;
  amount: number;
  description: string;
}

export interface ClaimResolution {
  outcome:
    | 'Payment Confirmed'
    | 'Authorization Denied'
    | 'Partially Approved'
    | 'Fraud Review';
  reason_code: string;
  notes?: string;
}

export async function getClaims(params?: {
  search?: string;
  step?: string;
  department?: string;
  open_only?: boolean;
}): Promise<Claim[]> {
  const { data } = await api.get<Claim[]>(
    '/claims',
    { params },
  );

  return data;
}

export async function getClaim(
  id: string,
): Promise<Claim> {
  const { data } = await api.get<Claim>(
    `/claims/${id}`,
  );

  return data;
}

export async function createClaim(
  claim: ClaimCreate,
): Promise<Claim> {
  const { data } = await api.post<Claim>(
    '/claims',
    claim,
  );

  return data;
}

export async function advanceClaim(
  id: string,
): Promise<Claim> {
  const { data } = await api.post<Claim>(
    `/claims/${id}/advance`,
  );

  return data;
}

export async function resolveClaim(
  id: string,
  resolution: ClaimResolution,
): Promise<Claim> {
  const { data } = await api.post<Claim>(
    `/claims/${id}/resolve`,
    resolution,
  );

  return data;
}

export async function addClaimMessage(
  id: string,
  message: string,
): Promise<Claim> {
  const { data } = await api.post<Claim>(
    `/claims/${id}/message`,
    { message },
  );

  return data;
}

