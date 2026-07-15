import { useState, useEffect } from 'react';
import { FileText, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface Application {
  id: string;
  client_id: string;
  product_type: string;
  product_label: string;
  status: string;
  current_step: string;
  created_at: string;
  amount: number;
}

export default function FinosApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const backendUrl = import.meta.env.VITE_FINOS_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://' + window.location.hostname + ':8000');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin_portal/applications`);
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAdvance = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/admin_portal/applications/${id}/advance`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Advance failed');
      }
      Swal.fire('Success', 'Application advanced successfully.', 'success');
      fetchApplications();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Advance failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this application?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin_portal/applications/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      
      Swal.fire('Deleted!', 'Application has been deleted.', 'success');
      fetchApplications();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Action failed', 'error');
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500 w-full min-h-[500px]">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Loading Applications...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Client Applications
          </h2>
          <p className="text-slate-500 mt-1">Manage and advance in-progress product applications</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchApplications} className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
                <th className="px-6 py-4 font-medium">App ID</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Step</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{app.id.substring(0,8)}...</td>
                  <td className="px-6 py-4">{app.product_label}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">PKR {app.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize text-indigo-600 font-medium">
                    {app.current_step.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      app.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      app.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button 
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      onClick={() => handleAdvance(app.id)}
                      disabled={app.status !== 'in-progress'}
                    >
                      Advance <ChevronRight className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 rounded" onClick={() => handleDelete(app.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No applications found</p>
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
