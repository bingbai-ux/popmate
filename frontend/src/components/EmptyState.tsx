'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon ? (
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-text-muted">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-dark mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
