import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useQuery } from '@tanstack/react-query';  
import { getDocument } from '../api/documents';  
import { Badge } from '../components/common/Badge';  
import { DetailPanel } from '../components/common/DetailPanel';  
import api from '../api/client';

const FileViewer: React.FC<{ documentId: string; mimeType: string; fileName: string }> = ({ documentId, mimeType, fileName }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    const loadFile = async () => {
      try {
        const response = await api.get(`/documents/${documentId}/download`, {
          responseType: 'blob'
        });
        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadFile();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  if (loading) return <div className="p-4 text-gray-500">Loading file preview...</div>;
  if (error || !url) return <div className="p-4 text-red-500">Failed to load file preview.</div>;

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex justify-between items-center bg-gray-100 p-3 rounded">
        <span className="font-semibold text-gray-700">{fileName}</span>
        <a href={url} download={fileName} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Download</a>
      </div>
      <div className="border rounded overflow-hidden flex justify-center bg-gray-50 p-4">
        {mimeType?.startsWith('image/') ? (
          <img src={url} alt={fileName} className="max-w-full h-auto max-h-[500px] object-contain" />
        ) : mimeType === 'application/pdf' ? (
          <iframe src={url} className="w-full h-[500px]" title={fileName} />
        ) : (
          <div className="p-8 text-gray-500">Preview not available for this file type. Please download to view.</div>
        )}
      </div>
    </div>
  );
};

  
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
      onClose={() => navigate('/dashboard/documents')}  
      title={data.name}  
      subhead={`${data.type} · ${data.client_name}`}  
      actions={<button className="btn-sm outline" onClick={() => navigate('/dashboard/documents')}>Close</button>}  
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
        <div className="sm:col-span-2">
          {data.mime_type && data.mime_type !== 'Not recorded' ? (
            <FileViewer documentId={data.id} mimeType={data.mime_type} fileName={data.original_filename || data.name} />
          ) : (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">  
              File metadata is recorded, but the file itself is not yet stored in object storage. Preview and download are therefore unavailable in this MVP simulation.  
            </div>
          )}
        </div>
      </div>  
    </DetailPanel>  
  );  
};
