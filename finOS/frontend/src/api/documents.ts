import api from './client';  
  
export interface Document {  
  id: string;  
  client_id: string;  
  client_name: string;  
  type: string;  
  name: string;  
  ref_id: string | null;  
  ref_type: string | null;  
  uploaded_at: string;  
  status: 'pending' | 'verified' | 'rejected';  
  file_url: string | null;  
  mime_type: string | null;  
  size_bytes: number | null;  
  checksum?: string;  
  storage_key?: string;  
  uploaded_by_user?: string;
  original_filename?: string;
  is_missing?: boolean;
}  
  
export interface DocumentUpload {  
  client_id: string;  
  name: string;  
  type: string;  
  ref_id?: string;  
  ref_type?: string;  
  file: File;  
}  
  
export async function getDocuments(params?: {  
  search?: string;  
  doc_type?: string;  
  department?: string;  
  ref_id?: string;
}): Promise<Document[]> {  
  const { data } = await api.get<Document[]>('/documents', { params });  
  return data;  
}  
  
export async function getDocument(id: string): Promise<Document> {  
  const { data } = await api.get<Document>(`/documents/${id}`);  
  return data;  
}  
  
export async function uploadDocument(payload: DocumentUpload): Promise<Document> {  
  const formData = new FormData();  
  formData.append('client_id', payload.client_id);  
  formData.append('name', payload.name);  
  formData.append('doc_type', payload.type);  
  if (payload.ref_id) formData.append('ref_id', payload.ref_id);  
  if (payload.ref_type) formData.append('ref_type', payload.ref_type);  
  formData.append('file', payload.file);  
  
  const { data } = await api.post<Document>('/documents/upload', formData, {  
    headers: { 'Content-Type': 'multipart/form-data' },  
  });  
  return data;  
}

export async function downloadDocument(id: string, filename: string) {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
}
