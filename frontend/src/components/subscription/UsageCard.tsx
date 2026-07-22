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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-200 font-display">Usage this Billing Cycle</h3>
        <p className="text-xs text-slate-400 mt-1">Metrics reset on your monthly renewal date.</p>
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

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/40 text-center">
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
          <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Scans</span>
          <span className="text-xl font-bold text-slate-200 mt-1 block">{analysisCount}</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
          <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Storage Used</span>
          <span className="text-xl font-bold text-slate-200 mt-1 block">
            {(storageUsed / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
          <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Remaining Limit</span>
          <span className="text-xl font-bold text-green-500 mt-1 block">
            {remainingAnalyses === null ? '∞' : remainingAnalyses}
          </span>
        </div>
      </div>
    </div>
  );
};
