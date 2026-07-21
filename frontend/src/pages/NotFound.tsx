import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-6">
      <h1 className="text-9xl font-extrabold text-green-500 tracking-widest">404</h1>
      <div className="bg-green-600/10 px-3 py-1 text-sm rounded border border-green-800 text-green-400">
        Page Not Found
      </div>
      <p className="text-slate-400 max-w-sm">
        The legal framework you are searching for does not exist, or this page has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-semibold transition"
      >
        Go Back Home
      </Link>
    </div>
  );
};
