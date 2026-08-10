import { useNavigate } from 'react-router-dom';
import Button from '../components/Common/Button';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-info-circle" style={{ color: 'var(--primary)' }} /> About GreenDrive Pakistan
      </h2>
      <p className="text-muted">Empowering Pakistan with affordable, clean energy solutions.</p>
      <div className="card mt-16">
        <h3>Our Mission</h3>
        <p>
          We are on a mission to help Pakistani households and businesses break free from skyrocketing
          fuel and electricity costs. By providing access to high-quality energy-saving products with
          Sharia-compliant financing, we make sustainability affordable and accessible for everyone.
        </p>
        <p className="mt-12">
          Our platform connects you with vetted suppliers and offers transparent, interest-free
          (Murabaha) payment plans, backed by LFE&apos;s Sharia supervision.
        </p>
      </div>
      <div className="card mt-16">
        <h3>
          <i className="fas fa-route" style={{ color: 'var(--accent)' }} /> How It Works
        </h3>
        <div className="how-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <strong>Browse &amp; Compare</strong>
            <p className="text-muted">
              Explore our marketplace of energy-saving products and use our comparison engine to see real
              savings.
            </p>
          </div>
        </div>
        <div className="how-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <strong>Register &amp; Apply</strong>
            <p className="text-muted">
              Create your account, upload required documents, and submit your financing application.
            </p>
          </div>
        </div>
        <div className="how-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <strong>Approval &amp; Delivery</strong>
            <p className="text-muted">
              Our team reviews your application, and upon approval, we arrange delivery and installation.
            </p>
          </div>
        </div>
        <div className="how-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <strong>Save &amp; Track</strong>
            <p className="text-muted">
              Monitor your savings, make repayments, and track your journey via your dashboard.
            </p>
          </div>
        </div>
      </div>
      <div className="card mt-16">
        <h3>
          <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }} /> Vetted Suppliers &amp;
          Partners
        </h3>
        <p>
          We only work with trusted manufacturers and vendors who meet our strict quality and
          sustainability criteria. Our partners are committed to providing durable, high-performance
          products.
        </p>
        <div className="grid-3 mt-12">
          <div className="card text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-solar-panel" style={{ fontSize: 32, color: 'var(--accent)' }} />
            <h4>SolarTech</h4>
            <p className="text-muted">Premium solar panels &amp; batteries</p>
          </div>
          <div className="card text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-motorcycle" style={{ fontSize: 32, color: 'var(--accent)' }} />
            <h4>EcoRides</h4>
            <p className="text-muted">Electric bikes, rickshaws &amp; cars</p>
          </div>
          <div className="card text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-fan" style={{ fontSize: 32, color: 'var(--accent)' }} />
            <h4>CoolAir</h4>
            <p className="text-muted">Energy-efficient fans &amp; ACs</p>
          </div>
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
  );
}
