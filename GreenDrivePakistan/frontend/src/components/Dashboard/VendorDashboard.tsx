import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, formatCurrency, mapProduct } from '../../services/api';
import Button from '../Common/Button';
import ProductFormEditor, {
  emptyProductForm,
  formToApiBody,
  productToForm,
} from '../Marketplace/ProductFormEditor';
import type { ProductFormData } from '../../types';

export default function VendorDashboard() {
  const {
    user,
    products,
    applications,
    cashSales,
    getProduct,
    refreshPublic,
    refreshScoped,
  } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyProductForm);
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashForm, setCashForm] = useState({ productId: '', buyerName: '', amount: '' });

  if (!user || user.role !== 'vendor') return null;

  const vendorId = user.id;
  const myProducts = products.filter((p) => p.vendorId === vendorId);
  const myApps = applications.filter((a) => a.vendorId === vendorId);
  const myCash = cashSales.filter((c) => c.vendorId === vendorId);

  const closeProductForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyProductForm);
  };

  const openAddProduct = () => {
    setEditingId(null);
    setForm(emptyProductForm);
    setShowForm(true);
  };

  const openEditProduct = (productId: number) => {
    const p = getProduct(productId);
    if (!p) return;
    setEditingId(productId);
    setForm(productToForm(p));
    setShowForm(true);
  };

  const updateStatus = async (appId: number, status: string) => {
    try {
      await api(`/applications/${appId}/status`, { method: 'PATCH', body: { status } });
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price || form.price <= 0) {
      alert('Name, category, and a valid price are required.');
      return;
    }
    const body = formToApiBody(form);
    try {
      if (editingId != null) {
        await api(`/products/${editingId}`, { method: 'PUT', body });
        alert('Product updated.');
      } else {
        await api('/products/', { method: 'POST', body });
        alert('Product created.');
      }
      closeProductForm();
      await refreshPublic();
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const saveCashSale = async () => {
    const productId = parseInt(cashForm.productId, 10);
    const amount = parseFloat(cashForm.amount);
    if (!productId || !cashForm.buyerName.trim() || isNaN(amount) || amount <= 0) {
      alert('Select a product, enter buyer name, and a valid amount.');
      return;
    }
    try {
      await api('/vendors/me/cash-sales', {
        method: 'POST',
        body: {
          product_id: productId,
          buyer_name: cashForm.buyerName.trim(),
          amount,
        },
      });
      setCashForm({ productId: '', buyerName: '', amount: '' });
      setShowCashForm(false);
      await refreshScoped();
      alert('Cash sale recorded.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deactivateProduct = async (productId: number) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api(`/products/${productId}`, { method: 'DELETE' });
      await refreshPublic();
      await refreshScoped();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const allOrders = [
    ...myApps.map((a) => {
      const prod =
        getProduct(a.productId) ||
        (a.product && 'vendor_id' in (a.product as object)
          ? mapProduct(a.product as Parameters<typeof mapProduct>[0])
          : null);
      const buyer = a.user?.name || 'N/A';
      const actions =
        a.status === 'pending_review' ? (
          <>
            <Button size="sm" onClick={() => updateStatus(a.id, 'approved')}>
              Approve
            </Button>{' '}
            <Button variant="danger" size="sm" onClick={() => updateStatus(a.id, 'rejected')}>
              Reject
            </Button>
          </>
        ) : (
          '—'
        );
      return {
        key: `app-${a.id}`,
        product: prod ? prod.name : 'N/A',
        buyer,
        type: 'Financed',
        amount: a.totalDeferred,
        status: a.status,
        actions,
      };
    }),
    ...myCash.map((c) => {
      const prod = getProduct(c.productId);
      return {
        key: `cash-${c.id}`,
        product: prod ? prod.name : 'N/A',
        buyer: c.buyerName,
        type: 'Cash',
        amount: c.amount,
        status: 'Completed',
        actions: '—' as const,
      };
    }),
  ];

  const revFinanced = myApps.reduce((s, a) => s + a.totalDeferred, 0);
  const revCash = myCash.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="container page-section">
      <div className="flex-between">
        <h2>
          <i className="fas fa-store" style={{ color: 'var(--accent)' }} /> Vendor Dashboard
        </h2>
        <span className="badge">Merchant</span>
      </div>
      <div className="grid-3 mt-16">
        <div className="card">
          <i className="fas fa-boxes" /> <strong>Products</strong>{' '}
          <span className="stat-number">{myProducts.length}</span>
        </div>
        <div className="card">
          <i className="fas fa-coins" /> <strong>Financed Sales</strong>{' '}
          <span className="stat-number">{myApps.length}</span>
        </div>
        <div className="card">
          <i className="fas fa-money-bill" /> <strong>Cash Sales</strong>{' '}
          <span className="stat-number">{myCash.length}</span>
        </div>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-file-invoice" /> Sales &amp; Orders
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length ? (
                allOrders.map((o) => (
                  <tr key={o.key}>
                    <td>{o.product}</td>
                    <td>{o.buyer}</td>
                    <td>{o.type}</td>
                    <td>{formatCurrency(o.amount)}</td>
                    <td>
                      <span className="badge">{o.status}</span>
                    </td>
                    <td>{o.actions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-boxes" /> My Products
        </h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myProducts.length ? (
                myProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.category}</td>
                    <td>{p.type}</td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => openEditProduct(p.id)}>
                        Edit
                      </Button>{' '}
                      <Button variant="danger" size="sm" onClick={() => deactivateProduct(p.id)}>
                        Deactivate
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No products yet.
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
              if (showForm && editingId == null) closeProductForm();
              else openAddProduct();
            }}
          >
            <i className="fas fa-plus" /> {showForm && editingId == null ? 'Close form' : 'Add Product'}
          </Button>
        </div>
        {showForm && (
          <ProductFormEditor
            form={form}
            onChange={setForm}
            onSubmit={saveProduct}
            onCancel={closeProductForm}
            submitLabel={editingId != null ? 'Update Product' : 'Save Product'}
            title={editingId != null ? 'Edit Product' : 'Add Product'}
          />
        )}
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-money-bill" /> Cash Sales
        </h4>
        <div className="mt-12">
          <Button variant="secondary" size="sm" onClick={() => setShowCashForm((s) => !s)}>
            <i className="fas fa-plus" /> Record Cash Sale
          </Button>
        </div>
        {showCashForm && (
          <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <select
              value={cashForm.productId}
              onChange={(e) => setCashForm((f) => ({ ...f, productId: e.target.value }))}
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                width: '100%',
                marginBottom: 8,
              }}
            >
              <option value="">Select product</option>
              {myProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)})
                </option>
              ))}
            </select>
            <input
              placeholder="Buyer name"
              value={cashForm.buyerName}
              onChange={(e) => setCashForm((f) => ({ ...f, buyerName: e.target.value }))}
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
              placeholder="Amount (PKR)"
              value={cashForm.amount}
              onChange={(e) => setCashForm((f) => ({ ...f, amount: e.target.value }))}
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                width: '100%',
                marginBottom: 8,
              }}
            />
            <Button size="sm" onClick={saveCashSale}>
              <i className="fas fa-save" /> Save Cash Sale
            </Button>{' '}
            <Button variant="secondary" size="sm" onClick={() => setShowCashForm(false)}>
              Cancel
            </Button>
          </div>
        )}
        <div className="table-wrap mt-12">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {myCash.length ? (
                myCash.map((c) => (
                  <tr key={c.id}>
                    <td>{getProduct(c.productId)?.name || 'N/A'}</td>
                    <td>{c.buyerName}</td>
                    <td>{formatCurrency(c.amount)}</td>
                    <td>{c.date || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No cash sales yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt-16">
        <h4>
          <i className="fas fa-chart-pie" /> Vendor Reports
        </h4>
        <p>
          Total revenue: {formatCurrency(revFinanced + revCash)} | Financed:{' '}
          {formatCurrency(revFinanced)} | Cash: {formatCurrency(revCash)}
        </p>
      </div>
    </div>
  );
}
