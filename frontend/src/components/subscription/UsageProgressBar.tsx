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
    <div className="space-y-2 font-medium">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-semibold">{label}</span>
        <span className="text-slate-800 font-bold">
          {formatValue(value, isStorage)} {unit} / {isUnlimited ? 'Unlimited' : `${formatValue(max as number, isStorage)} ${unit}`}
        </span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden relative shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isUnlimited
              ? 'bg-brand-500'
              : percentage >= 90
              ? 'bg-danger'
              : percentage >= 75
              ? 'bg-warning'
              : 'bg-success'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!isUnlimited && percentage >= 90 && (
        <span className="text-[10px] text-danger font-bold block mt-1">
          Quota nearly reached. Consider upgrading your plan to bypass constraints.
        </span>
      )}
    </div>
  );
};
