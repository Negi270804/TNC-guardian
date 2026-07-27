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
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-6 shadow-soft text-slate-850">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Subscription Status</h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Manage your active billing tier parameters.</p>
        </div>
        <PlanBadge plan={plan} size="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 font-semibold">
        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block">Billing Cycle Status</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-800 mt-1.5">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping" />
            {status.toUpperCase()}
          </span>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block">
            {isPro ? 'Next Renewal Date' : 'Cycle Reset Date'}
          </span>
          <span className="text-sm text-slate-800 mt-1.5 block">
            {renewalDate ? formatDate(renewalDate) : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block">Standard Price</span>
          <span className="text-sm text-slate-800 mt-1.5 block">
            {isPro ? '₹299 / month' : '₹0 / month'}
          </span>
        </div>
      </div>

      {isPro && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="btn-danger py-2 px-4 text-xs font-bold"
          >
            {isCancelling ? 'Processing...' : 'Cancel Subscription'}
          </button>
        </div>
      )}
    </div>
  );
};
