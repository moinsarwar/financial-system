
import { useParams, useNavigate } from 'react-router-dom';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Product ${id} updated!`);
    navigate('/products');
  };

  return (
    <div className="product-form-page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2>Edit Product {id}</h2>
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Provider ID</label>
            <input type="text" defaultValue="example_provider" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Product Type</label>
            <select defaultValue="personal_loan" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec' }} required>
              <option value="personal_loan">Personal Loan</option>
              <option value="auto_loan">Auto Loan</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Status</label>
            <select defaultValue="active" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec' }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', background: '#0088cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
