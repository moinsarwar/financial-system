import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, formatCurrency, getStatusLabel, mapProduct } from '../../services/api';
import Button from '../Common/Button';
import ProductFormEditor, {
  emptyProductForm,
  formToApiBody,
  productToForm,
} from '../Marketplace/ProductFormEditor';
import type { AdminStats, ProductFormData } from '../../types';

export default function AdminDashboard() {
  const {
    user,
    applications,
    lenders,
    activeLenderId,
    products,
    vendors,
    users,
    cashSales,
    getProduct,
    getVendor,
    refreshPublic,
    refreshScoped,
  } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [showLenderForm, setShowLenderForm] = useState(false);
  const [lenderName, setLenderName] = useState('');
  const [lenderRate, setLenderRate] = useState('');
  const [lenderTenure, setLenderTenure] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyProductForm);
  const [productVendorId, setProductVendorId] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(console.warn);
  }, [user, applications, cashSales]);

  if (!user || user.role !== 'admin') return null;

  const updateStatus = async (appId: number, status: string) => {
    try {
      await api(`/applications/${appId}/status`, { method: 'PATCH', body: { status } });
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const markPaid = async (appId: number, repaymentId: number) => {
    try {
      await api(`/applications/${appId}/repayments/${repaymentId}/pay`, { method: 'POST' });
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const setActiveLender = async (id: number) => {
    try {
      await api(`/admin/lenders/${id}/activate`, { method: 'POST' });
      await refreshScoped();
      await refreshPublic();
      alert('Active lender updated and product profits recalculated.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const editLender = async (id: number) => {
    const l = lenders.find((x) => x.id === id);
    if (!l) return;
    const name = prompt('Lender name', l.name);
    if (name == null) return;
    const rateStr = prompt('Profit rate %', String(l.profitRate * 100));
    if (rateStr == null) return;
    const tenureStr = prompt('Max tenure (months)', String(l.maxTenure));
    if (tenureStr == null) return;
    const rate = parseFloat(rateStr) / 100;
    const tenure = parseInt(tenureStr, 10);
    if (!name.trim() || isNaN(rate) || isNaN(tenure) || rate <= 0 || tenure <= 0) {
      alert('Invalid values.');
      return;
    }
    try {
      await api(`/admin/lenders/${id}`, {
        method: 'PUT',
        body: { name: name.trim(), profit_rate: rate, max_tenure: tenure },
      });
      await refreshScoped();
      await refreshPublic();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deleteLender = async (id: number) => {
    if (lenders.length <= 1) {
      alert('Cannot delete the last lender.');
      return;
    }
    if (!confirm('Delete this lender?')) return;
    try {
      await api(`/admin/lenders/${id}`, { method: 'DELETE' });
      await refreshScoped();
      await refreshPublic();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const saveLender = async () => {
    const name = lenderName.trim();
    const rate = parseFloat(lenderRate);
    const tenure = parseInt(lenderTenure, 10);
    if (!name || isNaN(rate) || isNaN(tenure) || rate <= 0 || tenure <= 0) {
      alert('Please fill all fields with valid values.');
      return;
    }
    try {
      await api('/admin/lenders', {
        method: 'POST',
        body: { name, profit_rate: rate / 100, max_tenure: tenure },
      });
      setLenderName('');
      setLenderRate('');
      setLenderTenure('');
      setShowLenderForm(false);
      await refreshScoped();
      await refreshPublic();
      alert('Lender added.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const closeProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductVendorId('');
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductVendorId('');
    setShowProductForm(true);
  };

  const openEditProduct = (productId: number) => {
    const p = getProduct(productId);
    if (!p) return;
    setEditingProductId(productId);
    setProductForm(productToForm(p));
    setProductVendorId(String(p.vendorId));
    setShowProductForm(true);
  };

  const saveAdminProduct = async () => {
    const vendorId = parseInt(productVendorId, 10);
    if (
      !productForm.name.trim() ||
      !productForm.category.trim() ||
      !productForm.price ||
      productForm.price <= 0 ||
      (!editingProductId && !vendorId)
    ) {
      alert(
        editingProductId
          ? 'Name, category, and a valid price are required.'
          : 'Name, category, price, and vendor are required.'
      );
      return;
    }
    const body = formToApiBody(productForm);
    try {
      if (editingProductId != null) {
        await api(`/products/${editingProductId}`, { method: 'PUT', body });
        alert('Product updated.');
      } else {
        await api('/products/', {
          method: 'POST',
          body: { ...body, vendor_id: vendorId },
        });
        alert('Product created.');
      }
      closeProductForm();
      await refreshPublic();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deactivateProduct = async (productId: number) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api(`/products/${productId}`, { method: 'DELETE' });
      await refreshPublic();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const active = lenders.find((l) => l.id === activeLenderId);

  return (
    <div className="container page-section">
      <div className="flex-between">
        <h2>
          <i className="fas fa-crown" style={{ color: 'var(--accent)' }} /> Super Admin
        </h2>
        <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
          Platform Oversight
        </span>
      </div>
      <div className="grid-3 mt-16">
        <div className="card">
          <i className="fas fa-users" /> <strong>Total Users</strong>{' '}
          <span className="stat-number">{stats?.total_users ?? 0}</span>
        </div>
        <div className="card">
          <i className="fas fa-store-alt" /> <strong>Vendors</strong>{' '}
          <span className="stat-number">{stats?.total_vendors ?? 0}</span>
        </div>
        <div className="card">
          <i className="fas fa-clipboard-list" /> <strong>Applications</strong>{' '}
          <span className="stat-number">{stats?.total_applications ?? 0}</span>
        </div>
        <div className="card">
          <i className="fas fa-hand-holding-usd" /> <strong>Financed Volume</strong>{' '}
          <span className="stat-number">{formatCurrency(stats?.financed_volume ?? 0)}</span>
        </div>
        <div className="card">
          <i className="fas fa-money-bill-wave" /> <strong>Cash Sales</strong>{' '}
          <span className="stat-number">{formatCurrency(stats?.cash_volume ?? 0)}</span>
        </div>
        <div className="card">
          <i className="fas fa-file-invoice" /> <strong>Total Revenue</strong>{' '}
          <span className="stat-number">{formatCurrency(stats?.total_revenue ?? 0)}</span>
        </div>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-university" /> Lender Comparison Engine
        </h4>
        <p className="text-muted">
          Manage lenders and their profit rates. The system will use the selected lender for all new
          financing.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lender Name</th>
                <th>Profit Rate (%)</th>
                <th>Max Tenure (months)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lenders.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{(l.profitRate * 100).toFixed(0)}%</td>
                  <td>{l.maxTenure}</td>
                  <td>
                    {activeLenderId === l.id ? (
                      <span className="badge" style={{ background: '#d1fae5' }}>
                        Active
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setActiveLender(l.id)}>
                        Set Active
                      </Button>
                    )}{' '}
                    <Button variant="secondary" size="sm" onClick={() => editLender(l.id)}>
                      Edit
                    </Button>{' '}
                    <Button variant="danger" size="sm" onClick={() => deleteLender(l.id)}>
                      <i className="fas fa-trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-12">
          <Button variant="secondary" size="sm" onClick={() => setShowLenderForm(true)}>
            <i className="fas fa-plus" /> Add Lender
          </Button>
        </div>
        {showLenderForm && (
          <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <input
              placeholder="Lender Name"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                width: '100%',
                marginBottom: 8,
              }}
            />
            <input
              type="number"
              placeholder="Profit Rate %"
              value={lenderRate}
              onChange={(e) => setLenderRate(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                width: '100%',
                marginBottom: 8,
              }}
            />
            <input
              type="number"
              placeholder="Max Tenure (months)"
              value={lenderTenure}
              onChange={(e) => setLenderTenure(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                width: '100%',
                marginBottom: 8,
              }}
            />
            <Button size="sm" onClick={saveLender}>
              <i className="fas fa-save" /> Save
            </Button>{' '}
            <Button variant="secondary" size="sm" onClick={() => setShowLenderForm(false)}>
              Cancel
            </Button>
          </div>
        )}
        <div className="mt-12">
          <strong>Current Active Lender:</strong> {active ? active.name : 'None'}
        </div>
        <div>
          <Button
            size="sm"
            onClick={() => {
              refreshPublic().then(() => alert('All product profits updated based on active lender.'));
            }}
          >
            <i className="fas fa-sync-alt" /> Apply Active Lender to All Products (recalculate profit)
          </Button>
        </div>
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-boxes" /> Product Management
        </h4>
        <p className="text-muted">Admin can create products for any vendor (vendor_id required).</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Vendor</th>
                <th>Price</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{getVendor(p.vendorId)?.name || p.vendor?.name || p.vendorId}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.category}</td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => openEditProduct(p.id)}>
                      Edit
                    </Button>{' '}
                    <Button variant="danger" size="sm" onClick={() => deactivateProduct(p.id)}>
                      Deactivate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-12">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showProductForm && editingProductId == null) closeProductForm();
              else openAddProduct();
            }}
          >
            <i className="fas fa-plus" />{' '}
            {showProductForm && editingProductId == null ? 'Close form' : 'Add Product'}
          </Button>
        </div>
        {showProductForm && (
          <ProductFormEditor
            form={productForm}
            onChange={setProductForm}
            onSubmit={saveAdminProduct}
            onCancel={closeProductForm}
            submitLabel={editingProductId != null ? 'Update Product' : 'Save Product'}
            title={editingProductId != null ? 'Edit Product' : 'Add Product'}
            headerExtra={
              editingProductId == null ? (
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: 4,
                    }}
                  >
                    Vendor *
                  </label>
                  <select
                    value={productVendorId}
                    onChange={(e) => setProductVendorId(e.target.value)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid #d1d5db',
                      width: '100%',
                    }}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-muted" style={{ marginBottom: 12, fontSize: 13 }}>
                  Vendor: {getVendor(parseInt(productVendorId, 10))?.name || productVendorId}
                </p>
              )
            }
          />
        )}
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-store-alt" /> Vendors
        </h4>
        <p className="text-muted">
          Merchants live in the <code>vendors</code> table (separate from Platform Users).
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length ? (
                vendors.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.name}</td>
                    <td>{v.email || '—'}</td>
                    <td>{products.filter((p) => p.vendorId === v.id).length}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No vendors loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-users" /> Platform Users
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.salary != null ? formatCurrency(u.salary) : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No users loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-money-bill" /> Cash Sales
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Product</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {cashSales.length ? (
                cashSales.map((c) => (
                  <tr key={c.id}>
                    <td>{getVendor(c.vendorId)?.name || c.vendorId}</td>
                    <td>{getProduct(c.productId)?.name || c.productId}</td>
                    <td>{c.buyerName}</td>
                    <td>{formatCurrency(c.amount)}</td>
                    <td>{c.date || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No cash sales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-16">
        <h4>
          <i className="fas fa-flag" /> Platform Reports
        </h4>
        <p>
          Pending approvals: {stats?.pending_applications ?? 0} | Active loans:{' '}
          {stats?.active_loans ?? 0} | Completed: {stats?.completed_loans ?? 0}
        </p>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-list" /> All Applications
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Vendor</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                const u = a.user;
                const vendor = getVendor(a.vendorId) || a.vendor;
                const prod =
                  getProduct(a.productId) ||
                  (a.product && 'vendor_id' in (a.product as object)
                    ? mapProduct(a.product as Parameters<typeof mapProduct>[0])
                    : null);
                let actions: ReactNode = '—';
                if (a.status === 'pending_review') {
                  actions = (
                    <>
                      <Button size="sm" onClick={() => updateStatus(a.id, 'approved')}>
                        Approve
                      </Button>{' '}
                      <Button variant="danger" size="sm" onClick={() => updateStatus(a.id, 'rejected')}>
                        Reject
                      </Button>
                    </>
                  );
                } else {
                  const pending = (a.repayments || []).find(
                    (r) => r.status === 'pending' || r.status === 'overdue',
                  );
                  if (pending) {
                    actions = (
                      <Button size="sm" onClick={() => markPaid(a.id, pending.id)}>
                        Mark paid
                      </Button>
                    );
                  }
                }
                return (
                  <tr key={a.id}>
                    <td>{u ? u.name : 'N/A'}</td>
                    <td>{vendor ? vendor.name : 'N/A'}</td>
                    <td>{prod ? prod.name : 'N/A'}</td>
                    <td>{formatCurrency(a.totalDeferred)}</td>
                    <td>
                      <span className="badge">{getStatusLabel(a.status)}</span>
                    </td>
                    <td>{actions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
