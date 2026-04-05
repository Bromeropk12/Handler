import React from 'react';

const badgeVariants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

const Badge = ({ children, variant = 'neutral', dot = false, className = '' }) => {
  return (
    <span className={`${badgeVariants[variant] || badgeVariants.neutral} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'success' ? 'bg-success-300' :
          variant === 'warning' ? 'bg-warning-300' :
          variant === 'danger' ? 'bg-danger-300' :
          variant === 'info' ? 'bg-info-300' :
          'bg-gray-400'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
