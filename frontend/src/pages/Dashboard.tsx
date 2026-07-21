import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

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
