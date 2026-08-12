import React, { useEffect } from 'react';  
  
interface DetailPanelProps {  
  isOpen: boolean;  
  onClose: () => void;  
  title: string;  
  subhead?: string;  
  children: React.ReactNode;  
  actions?: React.ReactNode;  
}  
  
export const DetailPanel: React.FC<DetailPanelProps> = ({  
  isOpen,  
  onClose,  
  title,  
  subhead,  
  children,  
  actions,  
}) => {  
  useEffect(() => {  
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };  
    if (isOpen) document.addEventListener('keydown', handleEsc);  
    return () => document.removeEventListener('keydown', handleEsc);  
  }, [isOpen, onClose]);  
  
  useEffect(() => {  
    if (isOpen) {  
      document.body.style.overflow = 'hidden';  
    } else {  
      document.body.style.overflow = '';  
    }  
    return () => { document.body.style.overflow = ''; };  
  }, [isOpen]);  
  
  if (!isOpen) return null;  
  
  return (  
    <>  
      <div  
        className="fixed inset-0 bg-black/30 z-40"  
        onClick={onClose}  
      />  
      <div  
        className="fixed top-0 right-0 w-full sm:w-[600px] h-full bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 p-6 overflow-y-auto"  
        tabIndex={-1}  
      >  
        <button  
          className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-800"  
          onClick={onClose}  
        >  
          ×  
        </button>  
        <h2 className="text-2xl font-extrabold mb-1">{title}</h2>  
        {subhead && <p className="text-gray-600 text-sm mb-4">{subhead}</p>}  
        <div>{children}</div>  
        {actions && <div className="mt-6 pt-4 border-t flex gap-2 flex-wrap">{actions}</div>}  
      </div>  
    </>  
  );  
};
