import React, { useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer, maxWidth, noPadding = false }) => {
  // Bloquear scroll del fondo mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cerrar con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  const currentMaxWidth = maxWidth ? `max-w-${maxWidth}` : sizeClasses[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Close button when no title */}
      {!title && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}

      {/* Modal — altura máxima al 90% del viewport */}
      <div
        className={`relative ${currentMaxWidth} w-full bg-surface-300 border border-gray-700/50 rounded-xl shadow-large animate-scale-in flex flex-col`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header — fijo arriba */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 shrink-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="btn-icon p-1.5"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body — único scroll aquí */}
        <div className={`${noPadding ? '' : 'px-6 py-5'} overflow-y-auto flex-1 custom-scrollbar`}>
          {children}
        </div>

        {/* Footer — fijo abajo */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
