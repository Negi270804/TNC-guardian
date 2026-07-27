import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6 space-y-6 fade-in">
      <h1 className="text-9xl font-extrabold text-brand-500 tracking-widest font-display">404</h1>
      <div className="bg-brand-50 px-4.5 py-1.5 text-xs font-bold rounded-full border border-brand-100 text-brand-600 uppercase tracking-wider">
        Page Not Found
      </div>
      <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
        The legal framework you are searching for does not exist, or this page has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary px-6 py-2.5 text-sm shadow-sm"
      >
        Go Back Home
      </Link>
    </div>
  );
};
