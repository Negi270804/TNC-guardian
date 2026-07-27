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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormInputs>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotFormInputs) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await authService.forgotPassword(data.email);
      setSuccessMsg(response.message || 'If an account exists for this email, a password reset link has been sent.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to send password reset request.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center lg:text-left mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-display">Reset Password</h2>
        <p className="text-sm text-slate-500 mt-2">
          Enter your email address to receive password reset configuration links.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
            {successMsg}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Remember your password?{' '}
        <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors duration-150">
          Sign in
        </Link>
      </p>
    </div>
  );
};
