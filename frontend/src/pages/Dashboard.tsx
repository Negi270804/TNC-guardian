import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { PlanBadge } from '@/components/subscription';
import { API_ROUTES } from '@/config/api-routes';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: currentSub } = useQuery<any>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.SUBSCRIPTION.CURRENT);
      return res.data;
    },
  });

  const { data: usage } = useQuery<any>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.SUBSCRIPTION.USAGE);
      return res.data;
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.DASHBOARD.STATS);
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
    if (score <= 30) return 'text-success';
    if (score <= 60) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Welcome & Overview Card */}
      <section className="p-8 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-soft">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight font-display">
            Welcome, {user?.full_name || 'Guardian'}!
          </h2>
          <p className="text-sm text-brand-100">
            Account Email: <span className="font-semibold">{user?.email}</span>
          </p>
          <p className="text-xs text-brand-200">
            Member since: {user?.created_at ? formatDate(user.created_at) : 'N/A'}
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/20 border border-white/20 text-xs font-semibold text-white uppercase tracking-wider">
          Normal Account Active
        </div>
      </section>

      {/* Dynamic Statistics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {/* Card 1: Total Scans */}
        <div className="saas-card flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-slate-900 font-display">{isStatsLoading ? '...' : stats?.total_analyses ?? 0}</span>
            <span className="text-xl">⚖️</span>
          </div>
        </div>

        {/* Card 2: PDF Scans */}
        <div className="saas-card flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PDF Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-slate-900 font-display">{isStatsLoading ? '...' : stats?.pdf_count ?? 0}</span>
            <span className="text-xl">📄</span>
          </div>
        </div>

        {/* Card 3: URL Scans */}
        <div className="saas-card flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">URL Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-slate-900 font-display">{isStatsLoading ? '...' : stats?.url_count ?? 0}</span>
            <span className="text-xl">🌐</span>
          </div>
        </div>

        {/* Card 4: Text Scans */}
        <div className="saas-card flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Text Scans</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-slate-900 font-display">{isStatsLoading ? '...' : stats?.text_count ?? 0}</span>
            <span className="text-xl">📝</span>
          </div>
        </div>

        {/* Card 5: Average Risk */}
        <div className="saas-card flex flex-col justify-between space-y-2 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg. Risk Score</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold text-slate-900 font-display">
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
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Quick Action Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/profile"
                className="p-5 rounded-xl border border-slate-100 bg-[#F8FAFC] hover:bg-slate-50 text-left hover:border-brand-300 transition-all duration-200 space-y-1.5 block shadow-sm"
              >
                <h4 className="font-semibold text-slate-800 text-sm">Edit Profile</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Update company parameters, designation tags, and bio description details.</p>
              </Link>
              <Link
                to="/documents"
                className="p-5 rounded-xl border border-slate-100 bg-[#F8FAFC] hover:bg-slate-50 text-left hover:border-brand-300 transition-all duration-200 space-y-1.5 block shadow-sm"
              >
                <h4 className="font-semibold text-slate-800 text-sm">Analyze T&Cs</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Perform direct legal audits using PDF, Web URLs, or pasted document texts.</p>
              </Link>
            </div>
          </section>

          {/* Recent Activity Logs */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Recent Audits Activity</h3>
            
            {isStatsLoading ? (
              <div className="space-y-3 py-6 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 rounded-xl border border-slate-100 bg-[#F8FAFC] text-center space-y-2">
                <span className="text-4xl block">📊</span>
                <h4 className="font-semibold text-slate-700 text-sm">No analysis reports discovered</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
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
                    if (!level) return 'text-slate-600 bg-slate-50 border-slate-200';
                    switch (level.toUpperCase()) {
                      case 'CRITICAL':
                        return 'text-red-700 bg-red-50 border-red-200';
                      case 'HIGH':
                        return 'text-red-700 bg-red-50 border-red-200';
                      case 'MEDIUM':
                        return 'text-amber-700 bg-amber-50 border-amber-200';
                      case 'LOW':
                        return 'text-green-700 bg-green-50 border-green-200';
                      default:
                        return 'text-slate-600 bg-slate-50 border-slate-200';
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
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-[#F8FAFC]/50 transition-all duration-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0" title={doc.source_type || 'PDF'}>
                          {getSourceIcon(doc.source_type)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[130px] sm:max-w-[250px] md:max-w-xs" title={doc.original_filename}>
                            {displayName}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            Audited on {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {doc.analysis ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide font-display border ${getRiskBadgeStyles(doc.risk_level)}`}>
                            Score: {doc.analysis.overall_risk_score}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Audited</span>
                        )}
                        {doc.analysis && (
                          <Link
                            to={`/results/${doc.id}`}
                            className="btn-outline py-1 px-3 text-[11px] font-semibold"
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
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-display">Subscription</h3>
              {currentSub && (
                currentSub.demo_mode ? (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
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
                  <div className="flex justify-between text-xs font-semibold border-b border-slate-100 pb-2.5">
                    <span className="text-slate-500">Current Plan</span>
                    <span className="text-green-600 font-bold">Demo Version</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-b border-slate-100 pb-2.5">
                    <span className="text-slate-500">Status</span>
                    <span className="text-green-600 font-bold">All Features Unlocked</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    This MVP provides unrestricted access to all features. Paid plans will be introduced in a future release.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Monthly Usage</span>
                    <span className="text-slate-800 font-mono">
                      {currentSub.plan === 'FREE' 
                        ? `${usage.analysis_count} / ${usage.monthly_limits?.analyses || 10} scans` 
                        : `${usage.analysis_count} scans`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-300"
                      style={{ width: `${currentSub.plan === 'FREE' ? Math.min((usage.analysis_count / (usage.monthly_limits?.analyses || 10)) * 100, 100) : 100}%` }}
                    />
                  </div>
                  {currentSub.plan === 'FREE' && (
                    <div className="pt-2 space-y-3">
                      <div className="text-xs font-bold text-brand-600 bg-brand-50/50 border border-brand-100 rounded-xl px-3 py-1.5 inline-block">
                        {usage.remaining_analyses !== null && usage.remaining_analyses !== undefined ? usage.remaining_analyses : (currentSub.remaining_analyses || 0)} analyses remaining
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Upgrade to PRO for unlimited scans, priority processing and layout analysis.
                      </p>
                      <Link
                        to="/subscription"
                        className="btn-primary w-full py-2 shadow-sm text-xs font-bold text-center"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                  {currentSub.plan === 'PRO' && (
                    <div className="pt-2 text-xs text-slate-500 flex justify-between border-t border-slate-100 pt-3 font-semibold">
                      <span>Renewal Period:</span>
                      <span className="text-slate-800">Monthly</span>
                    </div>
                  )}
                </div>
              )
            )}
          </section>

          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Profile Overview</h3>
            <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-2xl text-slate-600 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800">{user?.full_name || 'Not Configured'}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{user?.designation || 'Visitor'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Company:</span>
                <span className="text-slate-800 font-semibold">{user?.company || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Status:</span>
                <span className={user?.is_verified ? 'text-success font-bold' : 'text-warning font-bold'}>
                  {user?.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {user?.bio && (
                <div className="pt-2.5 border-t border-slate-100 space-y-1">
                  <span className="block text-slate-400">Bio:</span>
                  <p className="italic text-slate-600 leading-relaxed font-normal">{user.bio}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
