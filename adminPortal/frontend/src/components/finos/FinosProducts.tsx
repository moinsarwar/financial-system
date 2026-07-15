import { useState, useEffect } from 'react';
import { Package, Trash2, Edit2, Plus, RefreshCw, Briefcase } from 'lucide-react';
import Swal from 'sweetalert2';

interface Product {
  id: string;
  client_id: string;
  client_name: string;
  product_type: string;
  product_label: string;
  status: string;
  policy_number?: string;
  premium?: number;
  sum_assured?: number;
}

export default function FinosProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Uses Vite env variable, fallback to localhost:8000
  const backendUrl = import.meta.env.VITE_FINOS_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://' + window.location.hostname + ':8000');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin_portal/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this product?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin_portal/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      
      Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      fetchProducts();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Action failed', 'error');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500 w-full min-h-[500px]">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Loading Client Products...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            Client Products
          </h2>
          <p className="text-slate-500 mt-1">Manage active financial products and holdings for clients</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProducts} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm" onClick={() => Swal.fire('Info', 'Add Product Modal (To be implemented)', 'info')}>
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Product ID</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Label</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{product.id.substring(0,8)}...</td>
                  <td className="px-6 py-4">{product.client_name || product.client_id.substring(0,8)}</td>
                  <td className="px-6 py-4 capitalize">{product.product_type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {product.product_label}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded" onClick={() => Swal.fire('Info', 'Edit Product (To be implemented)', 'info')}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 rounded" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
