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
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">Welcome back</h2>
        <p className="text-sm text-slate-400 mt-2">
          Enter your account details to access your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded bg-red-950/50 border border-red-800 text-sm text-red-300 animate-pulse">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="name@company.com"
          />
          {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-green-500 hover:text-green-400">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            {...register('password')}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
        </div>

        {/* Remember Me toggle check */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-green-600 focus:ring-green-500 accent-green-600"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-300 select-none">
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-green-500 hover:text-green-400 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
};
