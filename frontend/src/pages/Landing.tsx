import React from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-bold text-green-500">{env.VITE_APP_NAME}</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Understand Terms & Conditions <br />
          <span className="text-green-500">before clicking "I Agree"</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          {env.VITE_APP_NAME} uses advanced AI analysis to extract text, run OCR on document snapshots, transcribe scrolling videos, and explain legal agreements in simple, plain English.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm sm:text-base font-semibold transition text-center"
          >
            Start Scanning For Free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm sm:text-base font-semibold transition border border-slate-700 text-center"
          >
            Access Dashboard
          </Link>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 py-8 text-center text-sm text-slate-600">
        &copy; 2026 {env.VITE_APP_NAME}. All rights reserved. Powered by Anthropic Claude API.
      </footer>
    </div>
  );
};
