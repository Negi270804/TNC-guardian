import React from 'react';

export const History: React.FC = () => {
  const mockHistory = [
    { id: '1', title: 'Slack Terms of Service', date: '2026-07-20', score: 72, risk: 'High', type: 'URL' },
    { id: '2', title: 'OpenAI Usage Policy', date: '2026-07-18', score: 45, risk: 'Medium', type: 'PDF' },
    { id: '3', title: 'Spotify Terms and Conditions', date: '2026-07-15', score: 28, risk: 'Low', type: 'Video' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Scan History Logs</h2>
        <p className="text-sm text-slate-400 mt-1">Review, search, and reload your previously audited agreements.</p>
      </div>

      {/* History table mock */}
      <div className="overflow-x-auto rounded-lg bg-slate-900 border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Document Title</th>
              <th className="p-4">Scan Date</th>
              <th className="p-4">Input Type</th>
              <th className="p-4">Risk Score</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-300 divide-y divide-slate-850">
            {mockHistory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40">
                <td className="p-4 font-medium text-slate-100">{item.title}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-400">{item.type}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      item.risk === 'High'
                        ? 'text-red-400 bg-red-950/40'
                        : item.risk === 'Medium'
                        ? 'text-yellow-400 bg-yellow-950/40'
                        : 'text-green-400 bg-green-950/40'
                    }`}
                  >
                    {item.score} ({item.risk})
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="px-3 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded text-xs transition">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
