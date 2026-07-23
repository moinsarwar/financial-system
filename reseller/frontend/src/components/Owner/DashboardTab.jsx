import React from 'react';  
  
const DashboardTab = ({ reseller, stats, customers, activities, testimonials, onAddTestimonial, onCopyLink, onShowModal }) => {  
  return (  
    <div>  
      <div className="owner-grid">  
        <div className="stat-card" onClick={() => onShowModal('Visits (30d)', 'Total visits: 2,410')}>  
          <div className="num">{stats.visits}</div>  
          <div className="label">Visits</div>  
        </div>  
        <div className="stat-card" onClick={() => onShowModal('Conversions (30d)', 'Your conversions: ' + stats.conversions)}>  
          <div className="num green">{stats.conversions}</div>  
          <div className="label">Conversions</div>  
        </div>  
        <div className="stat-card" onClick={() => onShowModal('Commission Earned', 'Total: ₨ ' + stats.commission.toLocaleString())}>  
          <div className="num gold">₨ {stats.commission.toLocaleString()}</div>  
          <div className="label">Commission</div>  
        </div>  
        <div className="stat-card" onClick={() => onShowModal('Conversion Rate', 'Rate: ' + stats.conversionRate)}>  
          <div className="num">{stats.conversionRate}</div>  
          <div className="label">Conversion Rate</div>  
        </div>  
      </div>  
  
      <h3 style={{ fontWeight: '700', marginTop: '8px' }}>🚀 Launch Checklist</h3>  
      <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Complete these steps to go live and start earning.</p>  
      <div className="setup-steps">  
        <div className="setup-step"><div className="step-num">1</div><h4>Brand</h4><p>Upload logo & colors</p><button className="btn btn-secondary btn-sm" style={{ marginTop: '4px' }} onClick={() => onShowModal('Branding', 'Upload your logo and set brand colors.')}>Customize</button></div>  
        <div className="setup-step"><div className="step-num">2</div><h4>Domain</h4><p>Connect your domain</p><button className="btn btn-secondary btn-sm" style={{ marginTop: '4px' }} onClick={() => onShowModal('Domain Setup', 'Point your domain to our servers.')}>Configure</button></div>  
        <div className="setup-step"><div className="step-num">3</div><h4>Payment</h4><p>Set up bank account</p><button className="btn btn-secondary btn-sm" style={{ marginTop: '4px' }} onClick={() => onShowModal('Payment Info', 'Add your bank account details.')}>Add Info</button></div>  
        <div className="setup-step"><div className="step-num">4</div><h4>Launch</h4><p>Go live and earn</p><button className="btn btn-success btn-sm" style={{ marginTop: '4px' }} onClick={() => onShowModal('Launch', 'Your site is now live! 🎉')}>Launch</button></div>  
      </div>  
  
      <h3 style={{ fontWeight: '700', margin: '16px 0 8px' }}>📊 Recent Activity</h3>  
      <div className="table-wrap">  
        <table>  
          <thead><tr><th>Date</th><th>Product</th><th>Conversion</th><th>Commission</th></tr></thead>  
          <tbody>  
            {activities.slice(0, 5).map(act => (  
              <tr key={act.id}>  
                <td>{new Date(act.date).toLocaleDateString()}</td>  
                <td>{act.product}</td>  
                <td><span className={`status-badge ${act.conversion_status === 'Approved' ? 'active' : act.conversion_status === 'Pending' ? 'pending' : 'suspended'}`}>{act.conversion_status}</span></td>  
                <td>{act.commission > 0 ? '₨ ' + act.commission.toLocaleString() : '₨ 0'}</td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
  
      <div className="referral-section">  
        <h3><i className="fas fa-share-alt" style={{ color: 'var(--secondary)' }}></i> Grow Your Business</h3>  
        <p className="sub">Share your subdomain with everyone. Every new user earns you commissions.</p>  
        <div className="referral-actions">  
          <button className="btn btn-primary" onClick={onCopyLink}><i className="fas fa-copy"></i> Copy Link</button>  
          <button className="btn btn-gold" onClick={() => onShowModal('Email', 'Send referral email')}><i className="fas fa-envelope"></i> Email</button>  
          <button className="btn btn-secondary" onClick={() => onShowModal('Social', 'Share on social media')}><i className="fas fa-share"></i> Social</button>  
          <button className="btn btn-success" onClick={() => onShowModal('Referral Request', 'Send request to friends')}><i className="fas fa-user-plus"></i> Request</button>  
        </div>  
        <div style={{ marginTop: '12px', background: 'var(--bg)', padding: '10px 16px', borderRadius: '12px', wordBreak: 'break-all' }}>  
          <span style={{ fontWeight: '600' }}>Your link:</span>  
          <code style={{ background: 'var(--card-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', display: 'inline-block', marginTop: '4px' }}>  
            https://{reseller.subdomain}.compareengine.pk?ref=owner  
          </code>  
        </div>  
      </div>  
  
      <div className="owner-testimonials">  
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>  
          <h3 style={{ fontWeight: '700' }}><i className="fas fa-star" style={{ color: 'var(--gold)' }}></i> Testimonials</h3>  
          <button className="btn btn-secondary btn-sm" onClick={() => onShowModal('Add Testimonial', `  
            <form id="testimonialForm">  
              <div class="form-group"><label>Name</label><input type="text" id="testimonialName" /></div>  
              <div class="form-group"><label>Comment</label><textarea id="testimonialComment" rows="3"></textarea></div>  
              <div class="form-group"><label>Rating (1-5)</label><input type="number" id="testimonialRating" min="1" max="5" /></div>  
              <button class="btn btn-primary" type="submit">Add</button>  
            </form>  
          `)}><i className="fas fa-plus"></i> Add</button>  
        </div>  
        {testimonials.length === 0 ? (  
          <p className="text-muted">No testimonials yet.</p>  
        ) : (  
          testimonials.map(t => (  
            <div key={t.id} className="testimonial-item">  
              <div>  
                <div className="stars">{'★'.repeat(t.rating) + '☆'.repeat(5 - t.rating)}</div>  
                <p style={{ margin: '2px 0' }}>“{t.comment}”</p>  
                <div className="author">{t.name}</div>  
              </div>  
              <div className="date">{new Date(t.date).toLocaleDateString()}</div>  
            </div>  
          ))  
        )}  
      </div>  
    </div>  
  );  
};  
  
export default DashboardTab;
