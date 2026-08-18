import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import './App.css';
import ComparisonSelector from './components/ComparisonSelector';
import ComparisonResults from './components/ComparisonResults';
import ProductList from './components/ProductList';
import CostCalculator from './components/CostCalculator';
import Filters from './components/Filters';
import ManufacturerGrid from './components/ManufacturerGrid';
import Modal from './components/Modal';
import FormModal from './components/FormModal';
import Toast from './components/Toast';
import ServiceCards from './components/ServiceCards';
import TrustBadge from './components/TrustBadge';
import LegalFooter from './components/LegalFooter';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { AppProvider, AppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getAppliances } from './api/client';
import { CATEGORY_TITLES } from './utils/categories';

function AppShell() {
  const { openModal, openInquiryForm, requestApplication, selectedAppliance, showToast } = React.useContext(AppContext);
  const { user } = useAuth();
  const [allAppliances, setAllAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSecondary, setActiveSecondary] = useState('new');
  const [searchTerm, setSearchTerm] = useState('');
  const costRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAppliances({ limit: 200 });
      setAllAppliances(data);
    } catch (err) {
      console.error(err);
      setError('Could not load appliances. Check that the API is running on port 9014.');
      setAllAppliances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const appliances = useMemo(() => {
    let keys = [...allAppliances];
    if (activeFilter !== 'all') {
      keys = keys.filter((a) => a.mfg === activeFilter);
    }
    if (activeSecondary === 'new') {
      keys = keys.filter((a) => a.is_new);
    } else if (activeSecondary === 'budget') {
      keys = keys.filter((a) => parseInt(String(a.price).replace(/\D/g, ''), 10) < 40000);
    } else if (activeSecondary === 'premium') {
      keys = keys.filter((a) => parseInt(String(a.price).replace(/\D/g, ''), 10) > 80000);
    } else if (activeSecondary === 'inverter') {
      keys = keys.filter((a) => (a.energy || '').toLowerCase().includes('inverter'));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      keys = keys.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.brand?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.variant?.toLowerCase().includes(q),
      );
    }
    return keys.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allAppliances, activeFilter, activeSecondary, searchTerm]);

  const categoryTitle = CATEGORY_TITLES[activeFilter] || 'All Appliances';

  const handleSelectMfg = (mfgId) => {
    setActiveFilter(mfgId);
  };

  const scrollToCost = () => {
    costRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-container">
      <header className="brand-header">
        <div className="brand">
          <i className="fas fa-house-chimney" />
          <h1>
            HomeCompare <small>PK</small>
          </h1>
        </div>
        <div className="header-actions">
          <Link to={user ? '/dashboard' : '/login?next=/dashboard'} className="dashboard-link">
            <i className="fas fa-gauge-high" /> Dashboard
          </Link>
          <TrustBadge />
        </div>
      </header>

      <div className="tagline">
        <i className="fas fa-check-circle" />
        <span>Large Appliances · AC · Coolers · Cookers · Fridges · Washers · TVs</span>
        <span className="tagline-badge">
          <i className="fas fa-flag" /> all brands
        </span>
      </div>

      <ComparisonSelector appliances={allAppliances} />

      <ComparisonResults />

      <Filters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeSecondary={activeSecondary}
        setActiveSecondary={setActiveSecondary}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <ManufacturerGrid activeMfg={activeFilter === 'all' ? '' : activeFilter} onSelectMfg={handleSelectMfg} />

      <ProductList
        appliances={appliances}
        loading={loading}
        error={error}
        categoryTitle={categoryTitle}
        onRetry={loadCatalog}
      />

      <div ref={costRef}>
        <CostCalculator />
      </div>

      <ServiceCards />

      <div className="trust-slim">
        <button
          type="button"
          className="trust-slim-item"
          onClick={() =>
            openModal(
              'Verified dealers',
              '<p>Dealer verification workflow — contact us via Request Info.</p>',
            )
          }
        >
          <i className="fas fa-check-double" /> Verified dealers
        </button>
        <button
          type="button"
          className="trust-slim-item"
          onClick={() => openInquiryForm({ title: 'Warranty check', source: 'warranty_check' })}
        >
          <i className="fas fa-file-signature" /> Warranty check
        </button>
        <button
          type="button"
          className="trust-slim-item"
          onClick={() => openInquiryForm({ title: 'Buyer protection', source: 'buyer_protection' })}
        >
          <i className="fas fa-hand-holding-heart" /> Buyer protection
        </button>
      </div>

      <LegalFooter />

      <div className="universal-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (!selectedAppliance) {
              showToast('Please select an appliance from the list first');
              return;
            }
            openInquiryForm({
              title: 'Request Info',
              appliance: selectedAppliance,
              source: 'universal_bar',
            });
          }}
        >
          <i className="fas fa-envelope" /> Request Info
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            requestApplication({
              title: 'Delivery & Install',
              applicationType: 'installation',
              appliance: selectedAppliance,
              source: 'universal_bar',
            })
          }
        >
          <i className="fas fa-truck" /> Delivery/Install
        </button>
        <button type="button" className="btn-cost" onClick={scrollToCost}>
          <i className="fas fa-calculator" /> Running Cost
        </button>
      </div>

      <Modal />
      <FormModal />
      <Toast />
    </div>
  );
}

function AppRoutes() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
