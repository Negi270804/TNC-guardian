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
    if (score <= 30) return 'text-emerald-500';
    if (score <= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 fade-in text-slate-700">
      
      {/* Welcome & Overview Card */}
      <section className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-soft overflow-hidden group">
        
        {/* Glow vector reflection */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">
              {currentSub?.plan || 'FREE'} WORKSPACE
            </span>
            {user?.is_verified && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Verified
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            Welcome back, {user?.full_name || 'Guardian'}!
          </h2>
          <p className="text-xs sm:text-sm text-brand-100 font-medium">
            Account: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>
        
        <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/15 text-xs font-bold text-white uppercase tracking-widest relative z-10 shrink-0 select-none">
          Active Workspace
        </div>
      </section>

      {/* Dynamic Statistics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
        
        {/* Card 1: Total Scans */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Scans</span>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {isStatsLoading ? '...' : stats?.total_analyses ?? 0}
            </span>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-500 font-bold text-sm select-none">⚖️</span>
          </div>
        </div>

        {/* Card 2: PDF Scans */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PDF Scans</span>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {isStatsLoading ? '...' : stats?.pdf_count ?? 0}
            </span>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-500 font-bold text-sm select-none">📄</span>
          </div>
        </div>

        {/* Card 3: URL Scans */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">URL Scans</span>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {isStatsLoading ? '...' : stats?.url_count ?? 0}
            </span>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-500 font-bold text-sm select-none">🌐</span>
          </div>
        </div>

        {/* Card 4: Text Scans */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Text Scans</span>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {isStatsLoading ? '...' : stats?.text_count ?? 0}
            </span>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-500 font-bold text-sm select-none">📝</span>
          </div>
        </div>

        {/* Card 5: Average Risk */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-2.5 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg. Risk Score</span>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {isStatsLoading ? '...' : (stats?.average_risk_score ?? 0).toFixed(1)}
            </span>
            <span className={`px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-extrabold tracking-wide uppercase ${getRiskLevelColor(stats?.average_risk_score)}`}>
              {isStatsLoading ? '' : getRiskLevelLabel(stats?.average_risk_score)}
            </span>
          </div>
        </div>
      </section>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main: Quick Actions & Charts & Recent Activities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions Panel */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider font-display">Workspace Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link
                to="/profile"
                className="p-5 rounded-xl border border-slate-100 hover:border-brand-350 bg-slate-50/50 hover:bg-slate-50 text-left transition-all duration-300 space-y-2 block shadow-sm group"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">Edit Profile details</h4>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Update profile details, designations, company names, and descriptive bios.</p>
              </Link>
              
              <Link
                to="/documents"
                className="p-5 rounded-xl border border-slate-100 hover:border-brand-350 bg-slate-50/50 hover:bg-slate-50 text-left transition-all duration-300 space-y-2 block shadow-sm group"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">Analyze T&C Policies</h4>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Perform instant compliance scans on agreements, website links, or clipboard text.</p>
              </Link>

            </div>
          </section>

          {/* Analytics Visualizers (Charts Side-by-Side on Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Weekly Analytics Chart Placeholder Redesign */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Weekly Ingestions</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Volume Chart</span>
              </div>
              <div className="relative h-44 w-full">
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#f8fafc" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />
                  
                  {/* Axis values */}
                  <text x="12" y="34" className="text-[9px] font-bold fill-slate-400 font-mono">15</text>
                  <text x="12" y="84" className="text-[9px] font-bold fill-slate-400 font-mono">10</text>
                  <text x="12" y="134" className="text-[9px] font-bold fill-slate-400 font-mono">5</text>
                  <text x="12" y="174" className="text-[9px] font-bold fill-slate-400 font-mono">0</text>

                  {/* Gradient mask */}
                  <path
                    d="M 40 170 C 80 145, 120 165, 160 115 C 200 95, 240 135, 280 65 C 320 55, 360 115, 400 95 C 440 65, 460 45, 480 35 L 480 170 Z"
                    fill="url(#dashboard-glow)"
                    opacity="0.15"
                  />

                  {/* Bezier Trend Line */}
                  <path
                    d="M 40 170 C 80 145, 120 165, 160 115 C 200 95, 240 135, 280 65 C 320 55, 360 115, 400 95 C 440 65, 460 45, 480 35"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  <circle cx="160" cy="115" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="280" cy="65" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="400" cy="95" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="480" cy="35" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Definitions */}
                  <defs>
                    <linearGradient id="dashboard-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono px-9 select-none">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            {/* Risk Distribution Chart Placeholder Redesign */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Risk Distribution</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Audit Ratio</span>
              </div>
              <div className="space-y-3 pt-1">
                {/* Critical */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-red-500 shrink-0" />
                      Critical
                    </span>
                    <span className="text-slate-800 font-mono">15%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>

                {/* High */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-orange-500 shrink-0" />
                      High
                    </span>
                    <span className="text-slate-800 font-mono">25%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-amber-500 shrink-0" />
                      Medium
                    </span>
                    <span className="text-slate-800 font-mono">40%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                {/* Low */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-emerald-500 shrink-0" />
                      Low
                    </span>
                    <span className="text-slate-800 font-mono">20%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Activity Logs */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider font-display">Recent Activity Logs</h3>
            
            {isStatsLoading ? (
              <div className="space-y-3 py-6 animate-pulse">
                <div className="h-14 bg-slate-50 rounded-xl" />
                <div className="h-14 bg-slate-50 rounded-xl" />
                <div className="h-14 bg-slate-50 rounded-xl" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 rounded-xl border border-slate-100 bg-slate-50/50 text-center space-y-3.5">
                <span className="text-4xl block select-none">📊</span>
                <h4 className="font-bold text-slate-700 text-sm">No analysis reports discovered</h4>
                <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed font-semibold">
                  Upload a PDF document, scan a public URL, or paste plain clauses to generate your first audit dashboard profile.
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
                    if (!level) return 'text-slate-650 bg-slate-100/60 border-slate-200/60';
                    switch (level.toUpperCase()) {
                      case 'CRITICAL':
                        return 'text-red-650 bg-red-500/10 border-red-500/20';
                      case 'HIGH':
                        return 'text-red-650 bg-red-500/10 border-red-500/20';
                      case 'MEDIUM':
                        return 'text-amber-650 bg-amber-500/10 border-amber-500/20';
                      case 'LOW':
                        return 'text-emerald-650 bg-emerald-500/10 border-emerald-500/20';
                      default:
                        return 'text-slate-650 bg-slate-100/60 border-slate-200/60';
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
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/40 transition-all duration-300 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-2xl shrink-0 p-2 bg-slate-50 rounded-xl border border-slate-100 select-none group-hover:scale-105 transition-transform" title={doc.source_type || 'PDF'}>
                          {getSourceIcon(doc.source_type)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate max-w-[130px] sm:max-w-[250px] md:max-w-xs" title={doc.original_filename}>
                            {displayName}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-bold uppercase tracking-wider font-mono">
                            Ingested {formatDate(doc.created_at)}
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
                            className="px-3.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-700 font-semibold rounded-lg text-xs transition-colors shadow-sm select-none"
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

        {/* Right side: Sidebar (Subscription Status & Profile Summary Widgets) */}
        <div className="space-y-8">
          
          {/* Subscription Status Card */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Subscription</h3>
              {currentSub && (
                currentSub.demo_mode ? (
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Demo Mode
                  </span>
                ) : (
                  <PlanBadge plan={currentSub.plan} size="sm" />
                )
              )}
            </div>
            
            {currentSub && usage && (
              currentSub.demo_mode ? (
                <div className="space-y-3.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Tier Profile</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-wider">Unlimited Trial</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Status</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-wider">Features Unlocked</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden border border-emerald-500/20">
                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed pt-1">
                    This sandbox profile features unlimited scan allocations. Paid plans and quotas will be introduced in future production phases.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Usage Meter</span>
                    <span className="text-slate-800 font-mono font-bold">
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
                    <div className="pt-2 space-y-4">
                      <div className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2 inline-block">
                        {usage.remaining_analyses !== null && usage.remaining_analyses !== undefined ? usage.remaining_analyses : (currentSub.remaining_analyses || 0)} analyses remaining
                      </div>
                      <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                        Upgrade to a PRO tier for unlimited audits, priority pipeline scanning, and OCR features.
                      </p>
                      <Link
                        to="/subscription"
                        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md shadow-brand-500/20 transition-all select-none text-center block"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                  {currentSub.plan === 'PRO' && (
                    <div className="pt-1.5 text-xs text-slate-500 flex justify-between border-t border-slate-100 pt-3.5 font-bold uppercase tracking-wider">
                      <span>Renewal cycle</span>
                      <span className="text-slate-800 font-mono">Monthly</span>
                    </div>
                  )}
                </div>
              )
            )}
          </section>

          {/* Profile Overview Card */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display border-b border-slate-100 pb-3">
              Profile Summary
            </h3>
            
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center font-bold text-2xl text-slate-500 overflow-hidden shadow-inner select-none relative group">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.full_name || 'U').charAt(0).toUpperCase()
                )}
                {/* Small indicator element */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="text-center space-y-0.5">
                <h4 className="font-bold text-slate-800 text-sm leading-tight">{user?.full_name || 'Guardian Member'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.designation || 'Observer'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Company</span>
                <span className="text-slate-800">{user?.company || 'Not set'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Verification</span>
                <span className={user?.is_verified ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                  {user?.is_verified ? 'Verified Active' : 'Pending Verification'}
                </span>
              </div>
              {user?.bio && (
                <div className="pt-2 space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biography</span>
                  <p className="italic text-slate-650 leading-relaxed font-normal p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};
