import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Custom Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Password Visibility Toggle State
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('remembered_email') || '',
      password: '',
      rememberMe: !!localStorage.getItem('remembered_email'),
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setToast(null);
    try {
      await login(data.email, data.password);
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      setToast({ type: 'success', message: 'Sign in successful. Redirecting...' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Incorrect email or password.' });
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
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">Welcome back</h2>
        <p className="text-xs sm:text-sm text-slate-450 mt-1.5 font-medium">
          Enter your details to sign in to your audit workspace.
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={`w-full pl-4 pr-11 py-3 bg-slate-950/60 border ${errors.password ? 'border-danger' : 'border-slate-800'} focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-white placeholder-slate-650 rounded-xl text-sm transition-all duration-200 outline-none`}
              placeholder="••••••••"
            />
            {/* Toggle Visibility button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-red-400 block font-semibold animate-fadeIn">{errors.password.message}</span>
          )}
        </div>

        {/* Remember Me toggle check */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-brand-500 focus:ring-brand-500/20 accent-brand-500 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="ml-2.5 block text-xs sm:text-sm font-semibold text-slate-400 select-none cursor-pointer hover:text-slate-300 transition-colors">
            Remember Me
          </label>
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
              <span>Signing In...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Secondary routing link */}
      <p className="text-center text-xs sm:text-sm text-slate-450 mt-6 font-semibold">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
};
