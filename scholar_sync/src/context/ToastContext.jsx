import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  const toastHelpers = {
    success,
    error,
    warning,
    info,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastIcon = ({ type }) => {
  const size = 18;
  switch (type) {
    case 'success':
      return <CheckCircle2 size={size} className="toast-icon-svg" style={{ color: '#10B981' }} />;
    case 'error':
      return <AlertCircle size={size} className="toast-icon-svg" style={{ color: '#EF4444' }} />;
    case 'warning':
      return <AlertTriangle size={size} className="toast-icon-svg" style={{ color: '#F59E0B' }} />;
    case 'info':
    default:
      return <Info size={size} className="toast-icon-svg" style={{ color: '#3B82F6' }} />;
  }
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="custom-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`custom-toast custom-toast-${toast.type}`}>
          <div className="custom-toast-content">
            <div className="custom-toast-icon-wrapper">
              <ToastIcon type={toast.type} />
            </div>
            <div className="custom-toast-message">{toast.message}</div>
          </div>
          <button className="custom-toast-close" onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
