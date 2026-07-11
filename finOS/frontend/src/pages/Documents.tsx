import React, { useState } from 'react';  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  
import { getDocuments, uploadDocument, Document } from '../api/documents';  
import { getClients } from '../api/clients';  
import { useAuth } from '../contexts/AuthContext';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Table } from '../components/common/Table';  
import { Badge } from '../components/common/Badge';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
import { Modal } from '../components/common/Modal';  
import { can } from '../utils/permissions';  
import toast from 'react-hot-toast';  
  
export const Documents: React.FC = () => {  
  const { user } = useAuth();  
  const queryClient = useQueryClient();  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [search, setSearch] = useState('');  
  const [docType, setDocType] = useState('all');  
  const department = searchParams.get('department') || 'all';  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [uploadData, setUploadData] = useState({  
    client_id: '',  
    name: '',  
    type: 'General',  
    ref_id: '',  
    ref_type: '',  
    file: null as File | null,  
  });  
  
  // Fetch clients for dropdown  
  const { data: clientData = [] } = useQuery({  
    queryKey: ['clients-list'],  
    queryFn: () => getClients({}),  
  });  
  const clients = clientData.map((c: any) => ({ id: c.id, name: c.name }));  
  
  const { data, isLoading } = useQuery({  
    queryKey: ['documents', { search, docType, department }],  
    queryFn: () =>  
      getDocuments({  
        search: search || undefined,  
        doc_type: docType === 'all' ? undefined : docType,  
        department: department === 'all' ? undefined : department,  
      }),  
  });  
  
  const uploadMutation = useMutation({  
    mutationFn: uploadDocument,  
    onSuccess: () => {  
      toast.success('Document uploaded');  
      queryClient.invalidateQueries({ queryKey: ['documents'] });  
      setIsModalOpen(false);  
      setUploadData({ client_id: '', name: '', type: 'General', ref_id: '', ref_type: '', file: null });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Upload failed');  
    },  
  });  
  
  const columns = [  
    { key: 'name', header: 'Name' },  
    { key: 'client_name', header: 'Client' },  
    {  
      key: 'type',  
      header: 'Type',  
      render: (v: string) => <Badge type="pending">{v}</Badge>,  
    },  
    {  
      key: 'status',  
      header: 'Status',  
      render: (v: string) => <Badge type={v}>{v}</Badge>,  
    },  
    { key: 'uploaded_at', header: 'Uploaded' },  
    {  
      key: 'actions',  
      header: 'Actions',  
      render: (_: any, row: Document) => (  
        <button className="btn-sm primary" onClick={() => navigate(`/documents/${row.id}`)}>  
          Preview  
        </button>  
      ),  
    },  
  ];  
  
  const handleUpload = () => {  
    const effectiveClientId = user?.role === 'client' ? user.client_id ?? '' : uploadData.client_id;
    if (!effectiveClientId || !uploadData.name || !uploadData.file) {  
      toast.error('Please fill all required fields and select a file');  
      return;  
    }  
    uploadMutation.mutate({  
      client_id: effectiveClientId,  
      name: uploadData.name,  
      type: uploadData.type,  
      ref_id: uploadData.ref_id || undefined,  
      ref_type: uploadData.ref_type || undefined,  
      file: uploadData.file,  
    });  
  };  
  
  return (  
    <div>  
      <div className="flex justify-between items-center mb-4">  
        <SearchFilterBar  
          search={search}  
          onSearchChange={setSearch}  
          filters={[  
            {  
              key: 'docType',  
              label: 'Type',  
              options: ['all', 'KYC', 'Application', 'Policy', 'Claim Evidence', 'Insurer Correspondence', 'General'],  
              value: docType,  
              onChange: setDocType,  
            },  
          ]}  
        />  
        {can(user?.role, 'document.upload') && (  
          <button className="btn-sm primary" onClick={() => setIsModalOpen(true)}>  
            📤 Upload Document  
          </button>  
        )}  
      </div>  
      <Table columns={columns} data={data || []} loading={isLoading} />  
  
      <Modal  
        isOpen={isModalOpen}  
        onClose={() => setIsModalOpen(false)}  
        title="Upload Document"  
        onSave={handleUpload}  
        loading={uploadMutation.isPending}  
        saveLabel="Upload"  
      >  
        <div className="space-y-3">  
          {user?.role !== 'client' && (
            <div className="form-group">  
              <label className="form-label">Client *</label>  
              <select  
                className="form-input"  
                value={uploadData.client_id}  
                onChange={(e) => setUploadData({ ...uploadData, client_id: e.target.value })}  
              >  
                <option value="">Select client</option>  
                {clients.map((c: any) => (  
                  <option key={c.id} value={c.id}>{c.name}</option>  
                ))}  
              </select>  
            </div>  
          )}
          <div className="form-group">  
            <label className="form-label">Document Name *</label>  
            <input  
              type="text"  
              className="form-input"  
              value={uploadData.name}  
              onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}  
            />  
          </div>  
          <div className="form-group">  
            <label className="form-label">Document Type *</label>  
            <select  
              className="form-input"  
              value={uploadData.type}  
              onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}  
            >  
              <option value="KYC">KYC</option>  
              <option value="Application">Application</option>  
              <option value="Policy">Policy</option>  
              <option value="Claim Evidence">Claim Evidence</option>  
              <option value="Insurer Correspondence">Insurer Correspondence</option>  
              <option value="General">General</option>  
            </select>  
          </div>  
          <div className="form-group">  
            <label className="form-label">Reference ID (optional)</label>  
            <input  
              type="text"  
              className="form-input"  
              value={uploadData.ref_id}  
              onChange={(e) => setUploadData({ ...uploadData, ref_id: e.target.value })}  
              placeholder="e.g., APP-1234"  
            />  
          </div>  
          <div className="form-group">  
            <label className="form-label">Reference Type (optional)</label>  
            <select  
              className="form-input"  
              value={uploadData.ref_type}  
              onChange={(e) => setUploadData({ ...uploadData, ref_type: e.target.value })}  
            >  
              <option value="">None</option>  
              <option value="application">Application</option>  
              <option value="claim">Claim</option>  
              <option value="policy">Policy</option>  
              <option value="client">Client</option>  
            </select>  
          </div>  
          <div className="form-group">  
            <label className="form-label">File *</label>  
            <input  
              type="file"  
              className="form-input"  
              onChange={(e) => {  
                const file = e.target.files?.[0] || null;  
                setUploadData({ ...uploadData, file });  
              }}  
            />  
          </div>  
        </div>  
      </Modal>  
    </div>  
  );  
};
