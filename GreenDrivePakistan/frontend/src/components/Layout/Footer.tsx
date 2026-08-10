import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <p>
          <i className="fas fa-leaf" style={{ color: 'var(--primary)' }} /> GreenDrive Pakistan — Energy
          for Tomorrow.
        </p>
        <div className="legal-links">
          <Link to="/legal">Terms</Link>
          <Link to="/legal">Privacy</Link>
          <Link to="/legal">Sale Agreement</Link>
        </div>
        <p className="text-muted" style={{ marginTop: 6 }}>
          &copy; 2026 — Demo data seeded via API.
        </p>
      </div>
    </footer>
  );
}
