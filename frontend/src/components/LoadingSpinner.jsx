import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable loading spinner component
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @param {string} text - Optional loading text
 * @param {boolean} fullScreen - Whether to show as full screen overlay
 * @param {string} color - Tailwind color class (e.g., 'indigo', 'blue')
 */
const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  fullScreen = false,
  color = 'indigo'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 
        className={`${sizeClasses[size]} text-${color}-600 animate-spin`} 
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Skeleton loader for content placeholder
 */
export const SkeletonLoader = ({ count = 1, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

/**
 * Card skeleton for loading cards
 */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table skeleton for loading tables
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(cols)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(cols)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoadingSpinner;
