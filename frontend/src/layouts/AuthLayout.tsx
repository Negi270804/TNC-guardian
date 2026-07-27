import React from 'react';
import { Outlet } from 'react-router-dom';
import { env } from '@/config/env';

export const AuthLayout: React.FC = () => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] text-slate-800">
      {/* Visual Identity Column */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950/20 p-12 border-r border-slate-200/10 relative overflow-hidden text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-500 font-display">{env.VITE_APP_NAME}</span>
        </div>
        <div className="space-y-4 max-w-md relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight font-display">
            Read between the lines before clicking "I Agree".
          </h2>
          <p className="text-lg text-slate-300">
            {env.VITE_APP_NAME} reviews long Terms and Conditions agreements, flags risky clauses, and explains legal text in simple English.
          </p>
        </div>
        <div className="text-sm text-slate-500 relative z-10">
          &copy; 2026 {env.VITE_APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Forms Column */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-soft">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
