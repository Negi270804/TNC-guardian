import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api-client';
import { User } from '@/types';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  company: z.string().max(255).optional().or(z.literal('')),
  designation: z.string().max(255).optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  avatarUrl: z.string().max(512).optional().or(z.literal('')),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name || '',
      company: user?.company || '',
      designation: user?.designation || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatar_url || '',
    },
  });

  const mutation = useMutation<User, Error, ProfileFormInputs>({
    mutationFn: async (data) => {
      const response = await apiClient.put<User>('/users/me', {
        full_name: data.fullName,
        company: data.company || null,
        designation: data.designation || null,
        bio: data.bio || null,
        avatar_url: data.avatarUrl || null,
      });
      return response.data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSuccessToast('Profile details updated successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update profile settings.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  const onSubmit = (data: ProfileFormInputs) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl space-y-6 relative">
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
        <h2 className="text-2xl font-bold text-slate-100 font-display">Manage Profile Details</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your personal information, company parameters, and biography details.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6">
        {/* Avatar Upload Placeholder */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-3xl text-slate-300 relative overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.full_name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Avatar Photo</h3>
            <p className="text-xs text-slate-500">Avatar uploads are not connected in Phase 3. Add link below to verify mock image render.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="Name Details"
            />
            {errors.fullName && <span className="text-xs text-red-400 mt-1 block">{errors.fullName.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address (Read Only)</label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-500 focus:outline-none text-sm cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
            <input
              type="text"
              {...register('company')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="SaaS Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Designation</label>
            <input
              type="text"
              {...register('designation')}
              className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
              placeholder="Engineer Manager"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Avatar URL</label>
          <input
            type="text"
            {...register('avatarUrl')}
            className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio / Description</label>
          <textarea
            {...register('bio')}
            rows={4}
            className="w-full px-4 py-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none focus:border-green-500 text-sm"
            placeholder="Share a brief context description..."
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded text-sm font-semibold transition"
        >
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};
