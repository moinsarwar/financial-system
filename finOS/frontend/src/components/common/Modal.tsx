import React, { useEffect, useRef } from 'react';  
import { createPortal } from 'react-dom';  
  
interface ModalProps {  
  isOpen: boolean;  
  onClose: () => void;  
  title: string;  
  children: React.ReactNode;  
  onSave?: () => void;  
  saveLabel?: string;  
  loading?: boolean;  
  size?: 'sm' | 'md' | 'lg';  
}  
  
export const Modal: React.FC<ModalProps> = ({  
  isOpen,  
  onClose,  
  title,  
  children,  
  onSave,  
  saveLabel = 'Save',  
  loading = false,  
  size = 'md',  
}) => {  
  const ref = useRef<HTMLDivElement>(null);  
  const sizeClasses = {  
    sm: 'max-w-md',  
    md: 'max-w-lg',  
    lg: 'max-w-2xl',  
  };  
  
  useEffect(() => {  
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };  
    if (isOpen) document.addEventListener('keydown', handleEsc);  
    return () => document.removeEventListener('keydown', handleEsc);  
  }, [isOpen, onClose]);  
  
  if (!isOpen) return null;  
  
  return createPortal(  
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>  
      <div  
        ref={ref}  
        className={`bg-white rounded-2xl p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto shadow-lg`}  
        onClick={(e) => e.stopPropagation()}  
      >  
        <h2 className="text-xl font-bold mb-1">{title}</h2>  
        <div className="text-gray-600 text-sm mb-4">Fill in the details below.</div>  
        {children}  
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">  
          <button  
            className="px-4 py-2 border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition"  
            onClick={onClose}  
            disabled={loading}  
          >  
            Cancel  
          </button>  
          {onSave && (  
            <button  
              className="px-4 py-2 bg-accent text-white rounded-full text-sm hover:bg-primary-light transition disabled:opacity-50"  
              onClick={onSave}  
              disabled={loading}  
            >  
              {loading ? 'Saving...' : saveLabel}  
            </button>  
          )}  
        </div>  
      </div>  
    </div>,  
    document.body  
  );  
};
