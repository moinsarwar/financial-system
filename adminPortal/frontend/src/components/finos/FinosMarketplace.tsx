import { useState, useEffect } from 'react';
import { Store, Trash2, Edit2, Plus, RefreshCw, X, Save, PlusCircle, Trash } from 'lucide-react';
import Swal from 'sweetalert2';

interface FrontProduct {
  product_id: string;
  provider_id: string;
  product_type: string;
  status: string;
  version: string;
  effective_date: string;
  jurisdiction?: any;
  pricing?: any;
  eligibility_rules?: any;
  features?: any;
  compliance?: any;
  schema_hash?: string;
  published_by?: string;
  approved_by?: string;
  change_request?: string;
  previous_version?: string;
}

// Dynamic UI components for JSON fields
const KeyValueEditor = ({ value, onChange, label }: any) => {
  const obj = typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
  const entries = Object.entries(obj);

  const handleKeyChange = (oldKey: string, newKey: string, index: number) => {
    if (oldKey === newKey) return;
    const newObj: any = {};
    entries.forEach(([k, v], i) => {
      if (i === index) newObj[newKey] = v;
      else newObj[k] = v;
    });
    // Add empty new key if not present
    if (!newObj[newKey] && newKey !== '') newObj[newKey] = '';
    onChange(newObj);
  };

  const handleValChange = (key: string, newVal: string) => {
    onChange({ ...obj, [key]: newVal });
  };

  const addRow = () => {
    let newKey = 'new_key';
    let counter = 1;
    while (obj[newKey]) {
      newKey = `new_key_${counter}`;
      counter++;
    }
    onChange({ ...obj, [newKey]: '' });
  };

  const removeRow = (key: string) => {
    const newObj = { ...obj };
    delete newObj[key];
    onChange(newObj);
  };

  return (
    <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          <PlusCircle className="w-3 h-3" /> Add Field
        </button>
      </div>
      <div className="space-y-2">
        {entries.length === 0 && <div className="text-xs text-slate-400 italic">No fields added yet.</div>}
        {entries.map(([k, v], i) => (
          <div key={i} className="flex gap-2 items-start">
            <input 
              type="text" 
              value={k} 
              onChange={e => handleKeyChange(k, e.target.value, i)} 
              placeholder="Key"
              className="w-1/3 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
            />
            <input 
              type="text" 
              value={typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(v)} 
              onChange={e => {
                let parsedVal: any = e.target.value;
                if (parsedVal === 'true') parsedVal = true;
                else if (parsedVal === 'false') parsedVal = false;
                else if (!isNaN(Number(parsedVal)) && parsedVal !== '') parsedVal = Number(parsedVal);
                handleValChange(k, parsedVal);
              }}
              placeholder="Value"
              className="w-2/3 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
            />
            <button type="button" onClick={() => removeRow(k)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-200">
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const StringListEditor = ({ value, onChange, label }: any) => {
  const arr = Array.isArray(value) ? value : [];

  const updateItem = (index: number, newVal: string) => {
    const newArr = [...arr];
    newArr[index] = newVal;
    onChange(newArr);
  };

  const removeItem = (index: number) => {
    onChange(arr.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...arr, '']);
  };

  return (
    <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          <PlusCircle className="w-3 h-3" /> Add Item
        </button>
      </div>
      <div className="space-y-2">
        {arr.length === 0 && <div className="text-xs text-slate-400 italic">No items added yet.</div>}
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input 
              type="text" 
              value={item} 
              onChange={e => updateItem(i, e.target.value)} 
              placeholder="Item value"
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
            />
            <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-200">
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ObjectListEditor = ({ value, onChange, label }: any) => {
  const arr = Array.isArray(value) ? value : [];

  const updateItemObj = (index: number, newObj: any) => {
    const newArr = [...arr];
    newArr[index] = newObj;
    onChange(newArr);
  };

  const removeItem = (index: number) => {
    onChange(arr.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...arr, { name: '', details: '' }]);
  };

  return (
    <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          <PlusCircle className="w-3 h-3" /> Add Feature
        </button>
      </div>
      <div className="space-y-4">
        {arr.length === 0 && <div className="text-xs text-slate-400 italic">No features added yet.</div>}
        {arr.map((obj, i) => (
          <div key={i} className="relative bg-white p-3 rounded-lg border border-slate-200">
            <button type="button" onClick={() => removeItem(i)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded">
              <Trash className="w-3.5 h-3.5" />
            </button>
            <div className="mb-2 mr-6">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Name</label>
              <input type="text" value={obj.name || ''} onChange={e => updateItemObj(i, { ...obj, name: e.target.value })} className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-xs" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Details</label>
              <input type="text" value={obj.details || ''} onChange={e => updateItemObj(i, { ...obj, details: e.target.value })} className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InputField = ({ label, field, type = 'text', required = false, formData, setFormData, editingId }: any) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
    <input type={type} required={required} disabled={field === 'product_id' && !!editingId} 
           value={formData[field] || ''} 
           onChange={e => setFormData({...formData, [field]: e.target.value})} 
           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 outline-none text-sm" />
  </div>
);

const SortIcon = ({ field, sortField, sortDirection }: any) => {
  if (sortField !== field) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1 text-indigo-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
};

export default function FinosMarketplace() {
  const [products, setProducts] = useState<FrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  
  // Datatable state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof FrontProduct>('product_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const backendUrl = import.meta.env.VITE_FINOS_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://' + window.location.hostname + ':8000');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin_portal/marketplace`);
      if (!res.ok) throw new Error('Failed to fetch marketplace products');
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
      text: "You want to delete this marketplace product?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin_portal/marketplace/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      
      Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      fetchProducts();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Action failed', 'error');
    }
  };

  const openModal = (product?: FrontProduct) => {
    if (product) {
      setFormData({
        ...product,
        jurisdiction: product.jurisdiction || [],
        pricing: product.pricing || {},
        eligibility_rules: product.eligibility_rules || {},
        features: product.features || [],
        compliance: product.compliance || {},
      });
      setEditingId(product.product_id);
    } else {
      setFormData({
        product_id: `prod_${Math.random().toString(36).substr(2, 6)}`,
        provider_id: 'finos',
        product_type: 'savings',
        status: 'active',
        version: '1.0',
        effective_date: new Date().toISOString().split('T')[0],
        jurisdiction: ["PK"],
        pricing: { currency: "PKR", profit_rate: "0%" },
        eligibility_rules: { min_age: 18, min_income: 0 },
        features: [{ name: "Coverage", details: "1M" }],
        compliance: { sharia: false },
        schema_hash: '',
        published_by: 'admin',
        approved_by: 'admin',
        change_request: '',
        previous_version: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${backendUrl}/api/admin_portal/marketplace/${editingId}`
        : `${backendUrl}/api/admin_portal/marketplace`;
        
        const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      Swal.fire('Saved!', 'Marketplace product saved successfully.', 'success');
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Action failed', 'error');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500 w-full min-h-[500px]">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Loading Marketplace Products...</p>
      </div>
    );
  }

  const handleSort = (field: keyof FrontProduct) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(p => 
    (p.product_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.product_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.provider_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aVal = String(a[sortField] || '').toLowerCase();
    const bVal = String(b[sortField] || '').toLowerCase();
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative h-[calc(100vh-80px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-indigo-600" />
            Marketplace Products
          </h2>
          <p className="text-slate-500 mt-1">Manage global front-facing marketplace offerings based on FinOS schema</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProducts} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            Add Marketplace Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <input 
            type="text" 
            placeholder="Search products by ID, Type, or Provider..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-80 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="text-sm text-slate-500">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product_id')}>
                  Product ID <SortIcon field="product_id" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product_type')}>
                  Type <SortIcon field="product_type" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('provider_id')}>
                  Provider <SortIcon field="provider_id" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('version')}>
                  Version <SortIcon field="version" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map(product => (
                <tr key={product.product_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{product.product_id}</td>
                  <td className="px-6 py-4 capitalize">{product.product_type?.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{product.provider_id}</td>
                  <td className="px-6 py-4 text-slate-500">v{product.version}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {product.status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded" onClick={() => openModal(product)}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 rounded" onClick={() => handleDelete(product.product_id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No marketplace products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-1.5 text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Marketplace Product' : 'Add Marketplace Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <InputField label="Product ID *" field="product_id" required formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Provider ID *" field="provider_id" required formData={formData} setFormData={setFormData} editingId={editingId} />
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product Type *</label>
                  <select required value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm">
                    <option value="savings">Savings</option>
                    <option value="credit_cards">Credit Cards</option>
                    <option value="personal_loans">Personal Loans</option>
                    <option value="health_insurance">Health Insurance</option>
                    <option value="motor_insurance">Motor Insurance</option>
                    <option value="life_takaful">Life / Takaful</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status *</label>
                  <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                
                <InputField label="Version *" field="version" required formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Effective Date" field="effective_date" type="date" formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Schema Hash" field="schema_hash" formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Published By" field="published_by" formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Approved By" field="approved_by" formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Change Request" field="change_request" formData={formData} setFormData={setFormData} editingId={editingId} />
                <InputField label="Previous Version" field="previous_version" formData={formData} setFormData={setFormData} editingId={editingId} />
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-500" />
                  Product Configuration
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <KeyValueEditor 
                    label="Pricing Configuration" 
                    value={formData.pricing} 
                    onChange={(val: any) => setFormData({...formData, pricing: val})} 
                  />
                  <KeyValueEditor 
                    label="Eligibility Rules" 
                    value={formData.eligibility_rules} 
                    onChange={(val: any) => setFormData({...formData, eligibility_rules: val})} 
                  />
                  <KeyValueEditor 
                    label="Compliance Requirements" 
                    value={formData.compliance} 
                    onChange={(val: any) => setFormData({...formData, compliance: val})} 
                  />
                  <StringListEditor 
                    label="Jurisdictions" 
                    value={formData.jurisdiction} 
                    onChange={(val: any) => setFormData({...formData, jurisdiction: val})} 
                  />
                </div>
                
                <div className="mt-2">
                  <ObjectListEditor 
                    label="Product Features" 
                    value={formData.features} 
                    onChange={(val: any) => setFormData({...formData, features: val})} 
                  />
                </div>
              </div>
            </form>
            
            <div className="p-6 pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors border border-slate-200">
                Cancel
              </button>
              <button type="submit" onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <Save className="w-4 h-4" />
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
