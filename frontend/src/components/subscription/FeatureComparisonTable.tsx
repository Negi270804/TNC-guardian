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
    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-soft">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 font-display">Check features comparison</h3>
        <p className="text-xs text-slate-505 mt-1 font-semibold">Detailed comparison of subscription configurations.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="p-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Feature</th>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Free plan</th>
              <th className="p-4 font-extrabold text-brand-600 text-xs uppercase tracking-wider">Pro plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {featuresList.map((feature, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-slate-800">{feature.name}</td>
                <td className="p-4 text-slate-500">{feature.free}</td>
                <td className="p-4 text-brand-600 font-bold">{feature.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
