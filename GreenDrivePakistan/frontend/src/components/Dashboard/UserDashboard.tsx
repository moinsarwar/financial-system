import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, formatCurrency, getStatusLabel, listDocuments, downloadDocument, mapApp, mapProduct } from '../../services/api';
import Stepper from '../Common/Stepper';
import Button from '../Common/Button';
import type { Application, Product } from '../../types';

const STEPS = ['pending_review', 'reviewed', 'approved', 'active', 'completed'];
const LABELS = ['Apply', 'Review', 'Approval', 'Active', 'Complete'];

interface DocRow {
  id: number;
  doc_type: string;
  original_name: string;
  size_bytes?: number;
  application_id?: number | null;
  created_at?: string;
}

export default function UserDashboard() {
  const { user, applications, products, getProduct, getVendor, refreshScoped } = useAuth();
  const [openRepayments, setOpenRepayments] = useState<Record<number, boolean>>({});
  const [detailApps, setDetailApps] = useState<Record<number, Application>>({});
  const [documents, setDocuments] = useState<DocRow[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'user') return;
    listDocuments()
      .then(setDocuments)
      .catch(console.warn);
  }, [user, applications.length]);

  if (!user || user.role !== 'user') return null;

  const userApps = applications.filter((a) => a.userId === user.id);

  const resolveProduct = (app: Application): Product | undefined => {
    const fromCatalog = getProduct(app.productId);
    if (fromCatalog) return fromCatalog;
    if (app.product && 'vendor_id' in (app.product as object)) {
      return mapProduct(app.product as Parameters<typeof mapProduct>[0]);
    }
    if (app.product && 'vendorId' in (app.product as object)) {
      return app.product as Product;
    }
    return products.find((p) => p.id === app.productId);
  };

  const loadDetail = async (appId: number) => {
    try {
      const raw = await api<Record<string, unknown>>(`/applications/${appId}`);
      setDetailApps((d) => ({ ...d, [appId]: mapApp(raw) }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to load application');
    }
  };

  const markPaid = async (appId: number, repaymentId: number) => {
    try {
      await api(`/applications/${appId}/repayments/${repaymentId}/pay`, { method: 'POST' });
      await refreshScoped();
      await loadDetail(appId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const totalFinanced = userApps.reduce((s, a) => s + a.totalDeferred, 0);
  const totalPaid = userApps.reduce((s, a) => s + a.paidAmount, 0);
  const totalRemaining = userApps.reduce((s, a) => s + a.remainingAmount, 0);
  let totalMonthlySaving = 0;
  userApps.forEach((app) => {
    const prod = resolveProduct(app);
    if (prod && (app.status === 'approved' || app.status === 'active')) {
      const saving =
        15000 * prod.savingFactorElectric + 10000 * prod.savingFactorFuel - app.monthlyInstallment;
      if (saving > 0) totalMonthlySaving += saving;
    }
  });
  const totalSavings = totalMonthlySaving * 12;
  const nextDue = userApps.length > 0 ? userApps[0].monthlyInstallment : 0;

  return (
    <div className="container page-section">
      <div className="flex-between">
        <h2>
          <i className="fas fa-user-circle" style={{ color: 'var(--secondary)' }} /> My Journey
        </h2>
        <span className="badge">Customer</span>
      </div>
      <div className="mt-16">
        {userApps.length === 0 ? (
          <div className="card">
            <p className="text-muted">You have no applications yet. Browse the marketplace to apply.</p>
          </div>
        ) : (
          userApps.map((baseApp) => {
            const app = detailApps[baseApp.id] || baseApp;
            const prod = resolveProduct(app);
            const vendor = getVendor(app.vendorId) || app.vendor;
            const currentIdx = STEPS.indexOf(app.status) >= 0 ? STEPS.indexOf(app.status) : 0;
            return (
              <div className="card mb-12" key={app.id}>
                <div className="flex-between">
                  <h4>{prod ? prod.name : 'Product'}</h4>
                  <span className="badge">{getStatusLabel(app.status)}</span>
                </div>
                <p className="text-muted">
                  Vendor: {vendor ? vendor.name : 'N/A'} | Applied: {app.appliedDate}
                </p>
                <Stepper steps={LABELS} currentIndex={currentIdx} />
                <div style={{ fontSize: 14, background: '#f8fafc', padding: 10, borderRadius: 10 }}>
                  <div className="flex-between">
                    <span>Total Deferred</span>
                    <strong>{formatCurrency(app.totalDeferred)}</strong>
                  </div>
                  <div className="flex-between">
                    <span>Paid</span>
                    <strong>{formatCurrency(app.paidAmount)}</strong>
                  </div>
                  <div className="flex-between">
                    <span>Remaining</span>
                    <strong>{formatCurrency(app.remainingAmount)}</strong>
                  </div>
                  <div className="flex-between">
                    <span>Next Due</span>
                    <strong>{app.nextDueDate || 'N/A'}</strong>
                  </div>
                </div>
                <div className="mt-12" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      loadDetail(app.id);
                      setOpenRepayments((o) => ({ ...o, [app.id]: !o[app.id] }));
                    }}
                  >
                    <i className="fas fa-chevron-down" /> View Repayments / Detail
                  </Button>
                </div>
                {openRepayments[app.id] && (
                  <div style={{ marginTop: 8 }}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Due Date</th>
                            <th>Amount</th>
                            <th>Paid Date</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(app.repayments || []).map((r) => (
                            <tr key={r.id}>
                              <td>{r.dueDate}</td>
                              <td>{formatCurrency(r.amount)}</td>
                              <td>{r.paidDate || '—'}</td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    background:
                                      r.status === 'paid'
                                        ? '#d1fae5'
                                        : r.status === 'overdue'
                                          ? '#fee2e2'
                                          : '#fef3c7',
                                    color:
                                      r.status === 'paid'
                                        ? '#065f2e'
                                        : r.status === 'overdue'
                                          ? '#b91c1c'
                                          : '#92400e',
                                  }}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td>
                                {r.status === 'pending' || r.status === 'overdue' ? (
                                  <Button size="sm" onClick={() => markPaid(app.id, r.id)}>
                                    Mark paid
                                  </Button>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-folder-open" /> My Documents
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>File</th>
                <th>Application</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {documents.length ? (
                documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.doc_type}</td>
                    <td>
                      <button
                        type="button"
                        className="nav-btn"
                        style={{ padding: 0, color: 'var(--primary)', textDecoration: 'underline' }}
                        onClick={() =>
                          downloadDocument(d.id, d.original_name).catch((e) =>
                            alert(e instanceof Error ? e.message : 'Download failed'),
                          )
                        }
                      >
                        {d.original_name}
                      </button>
                    </td>
                    <td>{d.application_id ?? '—'}</td>
                    <td>
                      {d.size_bytes != null ? `${Math.round(d.size_bytes / 1024)} KB` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2 mt-16">
        <div className="card">
          <i className="fas fa-wallet" style={{ color: 'var(--primary)' }} /> <strong>Total Savings</strong>{' '}
          <span className="stat-number">{formatCurrency(totalSavings)}</span>
        </div>
        <div className="card">
          <i className="fas fa-calendar-check" /> <strong>Next Payment</strong>{' '}
          <span className="stat-number">{formatCurrency(nextDue)}</span>
        </div>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-file-alt" /> My Reports
        </h4>
        <p className="text-muted">
          Total financed: {formatCurrency(totalFinanced)} | Total paid: {formatCurrency(totalPaid)} |
          Remaining: {formatCurrency(totalRemaining)}
        </p>
      </div>
    </div>
  );
}
