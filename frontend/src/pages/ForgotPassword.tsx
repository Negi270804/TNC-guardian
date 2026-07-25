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
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">Reset Password</h2>
        <p className="text-sm text-slate-400 mt-2">
          Enter your email address to receive password reset configuration links.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded bg-red-950/50 border border-red-800 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded bg-green-950/50 border border-green-800 text-sm text-green-300">
            {successMsg}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition"
        >
          {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Remember your password?{' '}
        <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};
