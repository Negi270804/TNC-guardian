import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { API_ROUTES } from '@/config/api-routes';

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
    mutationFn: async (data: PasswordFormInputs) => {
      const response = await apiClient.post(API_ROUTES.USERS.CHANGE_PASSWORD, {
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
    <div className="max-w-2xl space-y-8 relative fade-in">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-green-200 text-sm font-semibold text-green-700 shadow-xl flex items-center gap-2">
          <span>✅</span>
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-700 shadow-xl flex items-center gap-2">
          <span>❌</span>
          {errorToast}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Security Settings</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Configure your login credentials and password parameters.</p>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-soft space-y-6">
        <h3 className="text-lg font-bold text-slate-900 font-display">Change Password</h3>

        <div className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <input
              type="password"
              {...register('currentPassword')}
              className={`form-input ${errors.currentPassword ? 'form-input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.currentPassword.message}</span>
            )}
          </div>

          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              {...register('newPassword')}
              className={`form-input ${errors.newPassword ? 'form-input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.newPassword.message}</span>
            )}
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
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
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary px-6 py-2.5 shadow-sm text-sm"
        >
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Global application parameters mock checkboxes */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-soft space-y-4 opacity-75">
        <h3 className="text-lg font-bold text-slate-900 font-display">System Preferences</h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Scrub PII automatically</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Remove usernames, addresses, and private metadata before audits.</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-not-allowed" disabled />
        </div>
      </div>
    </div>
  );
};
