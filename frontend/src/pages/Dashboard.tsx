import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { PlanBadge } from '@/components/subscription';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: currentSub } = useQuery<any>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/current');
      return res.data;
    },
  });

  const { data: usage } = useQuery<any>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/usage');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Card */}
      <section className="p-8 rounded-lg bg-gradient-to-r from-slate-900 via-slate-900 to-green-950/20 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white font-display">
            Welcome, <span className="text-green-500">{user?.full_name || 'Guardian'}</span>!
          </h2>
          <p className="text-sm text-slate-400">
            Account Email: <span className="text-slate-200 font-semibold">{user?.email}</span>
          </p>
          <p className="text-xs text-slate-500">
            Member since: {user?.created_at ? formatDate(user.created_at) : 'N/A'}
          </p>
        </div>
        <div className="px-4 py-2 rounded bg-green-950/50 border border-green-800/60 text-xs font-semibold text-green-400 uppercase tracking-wider">
          Normal Account Active
        </div>
      </section>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main: Quick Actions & Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions Panel */}
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 font-display">Quick Action Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/profile"
                className="p-4 rounded border border-slate-800 bg-slate-950 hover:border-green-800/40 text-left transition space-y-1 block"
              >
                <h4 className="font-semibold text-slate-200 text-sm">Edit Profile</h4>
                <p className="text-xs text-slate-500">Update company parameters, designation tags, and bio description details.</p>
              </Link>
              <Link
                to="/settings"
                className="p-4 rounded border border-slate-800 bg-slate-950 hover:border-green-800/40 text-left transition space-y-1 block"
              >
                <h4 className="font-semibold text-slate-200 text-sm">Security Controls</h4>
                <p className="text-xs text-slate-500">Modify login passwords, authentication settings, and notifications alerts.</p>
              </Link>
            </div>
          </section>

          {/* Recent Activity Logs */}
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 font-display">Recent Audits activity</h3>
            
            {/* Empty state placeholder for Phase 3 */}
            <div className="p-12 rounded border border-slate-850 bg-slate-950 text-center space-y-2">
              <span className="text-4xl block">📊</span>
              <h4 className="font-semibold text-slate-300 text-sm">No analysis reports discovered</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Once document scanning features are implemented in future phases, completed legal evaluations will appear here.
              </p>
            </div>
          </section>
        </div>

        {/* Right side: Profile Snapshot Details */}
        <div className="space-y-6">
          {/* Subscription Status Widget */}
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-200 font-display">Subscription</h3>
              {currentSub && <PlanBadge plan={currentSub.plan} size="sm" />}
            </div>
            
            {currentSub && usage && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Monthly Usage</span>
                  <span className="text-slate-200">
                    {currentSub.plan === 'FREE' 
                      ? `${usage.analysis_count} / 5 scans` 
                      : `${usage.analysis_count} scans`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${currentSub.plan === 'FREE' ? (usage.analysis_count / 5) * 100 : 100}%` }}
                  />
                </div>
                {currentSub.plan === 'FREE' && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upgrade to PRO for unlimited scans, priority processing and layout analysis.
                    </p>
                    <Link
                      to="/subscription"
                      className="mt-3 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition block text-center shadow-lg"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                )}
                {currentSub.plan === 'PRO' && (
                  <div className="pt-2 text-xs text-slate-400 flex justify-between border-t border-slate-850 pt-3">
                    <span>Renewal Period:</span>
                    <span className="text-slate-200 font-semibold">Monthly</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 font-display">Profile Overview</h3>
            <div className="flex flex-col items-center justify-center py-4 border-b border-slate-850 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-2xl text-slate-300 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-100">{user?.full_name || 'Not Configured'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{user?.designation || 'Visitor'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Company:</span>
                <span className="text-slate-200 font-medium">{user?.company || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Status:</span>
                <span className={user?.is_verified ? 'text-green-500' : 'text-yellow-500'}>
                  {user?.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {user?.bio && (
                <div className="pt-2 border-t border-slate-850 space-y-1">
                  <span className="block text-slate-500">Bio:</span>
                  <p className="italic text-slate-300 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
