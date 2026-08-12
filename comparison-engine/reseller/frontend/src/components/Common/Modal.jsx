import React, { useEffect } from 'react';  
  
const Modal = ({ isOpen, title, children, onClose }) => {  
  useEffect(() => {  
    if (isOpen) {  
      document.body.style.overflow = 'hidden';  
    } else {  
      document.body.style.overflow = '';  
    }  
    return () => {  
      document.body.style.overflow = '';  
    };  
  }, [isOpen]);  
  
  if (!isOpen) return null;  
  
  return (  
    <div className="modal-overlay open" onClick={onClose}>  
      <div className="modal-box" onClick={e => e.stopPropagation()}>  
        <div className="modal-header">  
          <h3>{title}</h3>  
          <button className="modal-close" onClick={onClose}>&times;</button>  
        </div>  
        <div className="modal-body">  
          {children}  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default Modal;
