import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>();

  const onSubmit = (data: RegisterFormInputs) => {
    setErrorMsg(null);
    const validation = registerSchema.safeParse(data);
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0].message);
      return;
    }

    // Mock Registration: set mock credentials and go to dashboard
    localStorage.setItem('token', 'mock_jwt_access_token');
    navigate('/dashboard');
  };

  return (
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">Create an account</h2>
        <p className="text-sm text-slate-400 mt-2">
          Start auditing Terms and Conditions policies in seconds.
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
          <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword', { required: 'Password confirmation is required' })}
            className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-400 mt-1 block">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold transition"
        >
          Register Account
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};
