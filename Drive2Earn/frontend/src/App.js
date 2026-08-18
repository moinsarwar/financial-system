import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Hero from './components/Hero';
import VehicleGrid from './components/VehicleGrid';
import AffordabilityForm from './components/AffordabilityForm';
import Calculator from './components/Calculator';
import ApplyModal from './components/ApplyModal';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import {
  Assumptions,
  BusinessModel,
  CarPay,
  Ecosystem,
  FinalCta,
  Header,
  HowItWorks,
  LegalFooter,
  MonthlyPayment,
  Terms,
} from './components/StaticSections';

const Shell = () => {
  const { loading, error } = useApp();

  return (
    <div className="prototype-container">
      <Header />
      {error && (
        <div className="disclaimer-banner" role="alert">
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}
      <Hero />
      <CarPay />
      <MonthlyPayment />
      {loading ? (
        <div className="vehicle-detail-section">
          <h2>Loading vehicles from API…</h2>
        </div>
      ) : (
        <VehicleGrid />
      )}
      <HowItWorks />
      <AffordabilityForm />
      <Calculator />
      <BusinessModel />
      <Ecosystem />
      <Terms />
      <Assumptions />
      <FinalCta />
      <LegalFooter />
      <ApplyModal />
      <Toast />
    </div>
  );
};

function AppRoutes() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Shell />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </AppProvider>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
