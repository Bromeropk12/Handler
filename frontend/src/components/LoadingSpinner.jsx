import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '', text = null, fullScreen = false }) => {
  const sizeConfig = {
    small: { spinner: 'w-4 h-4', text: 'text-sm' },
    medium: { spinner: 'w-8 h-8', text: 'text-sm' },
    large: { spinner: 'w-12 h-12', text: 'text-base' },
    xl: { spinner: 'w-16 h-16', text: 'text-lg' },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const spinnerContent = (
    <div className={`relative ${config.spinner} ${className}`}>
      {/* Outer ring */}
      <div
        className={`${config.spinner} rounded-full animate-spin`}
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, #E30613 40%, #FFC107 70%, transparent 100%)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), black calc(100% - 2.5px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), black calc(100% - 2.5px))',
        }}
      />
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 bg-handler-red rounded-full animate-pulse-slow" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-500/90 backdrop-blur-sm">
        {spinnerContent}
        {text && (
          <p className={`mt-4 ${config.text} font-medium text-gray-400 animate-pulse-slow`}>{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {spinnerContent}
      {text && (
        <p className={`mt-3 ${config.text} font-medium text-gray-500 animate-fade-in`}>{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
