import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';
import ComparisonSelector from './components/ComparisonSelector';
import ComparisonResults from './components/ComparisonResults';
import ProductList from './components/ProductList';
import CostCalculator from './components/CostCalculator';
import Filters from './components/Filters';
import ManufacturerGrid from './components/ManufacturerGrid';
import Modal from './components/Modal';
import Toast from './components/Toast';
import ServiceCards from './components/ServiceCards';
import TrustBadge from './components/TrustBadge';
import LegalFooter from './components/LegalFooter';
import { AppProvider, AppContext } from './context/AppContext';
import { getAppliances } from './api/client';
import { CATEGORY_TITLES } from './utils/categories';

function AppShell() {
  const { openModal } = React.useContext(AppContext);
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
        <TrustBadge />
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
              'Verified dealers (Prototype)',
              '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Dealer verification workflow planned.</p>',
            )
          }
        >
          <i className="fas fa-check-double" /> Verified dealers
        </button>
        <button
          type="button"
          className="trust-slim-item"
          onClick={() =>
            openModal(
              'Warranty check (Prototype)',
              '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Warranty lookup by serial number planned.</p>',
            )
          }
        >
          <i className="fas fa-file-signature" /> Warranty check
        </button>
        <button
          type="button"
          className="trust-slim-item"
          onClick={() =>
            openModal(
              'Buyer protection (Prototype)',
              '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Escrow and dispute resolution planned.</p>',
            )
          }
        >
          <i className="fas fa-hand-holding-heart" /> Buyer protection
        </button>
      </div>

      <LegalFooter />

      <div className="universal-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            openModal(
              'Request Info',
              `<div class="simulated-badge">🔬 PROTOTYPE</div>
               <form><label>Name<input name="name" required /></label>
               <label>Phone<input name="phone" required /></label>
               <button type="button" class="action-btn" data-action="form_submit">Submit demo</button></form>`,
              'Prototype · Request info',
            )
          }
        >
          <i className="fas fa-envelope" /> Request Info
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            openModal(
              'Delivery & Install',
              '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Schedule delivery through verified partners.</p>',
            )
          }
        >
          <i className="fas fa-truck" /> Delivery/Install
        </button>
        <button type="button" className="btn-cost" onClick={scrollToCost}>
          <i className="fas fa-calculator" /> Running Cost
        </button>
      </div>

      <Modal />
      <Toast />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
