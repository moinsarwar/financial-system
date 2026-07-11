import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useQuery } from '@tanstack/react-query';  
import { getClient } from '../api/clients';  
import { DetailPanel } from '../components/common/DetailPanel';  
import { Badge } from '../components/common/Badge';  
  
export const ClientDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['client', id],  
    queryFn: () => getClient(id as string),  
    enabled: Boolean(id),  
  });  
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Client not found</div>;  
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/clients')}  
      title={data.name}  
      subhead={`${data.email}${data.phone ? ` · ${data.phone}` : ''}`}  
      actions={  
        <button className="btn-sm outline" onClick={() => navigate('/clients')}>  
          Close  
        </button>  
      }  
    >  
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
        <div><span className="font-semibold">ID:</span> {data.id}</div>  
        <div><span className="font-semibold">Stage:</span> <Badge type={data.lifecycle_stage}>{data.lifecycle_stage}</Badge></div>  
        <div><span className="font-semibold">Open Claim:</span> {data.has_open_claim ? 'Yes' : 'No'}</div>  
        <div><span className="font-semibold">Department:</span> {data.assigned_department}</div>  
        <div><span className="font-semibold">Created:</span> {new Date(data.created_at).toLocaleString()}</div>  
        <div><span className="font-semibold">Last Activity:</span> {new Date(data.last_activity).toLocaleString()}</div>  
        <div><span className="font-semibold">Engagement:</span> {data.engagement_score}%</div>  
      </div>  
    </DetailPanel>  
  );  
};
