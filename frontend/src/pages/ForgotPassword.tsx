import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '@/services/auth-service';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotFormInputs = z.infer<typeof forgotSchema>;

export const ForgotPassword: React.FC = () => {
  // Custom Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormInputs>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotFormInputs) => {
    setToast(null);
    try {
      const response = await authService.forgotPassword(data.email);
      setToast({
        type: 'success',
        message: response.message || 'If an account exists, a password reset link has been sent.'
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to send password reset request.';
      setToast({
        type: 'error',
        message: msg
      });
    }
  };

  return (
    <div className="fade-in space-y-6">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl border shadow-2xl animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/25' 
            : 'bg-red-950/90 text-red-400 border-red-500/25'
        }`}>
          <span className="text-base">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">Forgot Password?</h2>
        <p className="text-xs sm:text-sm text-slate-450 mt-1.5 font-medium">
          Enter your email to receive a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className={`w-full px-4 py-3 bg-slate-950/60 border ${errors.email ? 'border-danger' : 'border-slate-800'} focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-white placeholder-slate-650 rounded-xl text-sm transition-all duration-200 outline-none`}
            placeholder="name@company.com"
          />
          {errors.email && (
            <span className="text-xs text-red-400 block font-semibold animate-fadeIn">{errors.email.message}</span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Sending Reset Link...</span>
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      {/* Secondary route link */}
      <p className="text-center text-xs sm:text-sm text-slate-450 mt-6 font-semibold">
        Remembered your password?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
};
