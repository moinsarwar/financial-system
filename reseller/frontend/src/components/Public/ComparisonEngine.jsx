import React, { useState, useEffect } from 'react';  
import apiClient from '../../api/client';  
  
const ComparisonEngine = () => {  
  const [category, setCategory] = useState('personal');  
  const [amount, setAmount] = useState(500000);  
  const [products, setProducts] = useState([]);  
  const [stats, setStats] = useState({ total_banks: 0, total_products: 0 });
  
  useEffect(() => {  
    const fetchProducts = async () => {  
      try {  
        const response = await apiClient.get(`/products/${category}`);  
        setProducts(response.data);  
      } catch (error) {  
        console.error('Failed to fetch products:', error);  
      }  
    };  
    fetchProducts();  
  }, [category]);  
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/products/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleCompare = () => {  
    // re-fetch or just rely on useEffect  
  };  
  
  return (  
    <div className="demo-engine">  
      <div className="demo-header">  
        <div>  
          <h2>🔍 Live Comparison Engine</h2>  
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Real‑time data from Pakistan's top banks.</p>  
        </div>  
        <div className="live-badge"><i className="fas fa-circle"></i> Live Data</div>  
      </div>  
      <div className="filter-row" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>  
        <div className="form-group" style={{ flex: '1 1 200px' }}>  
          <label><i className="fas fa-tag"></i> Category</label>  
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>  
            <option value="personal">Personal Loans</option>  
            <option value="mortgage">Home Loans</option>  
            <option value="auto">Car Loans</option>  
            <option value="credit">Credit Cards</option>  
            <option value="health">Health Insurance</option>  
          </select>  
        </div>  
        <div className="form-group" style={{ flex: '1 1 200px' }}>  
          <label><i className="fas fa-rupee-sign"></i> Amount (PKR)</label>  
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%' }} />  
        </div>  
        <div className="form-group" style={{flex:'0 0 auto'}}>  
          <button className="btn btn-primary" onClick={handleCompare}><i className="fas fa-search"></i> Compare</button>  
        </div>  
      </div>  
      <div style={{overflowX:'auto'}}>  
        <table className="product-table">  
          <thead>  
            <tr><th>Bank</th><th>Product</th><th>Rate</th><th>Fee</th><th>Tenure</th><th>Action</th></tr>  
          </thead>  
          <tbody>  
            {products.map((p, idx) => (  
              <tr key={idx}>  
                <td className="bank-name">{p.bank}</td>  
                <td>{p.product}</td>  
                <td className="rate">{p.rate}</td>  
                <td className="fee">{p.fee}</td>  
                <td>{p.tenure}</td>  
                <td><button className="apply-btn" onClick={() => alert('Apply clicked for ' + p.bank)}>Apply</button></td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
      <div className="demo-stats">  
        <span><strong>{stats.total_banks}</strong> banks live</span>  
        <span><strong>{stats.total_products}</strong> products compared</span>  
        <span><strong>Updated:</strong> just now</span>  
        <span><i className="fas fa-shield-alt" style={{color:'var(--secondary)'}}></i> Secure</span>  
      </div>  
    </div>  
  );  
};  
  
export default ComparisonEngine;
