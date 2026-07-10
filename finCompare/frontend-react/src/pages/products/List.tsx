
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ProductsList = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products');
      return res.data;
    }
  });

  return (
    <div className="products-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Products</h2>
        <Link to="/products/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#0088cc', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="table-container" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading products...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7f9fc', borderBottom: '1px solid #edf1f7' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Provider</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #edf1f7' }}>
                  <td style={{ padding: '16px' }}>{p.id}</td>
                  <td style={{ padding: '16px' }}>{p.provider_id}</td>
                  <td style={{ padding: '16px' }}>{p.product_type}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`status-badge ${p.status}`} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: p.status === 'active' ? '#e6f2fa' : '#f7f9fc', color: p.status === 'active' ? '#0088cc' : '#666' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link to={`/products/edit/${p.id}`} style={{ marginRight: '12px', color: '#0088cc' }}><Edit size={18} /></Link>
                    <button style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {!products?.length && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductsList;
