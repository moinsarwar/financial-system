import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Toast = () => {
  const { toastState } = useContext(AppContext);

  if (!toastState.show) return null;

  return (
    <div className="toast show" role="status" aria-live="polite">
      {toastState.message}
    </div>
  );
};

export default Toast;
