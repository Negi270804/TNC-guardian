import React from 'react';

export const FeatureComparisonTable: React.FC = () => {
  const featuresList = [
    {
      name: 'AI Analyses quota',
      free: '10 analyses / month',
      pro: 'Unlimited',
    },
    {
      name: 'Max file upload size',
      free: '5 MB',
      pro: '25 MB',
    },
    {
      name: 'Analysis History retention',
      free: 'Last 10 reports',
      pro: 'Unlimited history',
    },
    {
      name: 'OCR Parsing algorithms',
      free: 'Basic OCR Engine',
      pro: 'Advanced layout-aware OCR',
    },
    {
      name: 'Document export option',
      free: 'No',
      pro: 'PDF Export (Future ready)',
    },
    {
      name: 'Processing prioritization',
      free: 'Standard Queue',
      pro: 'Priority Server Queue',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/40">
        <h3 className="text-lg font-semibold text-slate-200 font-display">Check features comparison</h3>
        <p className="text-xs text-slate-400 mt-1">Detailed comparison of subscription configurations.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-850">
              <th className="p-4 font-semibold text-slate-400">Feature</th>
              <th className="p-4 font-semibold text-slate-400">Free plan</th>
              <th className="p-4 font-semibold text-slate-400 text-green-400">Pro plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {featuresList.map((feature, idx) => (
              <tr key={idx} className="hover:bg-slate-950/20">
                <td className="p-4 text-slate-300 font-medium">{feature.name}</td>
                <td className="p-4 text-slate-400">{feature.free}</td>
                <td className="p-4 text-green-400/90 font-semibold">{feature.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
