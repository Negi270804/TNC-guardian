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

  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
  });
  const historyItems = stats?.recent_activity || [];

  const getRiskLevelLabel = (score: number | undefined) => {
    if (score === undefined || score === 0) return 'NONE';
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    return 'HIGH';
  };

  const getRiskLevelColor = (score: number | undefined) => {
    if (score === undefined || score === 0) return 'text-slate-400';
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

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

      {/* Dynamic Statistics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Total Scans */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-2 hover:border-green-800/40 hover:shadow-green-950/5 hover:-translate-y-0.5 transition-all duration-200">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-white font-mono">{isStatsLoading ? '...' : stats?.total_analyses ?? 0}</span>
            <span className="text-lg">⚖️</span>
          </div>
        </div>

        {/* Card 2: PDF Scans */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-2 hover:border-green-800/40 hover:shadow-green-950/5 hover:-translate-y-0.5 transition-all duration-200">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PDF Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-white font-mono">{isStatsLoading ? '...' : stats?.pdf_count ?? 0}</span>
            <span className="text-lg">📄</span>
          </div>
        </div>

        {/* Card 3: URL Scans */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-2 hover:border-green-800/40 hover:shadow-green-950/5 hover:-translate-y-0.5 transition-all duration-200">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">URL Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-white font-mono">{isStatsLoading ? '...' : stats?.url_count ?? 0}</span>
            <span className="text-lg">🌐</span>
          </div>
        </div>

        {/* Card 4: Text Scans */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-2 hover:border-green-800/40 hover:shadow-green-950/5 hover:-translate-y-0.5 transition-all duration-200">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Text Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-white font-mono">{isStatsLoading ? '...' : stats?.text_count ?? 0}</span>
            <span className="text-lg">📝</span>
          </div>
        </div>

        {/* Card 5: Average Risk */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-2 hover:border-green-800/40 hover:shadow-green-950/5 hover:-translate-y-0.5 transition-all duration-200 col-span-2 md:col-span-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Avg. Risk Score</span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-white font-mono">
              {isStatsLoading ? '...' : (stats?.average_risk_score ?? 0).toFixed(1)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${getRiskLevelColor(stats?.average_risk_score)}`}>
              {isStatsLoading ? '' : getRiskLevelLabel(stats?.average_risk_score)}
            </span>
          </div>
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
                to="/documents"
                className="p-4 rounded border border-slate-800 bg-slate-950 hover:border-green-800/40 text-left transition space-y-1 block"
              >
                <h4 className="font-semibold text-slate-200 text-sm">Analyze T&Cs</h4>
                <p className="text-xs text-slate-500">Perform direct legal audits using PDF, Web URLs, or pasted document texts.</p>
              </Link>
            </div>
          </section>

          {/* Recent Activity Logs */}
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 font-display">Recent Audits Activity</h3>
            
            {isStatsLoading ? (
              <div className="space-y-3 py-6 animate-pulse">
                <div className="h-10 bg-slate-800/50 rounded" />
                <div className="h-10 bg-slate-800/50 rounded" />
                <div className="h-10 bg-slate-800/50 rounded" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 rounded border border-slate-850 bg-slate-950 text-center space-y-2">
                <span className="text-4xl block">📊</span>
                <h4 className="font-semibold text-slate-300 text-sm">No analysis reports discovered</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Scan a website URL, upload a PDF, or paste text to perform your first AI legalese audit.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((doc: any) => {
                  const getSourceIcon = (sourceType: string) => {
                    const norm = (sourceType || '').toUpperCase();
                    if (norm === 'URL') return '🌐';
                    if (norm === 'TEXT') return '📝';
                    return '📄';
                  };

                  const getRiskBadgeStyles = (level: string | null | undefined) => {
                    if (!level) return 'text-slate-400 bg-slate-800/40 border border-slate-700/50';
                    switch (level.toUpperCase()) {
                      case 'CRITICAL':
                        return 'text-red-400 bg-red-950/40 border border-red-800/50';
                      case 'HIGH':
                        return 'text-orange-400 bg-orange-950/40 border border-orange-800/50';
                      case 'MEDIUM':
                        return 'text-yellow-400 bg-yellow-950/40 border border-yellow-800/50';
                      case 'LOW':
                        return 'text-green-400 bg-green-950/40 border border-green-800/50';
                      default:
                        return 'text-slate-400 bg-slate-800/40 border border-slate-700/50';
                    }
                  };

                  const displayName = doc.source_type === 'URL' && doc.source_url ? (
                    (() => {
                      try {
                        const parsed = new URL(doc.source_url);
                        return parsed.hostname.replace('www.', '');
                      } catch (e) {
                        return doc.original_filename;
                      }
                    })()
                  ) : doc.original_filename;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-750 transition flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0" title={doc.source_type || 'PDF'}>
                          {getSourceIcon(doc.source_type)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-200 text-sm truncate max-w-[130px] sm:max-w-[250px] md:max-w-xs" title={doc.original_filename}>
                            {displayName}
                          </h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Audited on {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {doc.analysis ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide font-display border ${getRiskBadgeStyles(doc.risk_level)}`}>
                            Score: {doc.analysis.overall_risk_score}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Not Audited</span>
                        )}
                        {doc.analysis && (
                          <Link
                            to={`/results/${doc.id}`}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-green-800/40 text-[11px] font-semibold text-slate-350 hover:text-white rounded transition"
                          >
                            Results
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right side: Profile Snapshot Details */}
        <div className="space-y-6">
          {/* Subscription Status Widget */}
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-200 font-display">Subscription</h3>
              {currentSub && (
                currentSub.demo_mode ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-955 text-green-400 border border-green-800/40">
                    Demo Mode
                  </span>
                ) : (
                  <PlanBadge plan={currentSub.plan} size="sm" />
                )
              )}
            </div>
            
            {currentSub && usage && (
              currentSub.demo_mode ? (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-xs font-medium border-b border-slate-850 pb-2">
                    <span className="text-slate-400 font-semibold">Current Plan</span>
                    <span className="text-green-400 font-bold">Demo Version</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium border-b border-slate-850 pb-2">
                    <span className="text-slate-400 font-semibold">Status</span>
                    <span className="text-green-400 font-bold">All Features Unlocked</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    This MVP provides unrestricted access to all features. Paid plans will be introduced in a future release.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400 font-semibold">Monthly Usage</span>
                    <span className="text-slate-200">
                      {currentSub.plan === 'FREE' 
                        ? `${usage.analysis_count} / ${usage.monthly_limits?.analyses || 10} scans` 
                        : `${usage.analysis_count} scans`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${currentSub.plan === 'FREE' ? (usage.analysis_count / (usage.monthly_limits?.analyses || 10)) * 100 : 100}%` }}
                    />
                  </div>
                  {currentSub.plan === 'FREE' && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-green-400">
                        Free Plan: {usage.remaining_analyses !== null && usage.remaining_analyses !== undefined ? usage.remaining_analyses : (currentSub.remaining_analyses || 0)} analyses remaining
                      </div>
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
              )
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
