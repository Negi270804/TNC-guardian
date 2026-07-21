import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setErrorMsg(null);
    try {
      await signup(data.email, data.password, data.fullName);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  return (
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">Create an account</h2>
        <p className="text-sm text-slate-400 mt-2">
          Start auditing Terms and Conditions policies in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded bg-red-950/50 border border-red-800 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            {...register('fullName')}
            className="w-full px-4 py-2.5 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="John Doe"
          />
          {errors.fullName && <span className="text-xs text-red-400 mt-1 block">{errors.fullName.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="name@company.com"
          />
          {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full px-4 py-2.5 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className="w-full px-4 py-2.5 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-400 mt-1 block">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition mt-2"
        >
          {isSubmitting ? 'Registering...' : 'Register Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};
