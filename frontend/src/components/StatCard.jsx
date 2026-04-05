import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const colorMap = {
  default: {
    iconBg: 'bg-gray-700/50',
    iconColor: 'text-gray-300',
    accentBg: 'bg-gray-500',
  },
  red: {
    iconBg: 'bg-handler-red/15',
    iconColor: 'text-handler-red',
    accentBg: 'bg-handler-red',
  },
  gold: {
    iconBg: 'bg-handler-gold/15',
    iconColor: 'text-handler-gold',
    accentBg: 'bg-handler-gold',
  },
  success: {
    iconBg: 'bg-success-50',
    iconColor: 'text-success-300',
    accentBg: 'bg-success-300',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-300',
    accentBg: 'bg-warning-300',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconColor: 'text-danger-300',
    accentBg: 'bg-danger-300',
  },
  info: {
    iconBg: 'bg-info-50',
    iconColor: 'text-info-300',
    accentBg: 'bg-info-300',
  },
};

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'default', 
  trend, 
  trendValue,
  className = '' 
}) => {
  const colors = colorMap[color] || colorMap.default;

  return (
    <div className={`stat-card group hover:border-gray-600 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.iconColor}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-success-300' : 'text-danger-300'
          }`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="mt-1">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-gray-400 mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Accent line at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.accentBg} opacity-60`} />
    </div>
  );
};

export default StatCard;
