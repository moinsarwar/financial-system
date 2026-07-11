import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useQuery } from '@tanstack/react-query';  
import { getProduct } from '../api/products';  
import { Badge } from '../components/common/Badge';  
import { DetailPanel } from '../components/common/DetailPanel';  
  
export const ProductDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['product', id],  
    queryFn: () => getProduct(id as string),  
    enabled: Boolean(id),  
  });  
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Product not found</div>;  
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/products')}  
      title={data.policy_number || data.id}  
      subhead={`${data.product_label} · ${data.client_name}`}  
      actions={<button className="btn-sm outline" onClick={() => navigate('/products')}>Close</button>}  
    >  
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
        <div><span className="font-semibold">Product:</span> {data.product_label}</div>  
        <div><span className="font-semibold">Type:</span> {data.product_type}</div>  
        <div><span className="font-semibold">Status:</span> <Badge type={data.status}>{data.status}</Badge></div>  
        {data.policy_number && <div><span className="font-semibold">Policy #:</span> {data.policy_number}</div>}  
        {data.start_date && <div><span className="font-semibold">Start:</span> {new Date(data.start_date).toLocaleString()}</div>}  
        {data.end_date && <div><span className="font-semibold">End:</span> {new Date(data.end_date).toLocaleString()}</div>}  
        {data.premium !== undefined && <div><span className="font-semibold">Premium:</span> PKR {data.premium.toLocaleString()}</div>}  
        {data.sum_assured !== undefined && <div><span className="font-semibold">Sum Assured:</span> PKR {data.sum_assured.toLocaleString()}</div>}  
        {data.holding_type && <div><span className="font-semibold">Holding Type:</span> {data.holding_type}</div>}  
        {data.opened_at && <div><span className="font-semibold">Opened:</span> {new Date(data.opened_at).toLocaleString()}</div>}  
        {data.details && (  
          <div className="sm:col-span-2">  
            <span className="font-semibold">Details:</span>  
            <pre className="mt-2 overflow-x-auto rounded-md bg-gray-50 p-3 text-xs">  
              {JSON.stringify(data.details, null, 2)}  
            </pre>  
          </div>  
        )}  
      </div>  
    </DetailPanel>  
  );  
};
