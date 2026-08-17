import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
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
  const [toastState, setToastState] = useState({
    show: false,
    message: '',
  });
  const modalBodyRef = useRef(null);

  const openModal = useCallback((title, body, meta = '') => {
    setModalState({
      isOpen: true,
      title,
      body,
      meta: meta || 'HomeCompare PK · Prototype',
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showToast = useCallback((message) => {
    setToastState({ show: true, message });
    setTimeout(() => {
      setToastState({ show: false, message: '' });
    }, 4000);
  }, []);

  useEffect(() => {
    if (!modalState.isOpen || !modalBodyRef.current) return;

    const handler = (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'delivery' || action === 'info') {
        showToast('🔬 [DEMO] Request flow completed (no data sent).');
        closeModal();
      } else if (action === 'form_submit') {
        showToast('🔬 [DEMO] Form submitted (no data sent).');
        closeModal();
      }
    };

    const el = modalBodyRef.current;
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [modalState.isOpen, modalState.body, showToast, closeModal]);

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
        toastState,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
