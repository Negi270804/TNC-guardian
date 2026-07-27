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
    <div className="fade-in">
      <div className="text-center lg:text-left mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-display">Create an account</h2>
        <p className="text-sm text-slate-500 mt-2">
          Start auditing Terms and Conditions policies in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            {...register('fullName')}
            className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
            placeholder="John Doe"
          />
          {errors.fullName && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.fullName.message}</span>}
        </div>

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
          <label className="form-label">Password</label>
          <input
            type="password"
            {...register('password')}
            className={`form-input ${errors.password ? 'form-input-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.password.message}</span>}
        </div>

        <div>
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full mt-2"
        >
          {isSubmitting ? 'Registering...' : 'Register Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors duration-150">
          Sign in
        </Link>
      </p>
    </div>
  );
};
