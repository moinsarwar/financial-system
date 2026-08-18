import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { popPendingAction, savePendingAction } from '../utils/pendingAction';

export const AppContext = createContext();

const emptyFormModal = {
  isOpen: false,
  mode: 'inquiry',
  title: '',
  meta: '',
  applicationType: 'testdrive',
  vehicle: null,
  source: 'site',
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showDifferences, setShowDifferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compareStatus, setCompareStatus] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, title: '', body: '', meta: '' });
  const [formModal, setFormModal] = useState(emptyFormModal);
  const [toastState, setToastState] = useState({ show: false, message: '' });
  const modalBodyRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastState({ show: true, message });
    setTimeout(() => setToastState({ show: false, message: '' }), 4000);
  }, []);

  const openModal = useCallback((title, body, meta = '') => {
    setModalState({
      isOpen: true,
      title,
      body,
      meta: meta || 'AutoCompare PK',
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const openInquiryForm = useCallback(({ title = 'Request Info', vehicle = null, source = 'site', meta = '' } = {}) => {
    setFormModal({
      isOpen: true,
      mode: 'inquiry',
      title,
      meta: meta || 'Request information about a vehicle',
      applicationType: 'info',
      vehicle,
      source,
    });
  }, []);

  const openApplicationForm = useCallback(
    ({
      title = 'Book a Test Drive',
      applicationType = 'testdrive',
      vehicle = null,
      source = 'site',
      meta = '',
    } = {}) => {
      setFormModal({
        isOpen: true,
        mode: 'application',
        title,
        meta: meta || 'Schedule a test drive',
        applicationType,
        vehicle,
        source,
      });
    },
    [],
  );

  const requestTestDrive = useCallback(
    (opts = {}) => {
      const vehicle = opts.vehicle || selectedVehicle;
      if (!vehicle) {
        showToast('Please select a vehicle from the list first');
        return false;
      }
      const fullOpts = { ...opts, vehicle, applicationType: opts.applicationType || 'testdrive' };
      if (!user) {
        savePendingAction({ type: 'application', payload: fullOpts });
        showToast('Please sign in or register to book a test drive');
        navigate('/login?reason=testdrive');
        return false;
      }
      openApplicationForm(fullOpts);
      return true;
    },
    [user, selectedVehicle, openApplicationForm, navigate, showToast],
  );

  const closeFormModal = useCallback(() => setFormModal(emptyFormModal), []);

  useEffect(() => {
    if (!user || location.pathname !== '/') return;
    const pending = popPendingAction();
    if (pending?.type === 'application' && pending.payload) {
      openApplicationForm(pending.payload);
    }
  }, [user, location.pathname, openApplicationForm]);

  useEffect(() => {
    if (!modalState.isOpen || !modalBodyRef.current) return;

    const handler = (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.action;
      const vehicleKey = btn.dataset.vehicleKey;
      const vehicleName = btn.dataset.vehicleName;
      const vehicle = vehicleKey
        ? {
            key: vehicleKey,
            name: vehicleName,
            logo:
              selectedVehicle?.key === vehicleKey
                ? selectedVehicle.logo
                : comparisonResults?.vehicle_a?.key === vehicleKey
                  ? comparisonResults.vehicle_a.logo
                  : comparisonResults?.vehicle_b?.key === vehicleKey
                    ? comparisonResults.vehicle_b.logo
                    : '🚗',
          }
        : selectedVehicle;

      if (action === 'info') {
        closeModal();
        openInquiryForm({
          title: 'Request Info',
          vehicle,
          source: btn.dataset.source || 'product_detail',
        });
      } else if (action === 'testdrive') {
        closeModal();
        requestTestDrive({
          title: 'Book a Test Drive',
          applicationType: 'testdrive',
          vehicle,
          source: btn.dataset.source || 'product_detail',
        });
      } else if (action === 'quote' || action === 'finance_quote' || action === 'service_book' || action === 'inspect_book') {
        closeModal();
        openInquiryForm({
          title: btn.textContent?.trim() || 'Service request',
          vehicle: vehicle || { name: btn.dataset.vehicleName || 'Service' },
          source: action,
        });
      }
    };

    const el = modalBodyRef.current;
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [
    modalState.isOpen,
    modalState.body,
    selectedVehicle,
    comparisonResults,
    closeModal,
    openInquiryForm,
    requestTestDrive,
  ]);

  return (
    <AppContext.Provider
      value={{
        selectedVehicle,
        setSelectedVehicle,
        comparisonResults,
        setComparisonResults,
        showDifferences,
        setShowDifferences,
        loading,
        setLoading,
        compareStatus,
        setCompareStatus,
        modalState,
        openModal,
        closeModal,
        modalBodyRef,
        formModal,
        openInquiryForm,
        openApplicationForm,
        requestTestDrive,
        closeFormModal,
        toastState,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
