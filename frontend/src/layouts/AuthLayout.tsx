import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-slate-950 text-slate-100">
      {/* Visual Identity Column */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 border-r border-slate-800 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-green-500">TNC Guardian</span>
        </div>
        <div className="space-y-4 max-w-md relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Read between the lines before clicking "I Agree".
          </h2>
          <p className="text-lg text-slate-400">
            TNC Guardian reviews long Terms and Conditions agreements, flags risky clauses, and explains legal text in simple English.
          </p>
        </div>
        <div className="text-sm text-slate-500 relative z-10">
          &copy; 2026 TNC Guardian. All rights reserved.
        </div>
      </div>

      {/* Forms Column */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
