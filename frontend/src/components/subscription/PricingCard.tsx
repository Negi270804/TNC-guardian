import React from 'react';
import { PlanBadge } from './PlanBadge';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  isCurrentPlan: boolean;
  isLoading?: boolean;
  onUpgrade: (planName: string) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  features,
  isCurrentPlan,
  isLoading = false,
  onUpgrade,
}) => {
  const isPro = name.toUpperCase() === 'PRO';

  return (
    <div
      className={`rounded-xl p-6 border flex flex-col justify-between transition-all duration-300 ${
        isCurrentPlan
          ? 'bg-slate-900 border-green-500 shadow-[0_0_20px_-5px_rgba(34,197,94,0.15)] scale-[1.02]'
          : isPro
          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700/60 hover:bg-slate-900'
          : 'bg-slate-900/50 border-slate-900 hover:border-slate-800/60'
      }`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-100 uppercase tracking-wide">
              {name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isPro ? 'Best for freelancers & startups' : 'Good for basic validation'}
            </p>
          </div>
          {isCurrentPlan && <PlanBadge plan={name} size="sm" />}
        </div>

        <div className="py-4 border-y border-slate-800/50">
          <span className="text-3xl font-extrabold text-white">{price}</span>
          <span className="text-slate-500 text-xs ml-1">/ month</span>
        </div>

        <ul className="space-y-3 pt-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 pt-4">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 bg-slate-950 border border-slate-800/80 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed"
          >
            Your Current Plan
          </button>
        ) : (
          <button
            onClick={() => onUpgrade(name)}
            disabled={isLoading}
            className={`w-full py-3 font-semibold rounded-lg text-sm transition-all duration-300 ${
              isPro
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-950/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isLoading ? 'Processing...' : isPro ? 'Upgrade to Pro' : 'Choose Free Plan'}
          </button>
        )}
      </div>
    </div>
  );
};
