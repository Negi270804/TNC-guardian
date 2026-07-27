import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { PlanBadge } from '@/components/subscription';
import { API_ROUTES } from '@/config/api-routes';
import { motion } from 'framer-motion';

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
      <motion.section 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-soft overflow-hidden group select-none"
      >
        {/* Glow vector reflection */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500" />
        
        <div className="space-y-2 relative z-10">
          <span className="text-[9px] font-bold text-brand-200 uppercase tracking-widest block">WORKSPACE OVERVIEW</span>
          <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
            Welcome back, {user?.full_name || 'Legal Auditor'}!
          </h2>
          <p className="text-xs text-brand-100/90 leading-relaxed font-semibold max-w-md">
            Scan and audit documents in real-time. Check liability limits and covenants from the diagnostics panel below.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 font-bold bg-white/10 p-3.5 rounded-xl border border-white/10 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-lg shadow-md">
            🛡️
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-brand-100/75">Active Account</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs">{user?.email || 'N/A'}</span>
              <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">VERIFIED</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Grid of Main Dashboard widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Content column: Stats, Charts, Activities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Boxes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-semibold">
            {/* Total Audited */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              whileHover={{ y: -3 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover transition duration-200"
            >
              <div className="flex justify-between items-start select-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Audited</span>
                <span className="text-lg">📄</span>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-display leading-none">
                  {isStatsLoading ? '...' : stats?.total_documents || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">files</span>
              </div>
            </motion.div>

            {/* High/Critical Risks Found */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover transition duration-200"
            >
              <div className="flex justify-between items-start select-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Risks Detected</span>
                <span className="text-lg">⚠️</span>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-500 font-display leading-none">
                  {isStatsLoading ? '...' : stats?.high_risk_count || 0}
                </span>
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">flags</span>
              </div>
            </motion.div>

            {/* Ingestion Success Rate */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              whileHover={{ y: -3 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover transition duration-200"
            >
              <div className="flex justify-between items-start select-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Scan Integrity</span>
                <span className="text-lg">⚡</span>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500 font-display leading-none">99.8%</span>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">success</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Hub Grid */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display select-none">Quick Workspace Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-bold text-slate-800 dark:text-slate-200">
              
              {/* PDF upload quick trigger */}
              <Link to="/documents" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover hover:border-brand-500/40 dark:hover:border-brand-500/30 transition duration-200 h-full flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xl select-none">📄</span>
                    <h4 className="font-bold text-slate-900 dark:text-white font-display text-sm mt-2">Analyze PDF</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold mt-1">
                      Upload agreements locally to run compliance checks.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-500 uppercase tracking-wider flex items-center gap-1.5 mt-4">
                    Launch <span>→</span>
                  </span>
                </motion.div>
              </Link>

              {/* URL Crawler quick trigger */}
              <Link to="/documents?tab=url" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover hover:border-brand-500/40 dark:hover:border-brand-500/30 transition duration-200 h-full flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xl select-none">🌐</span>
                    <h4 className="font-bold text-slate-900 dark:text-white font-display text-sm mt-2">Analyze URL</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold mt-1">
                      Provide policy web links to extract bindings.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-500 uppercase tracking-wider flex items-center gap-1.5 mt-4">
                    Launch <span>→</span>
                  </span>
                </motion.div>
              </Link>

              {/* Text clipboard quick trigger */}
              <Link to="/documents?tab=text" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft hover:shadow-hover hover:border-brand-500/40 dark:hover:border-brand-500/30 transition duration-200 h-full flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xl select-none">📝</span>
                    <h4 className="font-bold text-slate-900 dark:text-white font-display text-sm mt-2">Analyze Text</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold mt-1">
                      Paste agreement paragraphs to run assessments.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-500 uppercase tracking-wider flex items-center gap-1.5 mt-4">
                    Launch <span>→</span>
                  </span>
                </motion.div>
              </Link>

            </div>
          </section>

          {/* Graphics analytics charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Weekly Analytics Ingestion chart card */}
            <motion.section 
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft space-y-4"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white font-display text-sm">Weekly Analytics</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 select-none font-bold uppercase tracking-wider">Document Scans Volume</p>
              </div>

              <div className="w-full h-[140px] flex items-end justify-center select-none pt-2 relative">
                {/* Inline SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="240" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800/40" />
                  <line x1="0" y1="50" x2="240" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800/40" />
                  <line x1="0" y1="80" x2="240" y2="80" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800/40" />
                  
                  {/* Smooth Trend Curve */}
                  <path
                    d="M 10 90 Q 50 20 90 60 T 170 30 T 230 10"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 90 Q 50 20 90 60 T 170 30 T 230 10 L 230 100 L 10 100 Z"
                    fill="url(#trend-grad)"
                    opacity="0.1"
                  />
                  
                  <defs>
                    <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-slate-450 font-bold uppercase tracking-wider">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                  <span>Sun</span>
                </div>
              </div>
            </motion.section>

            {/* Risk Distribution Breakdown bar card */}
            <motion.section 
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft space-y-4"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white font-display text-sm">Risk Distribution</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 select-none font-bold uppercase tracking-wider">Audited Agreements ratios</p>
              </div>

              {/* Progress bars representations */}
              <div className="space-y-3 font-semibold text-[10px] text-slate-500 pt-1">
                {/* Critical/High */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>Critical & High</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {isStatsLoading ? '0' : stats?.high_risk_count || 0} files
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
                {/* Medium */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>Moderate Risks</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {isStatsLoading ? '0' : stats?.medium_risk_count || 0} files
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                {/* Low/Safe */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>Low & Safe</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {isStatsLoading ? '0' : stats?.low_risk_count || 0} files
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
            </motion.section>

          </div>

          {/* Recent Activity Log Lists */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Recent Activity</h3>
              <Link to="/history" className="text-xs text-brand-500 hover:text-brand-600 hover:underline">
                View History <span>→</span>
              </Link>
            </div>

            {isStatsLoading ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl" />
                <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-8 border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl text-center space-y-2 select-none">
                <span className="text-2xl block">📂</span>
                <h4 className="font-bold text-slate-700 dark:text-slate-400 text-xs">No activity logged</h4>
                <p className="text-[11px] text-slate-450 max-w-xs mx-auto leading-relaxed font-semibold">
                  Scan legal agreements from the quick launch panels to display ingestion statistics here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {historyItems.map((doc: any, idx: number) => (
                  <motion.div 
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.04 }}
                    className="py-3.5 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-550 dark:text-slate-400 hover:bg-slate-50/30 dark:hover:bg-slate-850/10 px-1 rounded-lg transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[160px] sm:max-w-sm" title={doc.original_filename}>
                        {doc.original_filename}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold select-none uppercase tracking-wider">
                        <span>{doc.source_type || 'PDF'}</span>
                        <span>•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {doc.analysis ? (
                        <>
                          <span className={`text-[10px] font-extrabold uppercase ${getRiskLevelColor(doc.analysis.overall_risk_score)}`}>
                            {getRiskLevelLabel(doc.analysis.overall_risk_score)} ({doc.analysis.overall_risk_score})
                          </span>
                          <Link 
                            to={`/results/${doc.id}`}
                            className="px-2.5 py-1 bg-brand-500/10 dark:bg-brand-500/20 hover:bg-brand-500 hover:text-white border border-brand-500/25 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-lg transition"
                          >
                            Open
                          </Link>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider animate-pulse">PROCESSING</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right sidebar column: Subscription snapshots, Profile summaries */}
        <div className="space-y-8">
          
          {/* Subscription Tier visual status card */}
          <motion.section 
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft space-y-5"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display select-none">Active Subscription</h3>
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/60 select-none">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">PLAN TIER</span>
                <PlanBadge plan={currentSub?.tier_name} />
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">STATUS</span>
                <span className="text-xs font-black text-emerald-500">ACTIVE</span>
              </div>
            </div>

            {/* Ingestion meters */}
            <div className="space-y-3 font-semibold text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Monthly Scans Volume</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {usage?.scans_used ?? 0} / {usage?.scans_limit === null ? '∞' : (usage?.scans_limit ?? '∞')} used
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${usage?.scans_limit ? Math.min(100, ((usage.scans_used ?? 0) / usage.scans_limit) * 100) : 10}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 select-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Diagnostics Sandbox Note</span>
              <p className="text-[10px] text-slate-450 dark:text-slate-550 leading-relaxed font-semibold">
                This sandbox profile features unlimited scan allocations. Paid plans and quotas will be introduced in future production phases.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="select-none">
              <Link 
                to="/subscription"
                className="w-full text-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-850 hover:border-slate-300 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold shadow-sm inline-block"
              >
                Upgrade Subscription
              </Link>
            </motion.div>
          </motion.section>

          {/* User profile snapshot card */}
          <motion.section 
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-soft space-y-5"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display select-none">Auditor Profile</h3>

            <div className="flex items-center gap-4 select-none">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-base shadow-sm">
                {(user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{user?.full_name || 'User'}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5 tracking-wider">Compliance Officer</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3.5 text-xs font-semibold text-slate-500 select-none">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="text-emerald-500 font-extrabold uppercase text-[10px]">Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Designation:</span>
                <span className="text-slate-700 dark:text-slate-350">General Compliance</span>
              </div>
              <div className="flex justify-between">
                <span>Company Group:</span>
                <span className="text-slate-700 dark:text-slate-350">Diagnostics Sandbox</span>
              </div>
            </div>
          </motion.section>

        </div>

      </div>

    </div>
  );
};
