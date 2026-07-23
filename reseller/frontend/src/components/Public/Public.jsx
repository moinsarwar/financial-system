import React, { useState } from 'react';  
import Hero from './Hero';  
import SimulatorTabs from './SimulatorTabs';  
import CustomerJourney from './CustomerJourney';  
import EarningsSimulator from './EarningsSimulator';  
import BusinessGrowth from './BusinessGrowth';  
import DayInLife from './DayInLife';  
import ConfidenceCheck from './ConfidenceCheck';  
import AdminSnapshot from './AdminSnapshot';  
import MarketingTools from './MarketingTools';  
import ComparisonEngine from './ComparisonEngine';  
import ComparisonTable from './ComparisonTable';  
import Testimonials from './Testimonials';  
import SignupForm from './SignupForm';  
import { useAuth } from '../../context/AuthContext';  
  
const Public = () => {  
  const [activeSimTab, setActiveSimTab] = useState('sim1');  
  const { role } = useAuth();  
  
  return (  
    <div className="container">  
      <Hero />  
        
      <div style={{background:'var(--card-bg)',borderRadius:'var(--radius)',padding:'20px 16px',border:'1px solid var(--border)',boxShadow:'var(--shadow)',margin:'24px 0 32px'}}>  
        <h2 className="section-title text-center" style={{fontSize:'1.4rem'}}>  
          Explore the <span className="gold">Interactive Business Simulator</span>  
        </h2>  
        <p className="section-sub centered" style={{fontSize:'0.95rem',marginBottom:'16px'}}>  
          Experience exactly how the reseller business works — from customer journey to earnings, growth, and platform management.  
        </p>  
  
        <SimulatorTabs activeTab={activeSimTab} setActiveTab={setActiveSimTab} />  
  
        <div className="sim-tab-content active" id="sim1" style={{display: activeSimTab === 'sim1' ? 'block' : 'none'}}>  
          <CustomerJourney />  
        </div>  
        <div className="sim-tab-content" id="sim2" style={{display: activeSimTab === 'sim2' ? 'block' : 'none'}}>  
          <EarningsSimulator />  
        </div>  
        <div className="sim-tab-content" id="sim3" style={{display: activeSimTab === 'sim3' ? 'block' : 'none'}}>  
          <BusinessGrowth />  
        </div>  
        <div className="sim-tab-content" id="sim4" style={{display: activeSimTab === 'sim4' ? 'block' : 'none'}}>  
          <DayInLife />  
        </div>  
        <div className="sim-tab-content" id="sim5" style={{display: activeSimTab === 'sim5' ? 'block' : 'none'}}>  
          <ConfidenceCheck />  
        </div>  
        <div className="sim-tab-content" id="sim6" style={{display: activeSimTab === 'sim6' ? 'block' : 'none'}}>  
          <AdminSnapshot />  
        </div>  
        <div className="sim-tab-content" id="sim7" style={{display: activeSimTab === 'sim7' ? 'block' : 'none'}}>  
          <MarketingTools />  
        </div>  
  
        <div style={{textAlign:'center',marginTop:'24px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>  
          <p style={{fontSize:'1rem',fontWeight:'600',color:'var(--primary)'}}>  
            You've just experienced what your business could look like.<br />  
            <span style={{color:'var(--secondary)'}}>Now build your own.</span>  
          </p>  
          <button className="btn btn-gold mt-16" onClick={() => document.getElementById('signupForm').scrollIntoView({behavior:'smooth'})}>  
            <i className="fas fa-user-plus"></i> Start Your Reseller Journey  
          </button>  
        </div>  
      </div>  
  
      <div style={{background:'var(--primary)',borderRadius:'var(--radius)',padding:'24px 16px',color:'#fff',margin:'24px 0 32px'}}>  
        <h2 className="text-center" style={{fontSize:'1.4rem',fontWeight:'800'}}>  
          Your Business in <span style={{color:'var(--gold)'}}>7 Simple Steps</span>  
        </h2>  
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'16px'}}>  
          {[1,2,3,4,5,6,7].map(step => (  
            <div key={step} style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'12px',textAlign:'center',fontSize:'0.8rem', gridColumn: step === 7 ? '1/3' : 'auto'}}>  
              <span style={{display:'inline-block',background:'var(--gold)',color:'var(--primary)',borderRadius:'50%',width:'28px',height:'28px',lineHeight:'28px',fontWeight:'800',marginBottom:'4px'}}>{step}</span>  
              <p>{  
                ['Join the Programme','Receive Website','Promote','Customers Compare','Enquiries','Earn Commissions','Track Everything in Dashboard'][step-1]  
              }</p>  
            </div>  
          ))}  
        </div>  
      </div>  
  
      <ComparisonEngine />  
      <ComparisonTable />  
        
      <div className="relationship-section">  
        <div>  
          <h2>Own the <span>Relationship</span>, Not Just a Link</h2>  
          <p>Your customers come to <strong>your</strong> subdomain. You build your brand, collect emails, and own the audience. We just power the comparison engine behind the scenes.</p>  
          <button className="btn btn-gold mt-16" onClick={() => document.getElementById('signupForm').scrollIntoView({behavior:'smooth'})}>  
            <i className="fas fa-handshake"></i> Start Building Your Audience  
          </button>  
        </div>  
        <div className="icon-big"><i className="fas fa-users"></i></div>  
      </div>  
  
      <Testimonials />  
        
      <h2 className="section-title text-center">We Do the <span className="highlight">Heavy Lifting</span> — You Focus on Growth</h2>  
      <p className="section-sub centered">Everything you need to run a professional comparison site, out of the box.</p>  
      <div className="grid-3">  
        <div className="card"><div className="icon"><i className="fas fa-paint-brush"></i></div><h3>White‑Label Site</h3><p>Fully branded comparison pages for Loans, Mortgages, Insurance, Health, and Credit Cards — optimized for Pakistan.</p></div>  
        <div className="card"><div className="icon"><i className="fas fa-database"></i></div><h3>Live Bank Data Feeds</h3><p>Real‑time rates and offers from 20+ Pakistani banks including HBL, UBL, MCB, Meezan, and more.</p></div>  
        <div className="card"><div className="icon"><i className="fas fa-headset"></i></div><h3>24/7 Support &amp; Training</h3><p>Dedicated onboarding, marketing materials, and technical support — in Urdu and English.</p></div>  
        <div className="card"><div className="icon"><i className="fas fa-shield-alt"></i></div><h3>Compliance &amp; Security</h3><p>We handle all regulatory requirements, data privacy, and security. You stay worry‑free.</p></div>  
        <div className="card"><div className="icon"><i className="fas fa-chart-pie"></i></div><h3>Analytics Dashboard</h3><p>Track visitors, conversions, and commissions in real‑time — all in PKR.</p></div>  
        <div className="card"><div className="icon"><i className="fas fa-hand-holding-usd"></i></div><h3>Automated PKR Payouts</h3><p>Monthly commission payments directly to your bank account in Pakistan.</p></div>  
      </div>  
  
      <div style={{background:'linear-gradient(135deg, #0a2540 0%, #1a3b5d 100%)',borderRadius:'var(--radius)',padding:'24px 20px',margin:'24px 0 32px',color:'#fff'}}>  
        <div style={{display:'flex',flexDirection:'column',gap:'16px',alignItems:'center',textAlign:'center'}}>  
          <div>  
            <div style={{fontSize:'2.6rem',fontWeight:'900',letterSpacing:'-1px'}}>₨ 85K <small style={{fontSize:'1rem',fontWeight:'400',opacity:'0.7'}}>avg / month</small></div>  
            <div style={{opacity:'0.8',fontSize:'0.9rem'}}>Top resellers earn ₨ 300K+ monthly</div>  
          </div>  
          <div style={{maxWidth:'100%'}}>  
            <p style={{opacity:'0.9',fontSize:'0.95rem'}}><strong>Commission structure:</strong> Tiered rates from 2% to 8% on referred conversions. Volume bonuses and quarterly incentives.</p>  
            <button className="btn btn-gold btn-sm mt-16" onClick={() => { /* show commission modal */ }}><i className="fas fa-file-pdf"></i> View Schedule</button>  
          </div>  
        </div>  
      </div>  
  
      <h2 className="section-title text-center">Reseller Terms — <span className="gold">Simple &amp; Fair</span></h2>  
      <p className="section-sub centered">Designed for Pakistani entrepreneurs. No hidden fees, no lock‑ins.</p>  
      <div className="grid-4" style={{marginBottom:'24px'}}>  
        {[  
          { icon: 'fa-user', text: 'Single account holder — individual or business' },  
          { icon: 'fa-coins', text: 'No setup fees, no monthly minimums' },  
          { icon: 'fa-calendar-alt', text: '30‑day rolling contract, cancel anytime' },  
          { icon: 'fa-map-pin', text: 'Exclusive territory protection (first‑come)' },  
          { icon: 'fa-chart-simple', text: 'Full transparency on commissions & performance' },  
          { icon: 'fa-lock', text: 'Compliance & data privacy handled by us' },  
          { icon: 'fa-university', text: 'Payouts in PKR via local bank transfer' },  
          { icon: 'fa-star', text: 'Dedicated account manager for top resellers' },  
        ].map((item, idx) => (  
          <div key={idx} className="card" style={{padding:'16px 14px'}}>  
            <i className={`fas ${item.icon}`} style={{color:'var(--secondary)',fontSize:'1.2rem',marginBottom:'4px'}}></i>  
            <p style={{fontWeight:'600',fontSize:'0.85rem'}}>{item.text}</p>  
          </div>  
        ))}  
      </div>  
  
      <SignupForm />  
      <p className="text-center op-6" style={{fontSize:'0.8rem',margin:'8px 0 16px'}}><i className="fas fa-lock"></i> Your data is secure. We never share your information.</p>  
    </div>  
  );  
};  
  
export default Public;
