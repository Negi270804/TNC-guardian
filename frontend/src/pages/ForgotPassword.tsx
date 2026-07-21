import React from 'react';
import { Link } from 'react-router-dom';

export const ForgotPassword: React.FC = () => {
  return (
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">Reset Password</h2>
        <p className="text-sm text-slate-400 mt-2">
          Enter your email address to receive password reset configuration links.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
            placeholder="name@company.com"
            disabled
          />
        </div>

        <button
          className="w-full py-3 bg-green-600/50 text-white rounded-md text-sm font-semibold cursor-not-allowed"
          disabled
        >
          Send Reset Link (Placeholder Only)
        </button>
      </div>

      <p className="text-center text-sm text-slate-400 mt-8">
        Remember your password?{' '}
        <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};
