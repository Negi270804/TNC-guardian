import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '@/services/auth-service';

const resetSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetFormInputs = z.infer<typeof resetSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormInputs>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetFormInputs) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg('No password reset token was provided in the link.');
      return;
    }

    try {
      const response = await authService.resetPassword({
        token,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      setSuccessMsg(response.message || 'Your password has been successfully updated.');
      
      // Delay navigation to login to let the user read the success message
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update your password.';
      setErrorMsg(msg);
    }
  };

  return (
    <div>
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-3xl font-extrabold">New Password</h2>
        <p className="text-sm text-slate-400 mt-2">
          Set your new password below.
        </p>
      </div>

      {!token ? (
        <div className="space-y-6">
          <div className="p-3 rounded bg-red-950/50 border border-red-800 text-sm text-red-300">
            No valid reset token was found in the link. Please make sure you copied the entire URL.
          </div>
          <Link
            to="/forgot-password"
            className="block text-center w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-semibold transition"
          >
            Request New Link
          </Link>
        </div>
      ) : (
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
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
              placeholder="••••••••"
            />
            {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-3 rounded-md bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <span className="text-xs text-red-400 mt-1 block">{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!successMsg}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition"
          >
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400 mt-8">
        Back to{' '}
        <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};
