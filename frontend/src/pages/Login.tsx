import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  const onSubmit = (data: LoginFormInputs) => {
    setErrorMsg(null);
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0].message);
      return;
    }

    // Mock Login trigger: set token and go to dashboard
    localStorage.setItem('token', 'mock_jwt_access_token');
    navigate('/dashboard');
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
          <div className="p-3 rounded bg-red-950/50 border border-red-800 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="name@company.com"
          />
          {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <a href="#" className="text-xs text-green-500 hover:text-green-400">Forgot password?</a>
          </div>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold transition"
        >
          Sign In
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
