import React from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 selection:bg-brand-100 selection:text-brand-900">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-bold text-brand-500 font-display">{env.VITE_APP_NAME}</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Log In
          </Link>
          <Link
            to="/register"
            className="btn-primary py-2 text-sm shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          <span>AI-Powered Legal Audits</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight font-display">
          Understand Terms & Conditions <br />
          <span className="text-brand-500">before clicking "I Agree"</span>
        </h1>
        
        <p className="text-base sm:text-xl text-slate-500 max-w-2xl leading-relaxed">
          {env.VITE_APP_NAME} uses advanced AI analysis to extract text, run OCR on document snapshots, transcribe scrolling videos, and explain legal agreements in simple, plain English.
        </p>

        {/* Feature Matrix Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl max-w-md w-full text-left space-y-4 shadow-soft">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-100 pb-2">
            Analyze Terms & Conditions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Supported</span>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5 font-medium"><span className="text-brand-500">✓</span> URL</li>
                <li className="flex items-center gap-1.5 font-medium"><span className="text-brand-500">✓</span> Text PDF</li>
                <li className="flex items-center gap-1.5 font-medium"><span className="text-brand-500">✓</span> DOCX</li>
                <li className="flex items-center gap-1.5 font-medium"><span className="text-brand-500">✓</span> TXT</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Optional</span>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1 font-medium">
                  🧪 Image OCR <span className="text-[9px] bg-brand-50 text-brand-600 border border-brand-100 px-1 py-0.5 rounded font-bold uppercase ml-1">Beta</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="btn-primary px-6 py-3.5 shadow-md"
          >
            Start Scanning For Free
          </Link>
          <Link
            to="/login"
            className="btn-outline px-6 py-3.5"
          >
            Access Dashboard
          </Link>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        &copy; 2026 {env.VITE_APP_NAME}. All rights reserved. Powered by Anthropic Claude API.
      </footer>
    </div>
  );
};
