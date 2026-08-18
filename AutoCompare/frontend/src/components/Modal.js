import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Modal = () => {
  const { modalState, closeModal, modalBodyRef } = useContext(AppContext);
  if (!modalState.isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={closeModal} role="presentation">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="close-btn" onClick={closeModal}>
          ✕ Close
        </button>
        <h2>
          <i className="fas fa-info-circle" /> <span>{modalState.title}</span>
        </h2>
        <div ref={modalBodyRef} dangerouslySetInnerHTML={{ __html: modalState.body }} />
        <div className="meta">{modalState.meta}</div>
      </div>
    </div>
  );
};

export default Modal;
