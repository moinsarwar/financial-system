import React from 'react';
import { useApp } from '../context/AppContext';

const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="d2e-toast" role="status">
      <i className="fas fa-check-circle" /> {toast}
    </div>
  );
};

export default Toast;
