import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  planName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  planName,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-2xl animate-scale-up">
        <div className="space-y-2 text-center">
          <span className="text-3xl block">💳</span>
          <h3 className="text-xl font-bold font-display text-slate-900">Upgrade Confirmation</h3>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            You are upgrading your account workspace parameters to the <span className="text-brand-600 font-bold">{planName}</span> plan.
          </p>
        </div>

        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/60 space-y-3 text-xs text-slate-500 font-semibold shadow-inner">
          <div className="flex justify-between font-medium">
            <span>Billing Period:</span>
            <span className="text-slate-800">Monthly</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Price:</span>
            <span className="text-slate-800">₹299 / month</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 font-bold">
            <span className="text-slate-800">Total Due Now:</span>
            <span className="text-brand-600 font-extrabold">₹299</span>
          </div>
        </div>

        <blockquote className="bg-brand-50 border-l-4 border-brand-500 p-3 text-[11px] text-brand-900 rounded-r-xl font-medium leading-relaxed">
          <strong>Sandbox Notice:</strong> No payment details will be requested during this simulated transaction. Confirming updates your account immediately.
        </blockquote>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 btn-secondary py-2.5 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 btn-primary py-2.5 font-bold text-sm shadow-sm"
          >
            {isLoading ? 'Upgrading...' : 'Confirm Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
};
