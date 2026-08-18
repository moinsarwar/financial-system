import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { popPendingAction, savePendingAction } from '../utils/pendingAction';

export const AppContext = createContext();

const emptyFormModal = {
  isOpen: false,
  mode: 'inquiry',
  title: '',
  meta: '',
  applicationType: 'delivery',
  appliance: null,
  source: 'site',
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showDifferences, setShowDifferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compareStatus, setCompareStatus] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    body: '',
    meta: '',
  });
  const [formModal, setFormModal] = useState(emptyFormModal);
  const [toastState, setToastState] = useState({
    show: false,
    message: '',
  });
  const modalBodyRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastState({ show: true, message });
    setTimeout(() => {
      setToastState({ show: false, message: '' });
    }, 4000);
  }, []);

  const openModal = useCallback((title, body, meta = '') => {
    setModalState({
      isOpen: true,
      title,
      body,
      meta: meta || 'HomeCompare PK',
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const openInquiryForm = useCallback(({ title = 'Request Info', appliance = null, source = 'site', meta = '' } = {}) => {
    setFormModal({
      isOpen: true,
      mode: 'inquiry',
      title,
      meta: meta || 'Request information about an appliance',
      applicationType: 'info',
      appliance,
      source,
    });
  }, []);

  const openApplicationForm = useCallback(
    ({
      title = 'Service Request',
      applicationType = 'delivery',
      appliance = null,
      source = 'site',
      meta = '',
    } = {}) => {
      setFormModal({
        isOpen: true,
        mode: 'application',
        title,
        meta: meta || 'Schedule a service request',
        applicationType,
        appliance,
        source,
      });
    },
    [],
  );

  const requestApplication = useCallback(
    (opts) => {
      const appliance = opts.appliance || selectedAppliance;
      if (!appliance) {
        showToast('Please tap an appliance above to select it first');
        return false;
      }
      const fullOpts = { ...opts, appliance };
      if (!user) {
        savePendingAction({ type: 'application', payload: fullOpts });
        showToast('Please sign in or register to book installation');
        navigate('/login?reason=service');
        return false;
      }
      openApplicationForm(fullOpts);
      return true;
    },
    [user, selectedAppliance, openApplicationForm, navigate, showToast],
  );

  const closeFormModal = useCallback(() => {
    setFormModal(emptyFormModal);
  }, []);

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
      const applianceKey = btn.dataset.applianceKey;
      const applianceName = btn.dataset.applianceName;
      const appliance = applianceKey
        ? {
            key: applianceKey,
            name: applianceName,
            logo:
              selectedAppliance?.key === applianceKey
                ? selectedAppliance.logo
                : comparisonResults?.appliance_a?.key === applianceKey
                  ? comparisonResults.appliance_a.logo
                  : comparisonResults?.appliance_b?.key === applianceKey
                    ? comparisonResults.appliance_b.logo
                    : '🔌',
          }
        : selectedAppliance;

      if (action === 'info') {
        closeModal();
        openInquiryForm({
          title: 'Request Info',
          appliance,
          source: btn.dataset.source || 'product_detail',
        });
      } else if (action === 'delivery' || action === 'quote') {
        closeModal();
        requestApplication({
          title: action === 'quote' ? 'Warranty Quote' : 'Delivery & Install',
          applicationType: action === 'quote' ? 'warranty' : 'installation',
          appliance,
          source: btn.dataset.source || 'product_detail',
        });
      }
    };

    const el = modalBodyRef.current;
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [
    modalState.isOpen,
    modalState.body,
    selectedAppliance,
    comparisonResults,
    closeModal,
    openInquiryForm,
    requestApplication,
  ]);

  return (
    <AppContext.Provider
      value={{
        selectedAppliance,
        setSelectedAppliance,
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
        requestApplication,
        closeFormModal,
        toastState,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
