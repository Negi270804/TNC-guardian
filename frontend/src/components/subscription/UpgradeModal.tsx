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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-2 text-center">
          <span className="text-3xl block">💳</span>
          <h3 className="text-xl font-bold font-display text-white">Upgrade Confirmation</h3>
          <p className="text-sm text-slate-400">
            You are upgrading your account workspace parameters to the <span className="text-green-500 font-semibold">{planName}</span> plan.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-3 text-xs text-slate-400">
          <div className="flex justify-between font-medium">
            <span>Billing Period:</span>
            <span className="text-slate-200">Monthly</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Price:</span>
            <span className="text-slate-200">₹299 / month</span>
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-2 font-semibold">
            <span className="text-slate-300">Total Due Now:</span>
            <span className="text-green-400">₹299</span>
          </div>
        </div>

        <blockquote className="bg-green-950/20 border-l-2 border-green-500 p-3 text-[11px] text-green-300 rounded-r">
          <strong>Sandbox Notice:</strong> No payment details will be requested during this simulated transaction. Confirming updates your account immediately.
        </blockquote>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-300 rounded font-semibold text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded font-semibold text-sm transition"
          >
            {isLoading ? 'Upgrading...' : 'Confirm Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
};
