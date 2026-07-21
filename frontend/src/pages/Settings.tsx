import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Confirm password does not match new password",
  path: ["confirmPassword"],
});

type PasswordFormInputs = z.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormInputs>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation<any, Error, PasswordFormInputs>({
    mutationFn: async (data) => {
      const response = await apiClient.post('/users/change-password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccessToast('Password changed successfully!');
      reset();
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to change password.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  const onSubmit = (data: PasswordFormInputs) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl space-y-8 relative">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-green-950 border border-green-800 text-sm text-green-300 shadow-lg animate-bounce">
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-red-950 border border-red-800 text-sm text-red-300 shadow-lg">
          {errorToast}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-100 font-display">Security Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your login credentials and password parameters.</p>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-lg font-semibold text-slate-200">Change Password</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
            <input
              type="password"
              {...register('currentPassword')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <span className="text-xs text-red-400 mt-1 block">{errors.currentPassword.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input
              type="password"
              {...register('newPassword')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <span className="text-xs text-red-400 mt-1 block">{errors.newPassword.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-400 mt-1 block">{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded text-sm font-semibold transition"
        >
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Global application parameters mock checkboxes */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4 opacity-60">
        <h3 className="text-lg font-semibold text-slate-200">System Preferences</h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-300">Scrub PII automatically</h4>
            <p className="text-xs text-slate-500">Remove usernames, addresses, and private metadata before audits.</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600 rounded bg-slate-850" disabled />
        </div>
      </div>
    </div>
  );
};
