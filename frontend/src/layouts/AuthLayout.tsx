import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { env } from '@/config/env';
import { motion } from 'framer-motion';

export const AuthLayout: React.FC = () => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#070A13] text-slate-100 antialiased font-sans transition-colors duration-300">
      
      {/* Visual Identity Column (Left side) */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#04060C] via-[#090D1A] to-[#0D1426] p-12 border-r border-slate-900 relative overflow-hidden text-white">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-brand-600/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Branding header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              🛡️
            </span>
            <span className="text-lg font-bold font-display text-white tracking-tight">
              {env.VITE_APP_NAME}
            </span>
          </Link>
        </div>

        {/* Dynamic Graphic Mockup Illustration */}
        <div className="relative z-10 flex items-center justify-center my-8">
          <div className="w-full max-w-sm p-6 bg-slate-950/50 backdrop-blur-md border border-slate-800/80 rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
            {/* Holographic scanning laser bar simulation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-pulse" />
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">TNC_Scanner_v1.0</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold uppercase tracking-wider text-[8px] animate-pulse">
                Ready
              </span>
            </div>

            {/* Simulated legal analysis graphic */}
            <div className="space-y-3">
              <div className="h-2 w-3/4 bg-slate-800 rounded-full" />
              <div className="h-2 w-5/6 bg-slate-800 rounded-full" />
              <div className="h-2 w-2/3 bg-slate-800 rounded-full" />
              {/* Highlighted clause block */}
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-red-400 uppercase tracking-widest">
                  <span>Class Action Waiver</span>
                  <span>High Risk</span>
                </div>
                <div className="h-1.5 w-full bg-red-400/20 rounded-full" />
                <div className="h-1.5 w-4/5 bg-red-400/20 rounded-full" />
              </div>
              <div className="h-2 w-1/2 bg-slate-800 rounded-full" />
            </div>

            {/* Audit metrics dial indicator */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Isolated Sandbox</span>
              </div>
              <span className="font-bold text-slate-300">Fast Scan • &lt;3s</span>
            </div>
          </div>
        </div>

        {/* Lower Slogan info */}
        <div className="space-y-4 max-w-md relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight font-display leading-tight text-white">
            Read between the lines before clicking <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">"I Agree"</span>.
          </h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            {env.VITE_APP_NAME} simplifies legalese, audits liability exposures, flags auto-renewals, and highlights missing user protection policies.
          </p>
        </div>

        <div className="text-xs text-slate-600 relative z-10 font-semibold">
          &copy; {new Date().getFullYear()} {env.VITE_APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Forms Column (Right side) */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative min-h-screen">
        
        {/* Visual glow details */}
        <div className="absolute top-1/4 right-1/4 w-[250px] h-[250px] bg-brand-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

        {/* Floating brand icon for mobile headers */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2 z-20">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-base shadow shadow-brand-500/10">
              🛡️
            </span>
            <span className="text-base font-bold font-display text-white tracking-tight">
              {env.VITE_APP_NAME}
            </span>
          </Link>
        </div>

        {/* Form Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md bg-slate-900/35 backdrop-blur-xl border border-slate-800/80 shadow-2xl p-6 sm:p-8 rounded-2xl relative overflow-hidden"
        >
          {/* Edge glow border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
          <Outlet />
        </motion.div>
      </div>

    </div>
  );
};
