import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useRouteError } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-500 px-4">
      <div className="max-w-md w-full bg-surface-300 border border-gray-700/50 rounded-xl p-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 bg-danger-50 rounded-xl flex items-center justify-center mx-auto mb-5">
          <ExclamationTriangleIcon className="w-7 h-7 text-danger-300" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Algo salió mal
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Ha ocurrido un error inesperado en la aplicación.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 mb-2">
              Detalles técnicos
            </summary>
            <pre className="text-xs bg-surface-400 text-gray-400 p-3 rounded-lg overflow-auto max-h-32 border border-gray-700/30">
              {error.message}
              {error.stack && (<>{'\n\n'}{error.stack}</>)}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="btn-primary"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reintentar
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="btn-secondary"
          >
            Ir al inicio
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-5">
          Si el problema persiste, contacte al administrador.
        </p>
      </div>
    </div>
  );
};

const logError = (error, errorInfo) => {
  console.error('Error Boundary:', error, errorInfo);
};

const ErrorBoundary = ({ children, fallback: Fallback, onError }) => {
  const handleError = (error, errorInfo) => {
    logError(error, errorInfo);
    if (onError) onError(error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback || ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
};

const RouteErrorBoundary = () => {
  const error = useRouteError();
  return <ErrorFallback error={error} resetErrorBoundary={() => window.location.reload()} />;
};

export { RouteErrorBoundary };
export default ErrorBoundary;