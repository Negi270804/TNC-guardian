import React from 'react';

interface UsageProgressBarProps {
  label: string;
  value: number;
  max: number | null;
  unit: string;
}

export const UsageProgressBar: React.FC<UsageProgressBarProps> = ({ label, value, max, unit }) => {
  const isUnlimited = max === null;
  const percentage = isUnlimited ? 100 : Math.min(100, (value / max) * 100);
  
  // Format storage displays
  const formatValue = (val: number, isStorage: boolean) => {
    if (!isStorage) return val.toString();
    // Convert bytes to MB
    const mb = val / (1024 * 1024);
    return mb.toFixed(1);
  };

  const isStorage = unit.toLowerCase() === 'mb' || unit.toLowerCase() === 'gb' || label.toLowerCase().includes('storage');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">
          {formatValue(value, isStorage)} {unit} / {isUnlimited ? 'Unlimited' : `${formatValue(max as number, isStorage)} ${unit}`}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isUnlimited
              ? 'bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse'
              : percentage >= 90
              ? 'bg-red-500'
              : percentage >= 75
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!isUnlimited && percentage >= 90 && (
        <span className="text-[10px] text-red-400 font-semibold block mt-1">
          Quota nearly reached. Consider upgrading your plan to bypass constraints.
        </span>
      )}
    </div>
  );
};
