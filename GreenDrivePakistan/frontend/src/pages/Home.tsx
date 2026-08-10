import { useNavigate } from 'react-router-dom';
import Button from '../components/Common/Button';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="page-section">
      <div
        style={{
          background: 'linear-gradient(135deg,#0a7e3e 0%,#065f2e 100%)',
          color: '#fff',
          padding: '40px 0',
          borderRadius: '0 0 32px 32px',
          marginBottom: 16,
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>
            Beat Record <span style={{ color: '#fcd34d' }}>Fuel &amp; Energy</span> Costs
          </h1>
          <p style={{ fontSize: 16, maxWidth: 500, margin: '8px 0 16px', opacity: 0.9 }}>
            Sharia-compliant financing on solar, EVs, and efficient appliances. Save up to 70% on bills.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              style={{ background: '#fff', color: 'var(--primary)' }}
              onClick={() => navigate('/marketplace')}
            >
              <i className="fas fa-shopping-cart" /> Explore
            </Button>
            <Button
              variant="outline"
              style={{ borderColor: '#fff', color: '#fff' }}
              onClick={() => navigate('/compare')}
            >
              <i className="fas fa-calculator" /> Compare
            </Button>
            <Button
              variant="outline"
              style={{ borderColor: '#fff', color: '#fff' }}
              onClick={() => navigate('/about')}
            >
              <i className="fas fa-info-circle" /> Learn More
            </Button>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="stats-banner">
          <div className="stat">
            <div className="number">70%</div>
            <div className="label">Electricity Savings</div>
          </div>
          <div className="stat">
            <div className="number">90%</div>
            <div className="label">Fuel Savings</div>
          </div>
          <div className="stat">
            <div className="number">24</div>
            <div className="label">Month Finance</div>
          </div>
          <div className="stat">
            <div className="number">100%</div>
            <div className="label">Sharia Compliant</div>
          </div>
        </div>

        <div
          className="card mt-16"
          style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}
        >
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-leaf" style={{ color: 'var(--primary)' }} /> Why GreenDrive?
          </h3>
          <div className="grid-4 mt-12">
            <div>
              <i className="fas fa-bolt" style={{ color: 'var(--accent)', fontSize: 24 }} />
              <p>
                <strong>Rising Electricity</strong>
                <br />
                Costs up 40% in 2024
              </p>
            </div>
            <div>
              <i className="fas fa-gas-pump" style={{ color: 'var(--accent)', fontSize: 24 }} />
              <p>
                <strong>Fuel Inflation</strong>
                <br />
                Petrol at record highs
              </p>
            </div>
            <div>
              <i className="fas fa-lightbulb" style={{ color: 'var(--accent)', fontSize: 24 }} />
              <p>
                <strong>Load Shedding</strong>
                <br />
                Unreliable grid supply
              </p>
            </div>
            <div>
              <i className="fas fa-hand-holding-heart" style={{ color: 'var(--accent)', fontSize: 24 }} />
              <p>
                <strong>Sharia Finance</strong>
                <br />
                No Riba, ethical saving
              </p>
            </div>
          </div>
          <p className="mt-12">
            We provide energy independence, lower monthly expenses, and a cleaner planet.
          </p>
        </div>

        <div className="partner-strip">
          <span className="logo-placeholder">
            <i className="fas fa-solar-panel" /> SolarTech
          </span>
          <span className="logo-placeholder">
            <i className="fas fa-car" /> EcoRides
          </span>
          <span className="logo-placeholder">
            <i className="fas fa-university" /> LFE Islamic
          </span>
          <span className="logo-placeholder">
            <i className="fas fa-tools" /> InstallPro
          </span>
          <span className="logo-placeholder">
            <i className="fas fa-handshake" /> Sharia Advisors
          </span>
        </div>

        <h3 className="mt-16">Customer Testimonials</h3>
        <div className="grid-3 mt-12">
          <div className="testimonial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar">AK</div>
              <div>
                <strong>Ali Khan</strong>
                <br />
                <span className="text-muted">Lahore</span>
              </div>
            </div>
            <p className="mt-12">
              &quot;I installed a 3kW solar kit. My electricity bill dropped from 18,000 to 5,000. Monthly
              saving of 13,000!&quot;
            </p>
            <div className="badge mt-12">Solar Kit</div>
          </div>
          <div className="testimonial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar">SA</div>
              <div>
                <strong>Sara Ahmed</strong>
                <br />
                <span className="text-muted">Karachi</span>
              </div>
            </div>
            <p className="mt-12">
              &quot;Switched to an electric bike. I save 8,000 per month on fuel. Best decision ever.&quot;
            </p>
            <div className="badge mt-12">E-Bike</div>
          </div>
          <div className="testimonial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar">RN</div>
              <div>
                <strong>Raza Naqvi</strong>
                <br />
                <span className="text-muted">Islamabad</span>
              </div>
            </div>
            <p className="mt-12">
              &quot;Our factory installed solar and batteries. Monthly savings of 200,000. The Murabaha plan
              made it possible.&quot;
            </p>
            <div className="badge mt-12">Commercial</div>
          </div>
        </div>

        <div className="grid-2 mt-16">
          <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <h4>
              <i className="fas fa-user-plus" style={{ color: 'var(--secondary)' }} /> Why Register?
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Apply for financing in
                minutes
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Track your application
                &amp; repayments
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Get personalized savings
                reports
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Exclusive offers &amp;
                early access
              </li>
            </ul>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h4>
              <i className="fas fa-shopping-bag" style={{ color: 'var(--accent)' }} /> Why Buy from Us?
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Transparent pricing – no
                hidden fees
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Genuine products with
                warranty
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> 24/7 customer support
              </li>
              <li style={{ margin: '6px 0' }}>
                <i className="fas fa-check" style={{ color: 'var(--primary)' }} /> Save money from day one
              </li>
            </ul>
            <Button size="sm" className="mt-12" onClick={() => navigate('/marketplace')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
