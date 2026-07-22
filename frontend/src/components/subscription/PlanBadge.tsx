import React from 'react';

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, size = 'md' }) => {
  const isPro = plan.toUpperCase() === 'PRO';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  if (isPro) {
    return (
      <span className={`inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 font-bold text-green-400 uppercase tracking-wider ${sizeClasses[size]}`}>
        Pro Plan
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-slate-800 bg-slate-900 font-semibold text-slate-400 uppercase tracking-wider ${sizeClasses[size]}`}>
      Free Plan
    </span>
  );
};
