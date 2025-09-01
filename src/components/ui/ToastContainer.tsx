import React from 'react';
import { useToast, type Toast } from '../../contexts/ToastContext';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { hideToast } = useToast();

  const getToastStyles = () => {
    const baseStyles = 'flex items-center justify-between p-4 rounded-lg shadow-lg mb-3 max-w-sm w-full transition-all duration-300 transform';
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center flex-1">
        <span className="mr-2 text-lg">{getIcon()}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      
      <div className="flex items-center ml-3">
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              hideToast(toast.id);
            }}
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1 rounded mr-2 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
        
        <button
          onClick={() => hideToast(toast.id)}
          className="text-white/80 hover:text-white text-lg font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
      <div className="flex flex-col">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};