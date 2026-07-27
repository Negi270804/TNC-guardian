import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { env } from '@/config/env';

export const NotFound: React.FC = () => {
  const location = useLocation();
  
  // Detect if route points to a simulated 500 error page
  const is500 = location.pathname.includes('500') || location.search.includes('error=500');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090d16] text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background glow vector */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-8 relative overflow-hidden"
      >
        {/* Glowing edge strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${is500 ? 'from-red-500 to-amber-500' : 'from-brand-500 to-indigo-500'}`} />

        <div className="space-y-4">
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl font-black font-display tracking-widest text-slate-900 dark:text-white"
          >
            {is500 ? '500' : '404'}
          </motion.div>
          
          <div className={`inline-block px-4 py-1.5 text-xs font-bold rounded-full border uppercase tracking-widest select-none ${
            is500 
              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
              : 'bg-brand-500/10 border-brand-500/20 text-brand-500'
          }`}>
            {is500 ? 'Internal Server Error' : 'Compliance Boundary Crossed'}
          </div>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
            {is500 ? 'Something went wrong on our end.' : 'The requested page was not found.'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            {is500 
              ? 'Our pipeline scanning clusters encountered an unexpected legalese ingestion failure. We have logged the error details.'
              : 'The document reference path does not exist, or the contract summary node has expired. Verify your request and try again.'}
          </p>
        </div>

        {/* Quick recovery buttons deck */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 select-none font-bold">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Dashboard Overview
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm rounded-xl shadow-sm transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Return Home Page
          </Link>
        </div>

        {/* Brand signoff */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold select-none">
          {env.VITE_APP_NAME} CONTRACT COMPLIANCE SYSTEMS
        </div>
      </motion.div>
    </div>
  );
};
