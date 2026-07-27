import React from 'react';

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan = 'Free', size = 'md' }) => {
  const isPro = (plan ?? 'Free').toUpperCase() === 'PRO';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  if (isPro) {
    return (
      <span className={`inline-flex items-center rounded-full border border-brand-200 bg-brand-50 font-extrabold text-brand-600 uppercase tracking-wider ${sizeClasses[size]}`}>
        Pro Plan
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-600 uppercase tracking-wider ${sizeClasses[size]}`}>
      Free Plan
    </span>
  );
};
