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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center lg:text-left mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-display">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-2">
          Enter your account details to access your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="form-label">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className={`form-input ${errors.email ? 'form-input-error' : ''}`}
            placeholder="name@company.com"
          />
          {errors.email && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.email.message}</span>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors duration-150">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            {...register('password')}
            className={`form-input ${errors.password ? 'form-input-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.password.message}</span>}
        </div>

        {/* Remember Me toggle check */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-slate-200 text-brand-500 focus:ring-brand-500/20 accent-brand-500 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm font-medium text-slate-600 select-none cursor-pointer">
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors duration-150">
          Sign up
        </Link>
      </p>
    </div>
  );
};
