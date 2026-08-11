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
  const [editingLenderId, setEditingLenderId] = useState<number | null>(null);
  const [lenderName, setLenderName] = useState('');
  const [lenderRate, setLenderRate] = useState('');
  const [lenderTenure, setLenderTenure] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyProductForm);
  const [productVendorId, setProductVendorId] = useState('');

  const emptyVendorForm = {
    name: '',
    email: '',
    description: '',
    password: '',
    is_active: true,
  };
  const emptyUserForm = {
    name: '',
    email: '',
    password: '',
    cnic: '',
    phone: '',
    address: '',
    salary: '',
    role: 'user' as 'user' | 'admin',
    is_active: true,
  };
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [formulaDownPct, setFormulaDownPct] = useState('20');
  const [formulaHorizon, setFormulaHorizon] = useState('5');

  const fieldStyle = {
    padding: 10,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    width: '100%',
    marginBottom: 8,
  } as const;
  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#334155',
    marginBottom: 4,
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(console.warn);
    api<{ down_payment_rate: number; default_horizon_years: number }>('/compare/settings')
      .then((s) => {
        setFormulaDownPct(String(Math.round((s.down_payment_rate || 0.2) * 100)));
        setFormulaHorizon(String(s.default_horizon_years || 5));
      })
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

  const closeLenderForm = () => {
    setShowLenderForm(false);
    setEditingLenderId(null);
    setLenderName('');
    setLenderRate('');
    setLenderTenure('');
  };

  const openAddLender = () => {
    setEditingLenderId(null);
    setLenderName('');
    setLenderRate('');
    setLenderTenure('');
    setShowLenderForm(true);
  };

  const openEditLender = (id: number) => {
    const l = lenders.find((x) => x.id === id);
    if (!l) return;
    setEditingLenderId(id);
    setLenderName(l.name);
    setLenderRate(String(l.profitRate * 100));
    setLenderTenure(String(l.maxTenure));
    setShowLenderForm(true);
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
      if (editingLenderId != null) {
        await api(`/admin/lenders/${editingLenderId}`, {
          method: 'PUT',
          body: { name, profit_rate: rate / 100, max_tenure: tenure },
        });
        alert('Lender updated.');
      } else {
        await api('/admin/lenders', {
          method: 'POST',
          body: { name, profit_rate: rate / 100, max_tenure: tenure },
        });
        alert('Lender added.');
      }
      closeLenderForm();
      await refreshScoped();
      await refreshPublic();
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

  const closeVendorForm = () => {
    setShowVendorForm(false);
    setEditingVendorId(null);
    setVendorForm(emptyVendorForm);
  };

  const openAddVendor = () => {
    setEditingVendorId(null);
    setVendorForm(emptyVendorForm);
    setShowVendorForm(true);
  };

  const openEditVendor = (id: number) => {
    const v = vendors.find((x) => x.id === id);
    if (!v) return;
    setEditingVendorId(id);
    setVendorForm({
      name: v.name,
      email: v.email || '',
      description: v.description || '',
      password: '',
      is_active: v.is_active !== false,
    });
    setShowVendorForm(true);
  };

  const saveVendor = async () => {
    if (!vendorForm.name.trim() || !vendorForm.email.trim()) {
      alert('Name and email are required.');
      return;
    }
    if (editingVendorId == null && !vendorForm.password) {
      alert('Password is required for new vendors.');
      return;
    }
    try {
      if (editingVendorId != null) {
        const body: Record<string, unknown> = {
          name: vendorForm.name.trim(),
          email: vendorForm.email.trim(),
          description: vendorForm.description.trim() || null,
          is_active: vendorForm.is_active,
        };
        if (vendorForm.password) body.password = vendorForm.password;
        await api(`/admin/vendors/${editingVendorId}`, { method: 'PUT', body });
        alert('Vendor updated.');
      } else {
        await api('/admin/vendors', {
          method: 'POST',
          body: {
            name: vendorForm.name.trim(),
            email: vendorForm.email.trim(),
            description: vendorForm.description.trim() || null,
            password: vendorForm.password,
          },
        });
        alert('Vendor created.');
      }
      closeVendorForm();
      await refreshPublic();
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  };

  const openAddUser = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setShowUserForm(true);
  };

  const openEditUser = (id: number) => {
    const u = users.find((x) => x.id === id);
    if (!u || u.role === 'admin') return;
    setEditingUserId(id);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      cnic: u.cnic || '',
      phone: u.phone || '',
      address: u.address || '',
      salary: u.salary != null ? String(u.salary) : '',
      role: 'user',
      is_active: u.is_active !== false,
    });
    setShowUserForm(true);
  };

  const saveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Name and email are required.');
      return;
    }
    if (editingUserId == null) {
      if (!userForm.password || !userForm.cnic.trim()) {
        alert('Password and CNIC are required for new users.');
        return;
      }
    }
    const salary = parseFloat(userForm.salary || '0');
    try {
      if (editingUserId != null) {
        const body: Record<string, unknown> = {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          phone: userForm.phone.trim() || null,
          address: userForm.address.trim() || null,
          salary: Number.isFinite(salary) ? salary : 0,
          role: 'user',
          is_active: userForm.is_active,
        };
        if (userForm.cnic.trim()) body.cnic = userForm.cnic.trim();
        if (userForm.password) body.password = userForm.password;
        await api(`/admin/users/${editingUserId}`, { method: 'PUT', body });
        alert('User updated.');
      } else {
        await api('/admin/users', {
          method: 'POST',
          body: {
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            password: userForm.password,
            cnic: userForm.cnic.trim(),
            phone: userForm.phone.trim() || null,
            address: userForm.address.trim() || null,
            salary: Number.isFinite(salary) ? salary : 0,
            role: 'user',
          },
        });
        alert('User created.');
      }
      closeUserForm();
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const saveFormulaSettings = async () => {
    const down = parseFloat(formulaDownPct);
    const horizon = parseInt(formulaHorizon, 10);
    if (isNaN(down) || down < 0 || down > 100 || isNaN(horizon) || horizon < 1) {
      alert('Enter valid down payment % (0–100) and horizon years (≥1).');
      return;
    }
    try {
      await api('/compare/settings', {
        method: 'PUT',
        body: {
          down_payment_rate: down / 100,
          default_horizon_years: horizon,
        },
      });
      await refreshPublic();
      alert('Compare formula defaults saved.');
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
                    <Button variant="secondary" size="sm" onClick={() => openEditLender(l.id)}>
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showLenderForm && editingLenderId == null) closeLenderForm();
              else openAddLender();
            }}
          >
            <i className="fas fa-plus" />{' '}
            {showLenderForm && editingLenderId == null ? 'Close form' : 'Add Lender'}
          </Button>
        </div>
        {showLenderForm && (
          <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h4 style={{ marginBottom: 12 }}>
              {editingLenderId != null ? 'Edit Lender' : 'Add Lender'}
            </h4>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 4,
              }}
            >
              Lender name *
            </label>
            <input
              placeholder="e.g. LFE"
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
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 4,
              }}
            >
              Profit rate (%) *
            </label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              placeholder="e.g. 13"
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
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 4,
              }}
            >
              Max tenure (months) *
            </label>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 24 or 36"
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
            <p className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Active lender&apos;s tenure is used for Compare + marketplace installments.
            </p>
            <Button size="sm" onClick={saveLender}>
              <i className="fas fa-save" />{' '}
              {editingLenderId != null ? 'Update Lender' : 'Save Lender'}
            </Button>{' '}
            <Button variant="secondary" size="sm" onClick={closeLenderForm}>
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
          <i className="fas fa-sliders-h" /> Compare Formula Defaults
        </h4>
        <p className="text-muted">
          Defaults used by Compare / Marketplace when the user does not override them. Tenure still
          comes from the active lender (users can pick any tenure up to lender max on Compare).
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div>
            <label style={labelStyle}>Default down payment (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={formulaDownPct}
              onChange={(e) => setFormulaDownPct(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Default net-saving horizon (years)</label>
            <select
              value={formulaHorizon}
              onChange={(e) => setFormulaHorizon(e.target.value)}
              style={fieldStyle}
            >
              {[3, 5, 7, 10].map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button size="sm" onClick={saveFormulaSettings}>
          <i className="fas fa-save" /> Save Formula Defaults
        </Button>
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
                    {vendors
                      .filter((v) => v.is_active !== false)
                      .map((v) => (
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
                <th>Status</th>
                <th>Action</th>
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
                    <td>
                      <span className="badge">{v.is_active === false ? 'Inactive' : 'Active'}</span>
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => openEditVendor(v.id)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No vendors loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-12">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showVendorForm && editingVendorId == null) closeVendorForm();
              else openAddVendor();
            }}
          >
            <i className="fas fa-plus" />{' '}
            {showVendorForm && editingVendorId == null ? 'Close form' : 'Add Vendor'}
          </Button>
        </div>
        {showVendorForm && (
          <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h4 style={{ marginBottom: 12 }}>
              {editingVendorId != null ? 'Edit Vendor' : 'Add Vendor'}
            </h4>
            <label style={labelStyle}>Name *</label>
            <input
              style={fieldStyle}
              value={vendorForm.name}
              onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Business name"
            />
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              style={fieldStyle}
              value={vendorForm.email}
              onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="vendor@example.com"
            />
            <label style={labelStyle}>
              Password {editingVendorId != null ? '(leave blank to keep)' : '*'}
            </label>
            <input
              type="password"
              style={fieldStyle}
              value={vendorForm.password}
              onChange={(e) => setVendorForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editingVendorId != null ? '••••••••' : 'Set login password'}
            />
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 60 }}
              value={vendorForm.description}
              onChange={(e) => setVendorForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short about the vendor"
            />
            {editingVendorId != null && (
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={vendorForm.is_active}
                  onChange={(e) => setVendorForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
            )}
            <div style={{ marginTop: 8 }}>
              <Button size="sm" onClick={saveVendor}>
                <i className="fas fa-save" />{' '}
                {editingVendorId != null ? 'Update Vendor' : 'Save Vendor'}
              </Button>{' '}
              <Button variant="secondary" size="sm" onClick={closeVendorForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.filter((u) => u.role === 'user' || !u.role).length ? (
                users
                  .filter((u) => u.role === 'user' || !u.role)
                  .map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.salary != null ? formatCurrency(u.salary) : '—'}</td>
                    <td>
                      <span className="badge">{u.is_active === false ? 'Inactive' : 'Active'}</span>
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => openEditUser(u.id)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No users loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-12">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showUserForm && editingUserId == null) closeUserForm();
              else openAddUser();
            }}
          >
            <i className="fas fa-plus" />{' '}
            {showUserForm && editingUserId == null ? 'Close form' : 'Add User'}
          </Button>
        </div>
        {showUserForm && (
          <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h4 style={{ marginBottom: 12 }}>
              {editingUserId != null ? 'Edit User' : 'Add User'}
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0 16px',
              }}
            >
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  style={fieldStyle}
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  style={fieldStyle}
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Password {editingUserId != null ? '(leave blank to keep)' : '*'}
                </label>
                <input
                  type="password"
                  style={fieldStyle}
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>CNIC {editingUserId == null ? '*' : ''}</label>
                <input
                  style={fieldStyle}
                  value={userForm.cnic}
                  onChange={(e) => setUserForm((f) => ({ ...f, cnic: e.target.value }))}
                  placeholder="42101-1234567-8"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={fieldStyle}
                  value={userForm.phone}
                  onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input
                  style={fieldStyle}
                  value={userForm.address}
                  onChange={(e) => setUserForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Salary (PKR)</label>
                <input
                  type="number"
                  style={fieldStyle}
                  value={userForm.salary}
                  onChange={(e) => setUserForm((f) => ({ ...f, salary: e.target.value }))}
                />
              </div>
            </div>
            {editingUserId != null && (
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
            )}
            <div style={{ marginTop: 8 }}>
              <Button size="sm" onClick={saveUser}>
                <i className="fas fa-save" /> {editingUserId != null ? 'Update User' : 'Save User'}
              </Button>{' '}
              <Button variant="secondary" size="sm" onClick={closeUserForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}
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
