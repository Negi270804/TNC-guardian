import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Upper overview section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Remaining Credits</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">12 / 15</p>
          <span className="text-xs text-slate-500 mt-1 block">Renews on August 1st</span>
        </div>
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Scans Completed</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">34</p>
          <span className="text-xs text-slate-500 mt-1 block">All-time count</span>
        </div>
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Subscription</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">Free Tier</p>
          <span className="text-xs text-slate-500 mt-1 block">Upgrade for PDF & Video scans</span>
        </div>
      </section>

      {/* Analysis Launch Form Section */}
      <section className="p-8 rounded-lg bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Analyze New Document</h2>
          <p className="text-sm text-slate-400 mt-1">Paste a website link, upload a PDF document, or drop screenshot image files below.</p>
        </div>

        {/* Input selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* URL Form Placeholder */}
          <div className="p-6 rounded-md bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="font-semibold text-slate-200">Paste Terms Website URL</h3>
            <input
              type="url"
              placeholder="https://example.com/terms"
              className="w-full px-4 py-3 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              disabled
            />
            <button className="px-4 py-2 bg-green-700 text-white rounded text-sm font-semibold opacity-50 cursor-not-allowed">
              Scan URL
            </button>
          </div>

          {/* File Drop Placeholder */}
          <div className="p-6 rounded-md bg-slate-950 border border-slate-800 border-dashed flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-3xl">📁</span>
            <h3 className="font-semibold text-slate-200">Upload PDF, Image, or Video</h3>
            <p className="text-xs text-slate-500">Drag & drop files here, or click to browse local files.</p>
            <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm font-semibold border border-slate-700 opacity-50 cursor-not-allowed">
              Select Files
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
