import React from 'react';  
  
const CustomersTab = ({ customers }) => {  
  return (  
    <div>  
      <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>My Customers</h3>  
      <p className="text-muted mb-16">Leads and conversions from your subdomain.</p>  
      <div className="table-wrap">  
        <table>  
          <thead><tr><th>Name</th><th>Email</th><th>Product</th><th>Status</th><th>Date</th></tr></thead>  
          <tbody>  
            {customers.map(c => (  
              <tr key={c.id}>  
                <td>{c.name}</td>  
                <td>{c.email}</td>  
                <td>{c.product}</td>  
                <td><span className={`status-badge ${c.status === 'Approved' ? 'active' : c.status === 'Pending' ? 'pending' : 'suspended'}`}>{c.status}</span></td>  
                <td>{new Date(c.date).toLocaleDateString()}</td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
    </div>  
  );  
};  
export default CustomersTab;
