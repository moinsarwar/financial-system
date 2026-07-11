import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useQuery } from '@tanstack/react-query';  
import { getDocument } from '../api/documents';  
import { Badge } from '../components/common/Badge';  
import { DetailPanel } from '../components/common/DetailPanel';  
  
const formatBytes = (bytes: number | null): string => {  
  if (bytes === null) return 'Not recorded';  
  if (bytes < 1024) return `${bytes} bytes`;  
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;  
};  
  
export const DocumentDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['document', id],  
    queryFn: () => getDocument(id as string),  
    enabled: Boolean(id),  
  });  
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Document not found</div>;  
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/documents')}  
      title={data.name}  
      subhead={`${data.type} · ${data.client_name}`}  
      actions={<button className="btn-sm outline" onClick={() => navigate('/documents')}>Close</button>}  
    >  
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
        <div><span className="font-semibold">Document ID:</span> {data.id}</div>  
        <div><span className="font-semibold">Status:</span> <Badge type={data.status}>{data.status}</Badge></div>  
        <div><span className="font-semibold">Client:</span> {data.client_name}</div>  
        <div><span className="font-semibold">MIME Type:</span> {data.mime_type || 'Not recorded'}</div>  
        <div><span className="font-semibold">Size:</span> {formatBytes(data.size_bytes)}</div>  
        <div><span className="font-semibold">Uploaded:</span> {new Date(data.uploaded_at).toLocaleString()}</div>  
        <div><span className="font-semibold">Reference Type:</span> {data.ref_type || 'None'}</div>  
        <div><span className="font-semibold">Reference ID:</span> {data.ref_id || 'None'}</div>  
        <div className="sm:col-span-2">  
          <span className="font-semibold">SHA-256 Checksum:</span>  
          <div className="mt-1 break-all rounded-md bg-gray-50 p-2 font-mono text-xs">  
            {data.checksum || 'Not recorded'}  
          </div>  
        </div>  
        <div className="sm:col-span-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">  
          File metadata is recorded, but the file itself is not yet stored in object storage. Preview and download are therefore unavailable in this MVP simulation.  
        </div>  
      </div>  
    </DetailPanel>  
  );  
};
