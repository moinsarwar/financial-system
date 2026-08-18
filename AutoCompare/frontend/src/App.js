import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import ComparisonSelector from './components/ComparisonSelector';
import ComparisonResults from './components/ComparisonResults';
import VehicleList from './components/VehicleList';
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
import { getVehicles } from './api/client';
import { CHINESE_MFGS, MANUFACTURERS, ORIGIN_TITLES } from './utils/catalog';

function AppShell() {
  const { openModal, openInquiryForm, requestTestDrive, selectedVehicle, showToast } =
    React.useContext(AppContext);
  const { user } = useAuth();
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [secondaryFilter, setSecondaryFilter] = useState('new');
  const [mfgFilter, setMfgFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const costRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getVehicles({ limit: 200 });
      setAllVehicles(data);
    } catch (err) {
      console.error(err);
      setError('Could not load vehicles. Check that the API is running on port 9019.');
      setAllVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const vehicles = useMemo(() => {
    let rows = [...allVehicles];
    if (mfgFilter) {
      rows = rows.filter((v) => v.mfg === mfgFilter);
    } else if (originFilter === 'assembled' || originFilter === 'imported') {
      rows = rows.filter((v) => v.origin === originFilter);
    } else if (originFilter === 'chinese') {
      rows = rows.filter((v) => CHINESE_MFGS.includes(v.mfg));
    }

    if (secondaryFilter === 'new' || secondaryFilter === 'used') {
      rows = rows.filter((v) => v.condition === secondaryFilter);
    } else if (['petrol', 'diesel', 'ev'].includes(secondaryFilter)) {
      rows = rows.filter((v) => v.powertrain === secondaryFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rows = rows.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.mfg?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.variant?.toLowerCase().includes(q),
      );
    }
    return rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allVehicles, originFilter, secondaryFilter, mfgFilter, searchTerm]);

  const categoryTitle = mfgFilter
    ? `${(MANUFACTURERS.find((m) => m.id === mfgFilter)?.label || mfgFilter).toUpperCase()} · ${vehicles.length} models`
    : ORIGIN_TITLES[originFilter] || 'All Vehicles';

  const handleSelectMfg = (mfgId) => {
    setMfgFilter(mfgId);
    setOriginFilter('all');
  };

  const handleOriginFilter = (id) => {
    setOriginFilter(id);
    setMfgFilter('');
  };

  const scrollToCost = () => {
    costRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-container">
      <header className="brand-header">
        <div className="brand">
          <i className="fas fa-car" />
          <h1>
            AutoCompare <small>PK</small>
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
        <span>Assembled · Imported · Chinese Brands</span>
        <span>
          <i className="fas fa-flag" /> all makes
        </span>
      </div>

      <ComparisonSelector vehicles={allVehicles} />
      <ComparisonResults />

      <Filters
        originFilter={originFilter}
        setOriginFilter={handleOriginFilter}
        secondaryFilter={secondaryFilter}
        setSecondaryFilter={setSecondaryFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <ManufacturerGrid activeMfg={mfgFilter} onSelectMfg={handleSelectMfg} />

      <VehicleList
        vehicles={vehicles}
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
              'Verified listings',
              '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Verified listing workflow — contact us via Request Info.</p>',
            )
          }
        >
          <i className="fas fa-check-double" /> Verified listings
        </button>
        <button
          type="button"
          className="trust-slim-item"
          onClick={() => openInquiryForm({ title: 'Vehicle history', source: 'vehicle_history' })}
        >
          <i className="fas fa-file-signature" /> Vehicle history
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
            if (!selectedVehicle) {
              showToast('Please select a vehicle from the list first');
              return;
            }
            openInquiryForm({
              title: 'Request Info',
              vehicle: selectedVehicle,
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
            requestTestDrive({
              title: 'Book a Test Drive',
              applicationType: 'testdrive',
              vehicle: selectedVehicle,
              source: 'universal_bar',
            })
          }
        >
          <i className="fas fa-key" /> Test Drive
        </button>
        <button type="button" className="btn-cost" onClick={scrollToCost}>
          <i className="fas fa-calculator" /> Running Costs
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
