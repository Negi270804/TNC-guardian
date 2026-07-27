import React from 'react';
import { UsageProgressBar } from './UsageProgressBar';

interface UsageCardProps {
  analysisCount: number;
  storageUsed: number;
  remainingAnalyses: number | null;
  analysesLimit: number | null;
  uploadSizeLimit: number;
}

export const UsageCard: React.FC<UsageCardProps> = ({
  analysisCount,
  storageUsed,
  remainingAnalyses,
  analysesLimit,
  uploadSizeLimit,
}) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-6 shadow-soft text-slate-800">
      <div>
        <h3 className="text-lg font-bold text-slate-900 font-display">Usage this Billing Cycle</h3>
        <p className="text-xs text-slate-505 mt-1 font-semibold">Metrics reset on your monthly renewal date.</p>
      </div>

      <div className="space-y-6 pt-2">
        <UsageProgressBar
          label="AI Scans Completed"
          value={analysisCount}
          max={analysesLimit}
          unit="analyses"
        />

        <UsageProgressBar
          label="Single File Upload Limit"
          value={0} // Displays limit focus
          max={uploadSizeLimit}
          unit="MB"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center font-semibold">
        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200/60 shadow-sm">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Total Scans</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1 block">{analysisCount}</span>
        </div>
        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200/60 shadow-sm">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Storage Used</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1 block">
            {(storageUsed / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200/60 shadow-sm">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">Remaining Limit</span>
          <span className="text-xl font-extrabold text-success mt-1 block">
            {remainingAnalyses === null ? '∞' : remainingAnalyses}
          </span>
        </div>
      </div>
    </div>
  );
};
