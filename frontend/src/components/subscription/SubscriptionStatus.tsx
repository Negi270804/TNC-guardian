import React from 'react';
import { PlanBadge } from './PlanBadge';
import { formatDate } from '@/utils';

interface SubscriptionStatusProps {
  plan: string;
  status: string;
  renewalDate: string | null;
  onCancel: () => void;
  isCancelling?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  plan,
  status,
  renewalDate,
  onCancel,
  isCancelling = false,
}) => {
  const isPro = plan.toUpperCase() === 'PRO';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 font-display">Subscription Status</h3>
          <p className="text-xs text-slate-400 mt-1">Manage your active billing tier parameters.</p>
        </div>
        <PlanBadge plan={plan} size="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/40">
        <div>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Billing Cycle Status</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200 mt-1.5">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            {status.toUpperCase()}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">
            {isPro ? 'Next Renewal Date' : 'Cycle Reset Date'}
          </span>
          <span className="text-sm font-semibold text-slate-200 mt-1.5 block">
            {renewalDate ? formatDate(renewalDate) : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Standard Price</span>
          <span className="text-sm font-semibold text-slate-200 mt-1.5 block">
            {isPro ? '₹299 / month' : '₹0 / month'}
          </span>
        </div>
      </div>

      {isPro && (
        <div className="pt-4 border-t border-slate-800/40 flex justify-end">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="text-xs font-semibold px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-900/80 text-red-400 rounded transition"
          >
            {isCancelling ? 'Processing...' : 'Cancel Subscription'}
          </button>
        </div>
      )}
    </div>
  );
};
