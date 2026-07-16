import React, { useState } from 'react';  
import { useQuery } from '@tanstack/react-query';  
import { getProducts, Product } from '../api/products';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Table } from '../components/common/Table';  
import { Badge } from '../components/common/Badge';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
  
export const Products: React.FC = () => {  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [search, setSearch] = useState('');  
  const [type, setType] = useState(searchParams.get('product_type') || 'all');  
  const [status, setStatus] = useState(searchParams.get('status') || 'all');  
  const department = searchParams.get('department') || 'all';  
  
  const { data, isLoading } = useQuery({  
    queryKey: ['products', { search, type, status, department }],  
    queryFn: () =>  
      getProducts({  
        search: search || undefined,  
        product_type: type === 'all' ? undefined : type,  
        status: status === 'all' ? undefined : status,  
        department: department === 'all' ? undefined : department,  
      }),  
  });  
  
  const columns = [  
    { key: 'id', header: 'ID' },  
    { key: 'product_label', header: 'Product' },  
    { key: 'client_name', header: 'Client' },  
    { key: 'product_type', header: 'Type' },  
    {  
      key: 'status',  
      header: 'Status',  
      render: (v: string) => <Badge type={v}>{v}</Badge>,  
    },  
    {  
      key: 'actions',  
      header: 'Actions',  
      render: (_: any, row: Product) => (  
        <button className="btn-sm primary" onClick={() => navigate(`/dashboard/products/${row.id}`)}>  
          View  
        </button>  
      ),  
    },  
  ];  
  
  return (  
    <div>  
      <SearchFilterBar  
        search={search}  
        onSearchChange={setSearch}  
        filters={[  
          {  
            key: 'type',  
            label: 'Type',  
            options: ['all', 'motor', 'health', 'life', 'travel', 'business', 'loan', 'savings', 'credit'],  
            value: type,  
            onChange: setType,  
          },  
          {  
            key: 'status',  
            label: 'Status',  
            options: ['all', 'active', 'expired', 'closed'],  
            value: status,  
            onChange: setStatus,  
          },  
        ]}  
      />  
      <Table columns={columns} data={data || []} loading={isLoading} />  
    </div>  
  );  
};
