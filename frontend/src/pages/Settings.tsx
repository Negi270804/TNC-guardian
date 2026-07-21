import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Profile & Configuration Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your target thresholds limits, languages preferences, and email notifications settings.</p>
      </div>

      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6">
        {/* Toggle options mocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Automatically scrub PII data</h3>
              <p className="text-xs text-slate-500">Remove usernames, addresses, and private accounts tags before parsing with Claude API.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600 rounded bg-slate-850" disabled />
          </div>

          <hr className="border-slate-800" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Email Risk Alerts</h3>
              <p className="text-xs text-slate-500">Receive inbox updates immediately when analyses highlight risk indexes above your selected threshold limits.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600 rounded bg-slate-850" disabled />
          </div>

          <hr className="border-slate-800" />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">Analysis Language Output</h3>
            <p className="text-xs text-slate-500">Translate legal terms definitions and precautionary guidelines into your preferred translation language.</p>
            <select className="mt-2 w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none" disabled>
              <option>English (en)</option>
              <option>Spanish (es)</option>
              <option>French (fr)</option>
            </select>
          </div>
        </div>

        <button className="px-4 py-2 bg-green-700 text-white rounded text-sm font-semibold opacity-50 cursor-not-allowed">
          Save Settings
        </button>
      </div>
    </div>
  );
};
