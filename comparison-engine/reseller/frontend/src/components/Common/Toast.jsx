import React, { useEffect } from 'react';  
  
const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {  
  useEffect(() => {  
    const timer = setTimeout(() => {  
      onClose();  
    }, duration);  
    return () => clearTimeout(timer);  
  }, [onClose, duration]);  
  
  if (!message) return null;  
  
  return (  
    <div className={`toast show ${type}`}>  
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>  
      <span>{message}</span>  
    </div>  
  );  
};  
  
export default Toast;
