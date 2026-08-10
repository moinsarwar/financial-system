import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Marketplace from './pages/Marketplace';
import Compare from './pages/Compare';
import FAQ from './pages/FAQ';
import Ecosystem from './pages/Ecosystem';
import Legal from './pages/Legal';
import Dashboard from './pages/Dashboard';
import Button from './components/Common/Button';

function Shell() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/ecosystem" element={<Ecosystem />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Button className="sticky-apply" onClick={() => navigate('/marketplace')}>
        <i className="fas fa-shopping-bag" /> Apply Now
      </Button>
      <div
        className="scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fas fa-arrow-up" />
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
