import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document, Analysis, AnalysisItem } from '@/types';
import { formatDate } from '@/utils';
import { env } from '@/config/env';
import { API_ROUTES } from '@/config/api-routes';

// Circular Progress Component Redesign
const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
  const radius = 46;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10B981'; // Green (0-30)
  if (score > 30 && score <= 60) strokeColor = '#F59E0B'; // Amber (31-60)
  else if (score > 60) strokeColor = '#EF4444'; // Red (61-100)

  return (
    <div className="relative flex items-center justify-center w-36 h-36 select-none">
      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="#f8fafc"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-slate-900 font-display leading-none">{score}</span>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Risk Score</span>
      </div>
    </div>
  );
};

export const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Fetch document details
  const { data: doc, isLoading: isDocLoading, error: docError } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await apiClient.get<Document>(API_ROUTES.DOCUMENTS.BY_ID(id!));
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch full analysis results
  const { data: analysis, isLoading: isAnalysisLoading, error: analysisError } = useQuery<Analysis>({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await apiClient.get<Analysis>(API_ROUTES.RESULTS.BY_ID(id!));
      return response.data;
    },
    enabled: !!id,
    retry: false,
  });

  // Re-analyze Mutation
  const analyzeMutation = useMutation<any, Error, string>({
    mutationFn: async (docId: string) => {
      const response = await apiClient.post<any>(API_ROUTES.ANALYSIS.BY_ID(docId));
      return response.data;
    },
    onSuccess: (newAnalysis: any) => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['analysis', id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast(`AI Risk Audit refreshed! Risk Score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Re-analysis trigger failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  const handleCopySummary = async () => {
    if (analysis?.summary) {
      try {
        await navigator.clipboard.writeText(analysis.summary);
        setSuccessToast('Summary copied to clipboard!');
        setTimeout(() => setSuccessToast(null), 3000);
      } catch (err) {
        setErrorToast('Failed to copy to clipboard.');
        setTimeout(() => setErrorToast(null), 3000);
      }
    }
  };

  const handleDownloadJSON = () => {
    if (analysis && doc) {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(analysis, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${doc.original_filename.split('.')[0]}_analysis.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.removeChild(downloadAnchor);
    }
  };

  const handleDownloadTxtReport = () => {
    if (!analysis || !doc) return;

    let report = `====================================================\n`;
    report += `${env.VITE_APP_NAME.toUpperCase()} - AI LEGAL RISK ANALYSIS REPORT\n`;
    report += `====================================================\n\n`;
    report += `Document: ${doc.original_filename}\n`;
    report += `Overall Risk Score: ${analysis.overall_risk_score}/100\n`;
    report += `AI Confidence Score: ${analysis.confidence_score ? (analysis.confidence_score <= 1 ? (analysis.confidence_score * 100).toFixed(0) + '%' : analysis.confidence_score + '%') : '95%'}\n`;
    report += `AI Model: ${analysis.model_name} (${analysis.provider})\n`;
    report += `Analysis Time: ${analysis.processing_time}s\n`;
    report += `Date Generated: ${formatDate(analysis.created_at)}\n\n`;
    report += `----------------------------------------------------\n`;
    report += `EXECUTIVE SUMMARY\n`;
    report += `----------------------------------------------------\n`;
    report += `${analysis.summary}\n\n`;

    if (analysis.ai_explanation) {
      report += `----------------------------------------------------\n`;
      report += `AI AUDITOR ASSESSMENT\n`;
      report += `----------------------------------------------------\n`;
      report += `${analysis.ai_explanation}\n\n`;
    }

    report += `----------------------------------------------------\n`;
    report += `KEY RECOMMENDATIONS\n`;
    report += `----------------------------------------------------\n`;
    report += `${analysis.recommendations}\n\n`;

    if (analysis.missing_clauses && analysis.missing_clauses.length > 0) {
      report += `----------------------------------------------------\n`;
      report += `MISSING PROTECTIVE CLAUSES (${analysis.missing_clauses.length})\n`;
      report += `----------------------------------------------------\n`;
      analysis.missing_clauses.forEach((item: { title: string; explanation: string }, index: number) => {
        report += `${index + 1}. ${item.title}\n`;
        report += `   Why it is missing/important: ${item.explanation}\n\n`;
      });
    }

    report += `----------------------------------------------------\n`;
    report += `FLAGGED CLAUSES (${analysis.items.length})\n`;
    report += `----------------------------------------------------\n`;

    analysis.items.forEach((item: AnalysisItem, index: number) => {
      report += `${index + 1}. [${item.risk_level}] ${item.title}\n`;
      report += `   Category: ${item.category}\n`;
      report += `   AI Explanation: ${item.explanation}\n`;
      report += `   Original Text: "${item.original_text}"\n`;
      report += `   Suggestion: ${item.suggestion}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.original_filename.split('.')[0]}_legal_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (itemId: string) => {
    setExpandedClauses((prev: Record<string, boolean>) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const setAllExpanded = (expand: boolean) => {
    if (!analysis) return;
    const updated: Record<string, boolean> = {};
    analysis.items.forEach((item: AnalysisItem) => {
      updated[item.id] = expand;
    });
    setExpandedClauses(updated);
  };

  const getRiskDetails = (score: number) => {
    if (score <= 30) {
      return {
        label: 'Low Risk',
        colorClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10 border-emerald-500/20',
        borderClass: 'border-emerald-500/20',
        bgProgress: 'bg-emerald-500',
        description: 'This document contains standard operational terms with very low risk of user exploitation or privacy leaks.',
      };
    } else if (score <= 60) {
      return {
        label: 'Medium Risk',
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10 border-amber-500/20',
        borderClass: 'border-amber-500/20',
        bgProgress: 'bg-amber-500',
        description: 'Contains standard tracking cookies or auto-renewal charges. Review before committing to automated billings.',
      };
    } else {
      return {
        label: 'High Risk',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10 border-red-500/20',
        borderClass: 'border-red-500/20',
        bgProgress: 'bg-red-500',
        description: 'Includes mandatory class-action waivers, broad liability releases, strict manual cancellation notifications, or data sharing.',
      };
    }
  };

  const getRiskBadgeColor = (level: string) => {
    const norm = level.toUpperCase();
    if (norm === 'CRITICAL' || norm === 'HIGH') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (norm === 'MEDIUM') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  };

  const getClauseHighlightStyles = (level: string) => {
    const norm = level.toUpperCase();
    if (norm === 'CRITICAL' || norm === 'HIGH') {
      return 'p-3.5 rounded-xl border border-red-500/15 bg-slate-50/50 font-mono text-slate-700 text-xs leading-relaxed italic border-l-4 border-l-red-500';
    }
    if (norm === 'MEDIUM') {
      return 'p-3.5 rounded-xl border border-amber-500/15 bg-slate-50/50 font-mono text-slate-700 text-xs leading-relaxed italic border-l-4 border-l-amber-500';
    }
    return 'p-3.5 rounded-xl border border-emerald-500/15 bg-slate-50/50 font-mono text-slate-700 text-xs leading-relaxed italic border-l-4 border-l-emerald-500';
  };

  const isPending = isDocLoading || isAnalysisLoading;
  const hasError = docError || analysisError;

  if (isPending) {
    return (
      <div className="space-y-8 animate-pulse text-slate-700">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
          <div className="h-9 bg-slate-100 rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-80 bg-slate-50 border border-slate-100 rounded-2xl" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
            <div className="h-72 bg-slate-50 border border-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !doc) {
    return (
      <div className="p-12 border border-slate-200/60 bg-white rounded-2xl text-center space-y-5 shadow-soft">
        <span className="text-5xl block select-none">⚠️</span>
        <h3 className="text-xl font-bold text-slate-800">Analysis Results Unavailable</h3>
        <p className="text-sm text-slate-550 max-w-md mx-auto leading-relaxed font-semibold">
          We could not locate the results profile for this document. Verify the document exists and has completed AI auditing.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/documents" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
            Back to Documents
          </Link>
          {doc && (
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow"
            >
              Trigger AI Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-12 border border-slate-200 bg-white rounded-2xl text-center space-y-5 shadow-soft">
        <span className="text-5xl block select-none">🤖</span>
        <h3 className="text-xl font-bold text-slate-800 font-display">Analysis Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          An AI analysis report has not been generated for "{doc.original_filename}" yet.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/documents" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
            Back to Repository
          </Link>
          <button
            onClick={() => analyzeMutation.mutate(doc.id)}
            disabled={analyzeMutation.isPending}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow-md"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Run AI Legal Audit'}
          </button>
        </div>
      </div>
    );
  }

  // Filter clauses by risk level
  const highRiskClauses = analysis.items.filter(
    (item) => item.risk_level.toUpperCase() === 'CRITICAL' || item.risk_level.toUpperCase() === 'HIGH'
  );
  const warningClauses = analysis.items.filter(
    (item) => item.risk_level.toUpperCase() === 'MEDIUM'
  );
  const safeClauses = analysis.items.filter(
    (item) => item.risk_level.toUpperCase() === 'LOW'
  );

  const criticalCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'CRITICAL').length;
  const highCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'HIGH').length;
  const mediumCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'MEDIUM').length;
  const lowCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'LOW').length;

  const riskDetails = getRiskDetails(analysis.overall_risk_score);

  return (
    <div className="space-y-8 relative select-text print:bg-white print:text-black print:p-8 print:space-y-6 fade-in text-slate-700">
      
      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/25 shadow-2xl animate-fadeIn print:hidden">
          <span className="text-base select-none">✓</span>
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Floating Error Toast */}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl bg-red-950/90 text-red-400 border border-red-500/25 shadow-2xl animate-fadeIn print:hidden">
          <span className="text-base select-none">⚠️</span>
          <span className="text-xs font-bold">{errorToast}</span>
        </div>
      )}

      {/* Re-analysis Loading Screen Overlay */}
      {analyzeMutation.isPending && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 print:hidden">
          <style>{`
            @keyframes progress-indeterminate {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
            .animate-progress-indeterminate {
              animation: progress-indeterminate 2.2s infinite ease-in-out;
              width: 50%;
            }
          `}</style>
          
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden animate-fadeIn">
            {/* Top glowing laser line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
            
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500/10 border-b-brand-500/10 border-l-brand-500/10 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-b-brand-400 border-t-brand-400/10 border-r-brand-400/10 border-l-brand-400/10 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
              <span className="text-3xl select-none">🛡️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">AI Re-analysis In Progress</h3>
              <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto font-medium">
                Recalculating clause valuations, verifying modifications, and updating overall safety indices...
              </p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-3 text-left">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>AUDITING ENGINE</span>
                <span className="text-brand-650 font-extrabold animate-pulse uppercase tracking-wider">
                  RE-RUNNING
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden relative">
                <div className="bg-brand-500 h-full rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header breadcrumb bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            <Link to="/documents" className="hover:text-brand-500 transition-colors">Documents</Link>
            <span>/</span>
            <span className="text-slate-500">Results Report</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display truncate max-w-xl">
            Audit Report: {doc.original_filename}
          </h2>
        </div>
        <div className="shrink-0">
          <Link
            to="/documents"
            className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            ← Back to Repository
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: circular meters, breakdowns, metadata */}
        <div className="lg:col-span-1 space-y-6 print:col-span-3">
          
          {/* Gauge card */}
          <section className={`p-6 bg-white border rounded-2xl flex flex-col items-center text-center space-y-4 shadow-soft transition-all duration-300 hover:shadow-hover ${riskDetails.borderClass}`}>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Document Risk Rating</h3>
            
            <CircularProgress score={analysis.overall_risk_score} />
            
            <div className="space-y-2">
              <h4 className={`text-xl font-extrabold font-display uppercase tracking-wide ${riskDetails.colorClass}`}>
                {riskDetails.label}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-[220px] mx-auto">
                {riskDetails.description}
              </p>
            </div>

            {/* Slider bar representation */}
            <div className="w-full pt-1">
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">
                <span>Safe</span>
                <span>Moderate</span>
                <span>Critical</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/25 relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${riskDetails.bgProgress}`}
                  style={{ width: `${analysis.overall_risk_score}%` }}
                />
              </div>
            </div>
          </section>

          {/* Counts Breakdown metrics */}
          <section className="p-6 bg-white border border-slate-200/60 rounded-2xl space-y-4 shadow-soft">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Risk Breakdown</h3>
            <div className="grid grid-cols-2 gap-3 font-semibold">
              {/* Critical */}
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
                <span className="text-2xl font-extrabold text-red-500 block leading-none">{criticalCount}</span>
                <span className="text-[9px] font-bold text-red-400 uppercase mt-1 block">Critical</span>
              </div>
              {/* High */}
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
                <span className="text-2xl font-extrabold text-red-500 block leading-none">{highCount}</span>
                <span className="text-[9px] font-bold text-red-400 uppercase mt-1 block">High</span>
              </div>
              {/* Medium */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                <span className="text-2xl font-extrabold text-amber-500 block leading-none">{mediumCount}</span>
                <span className="text-[9px] font-bold text-amber-500 uppercase mt-1 block">Warning</span>
              </div>
              {/* Low */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                <span className="text-2xl font-extrabold text-emerald-500 block leading-none">{lowCount}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase mt-1 block">Safe</span>
              </div>
            </div>
          </section>

          {/* Audit params metadata list */}
          <section className="p-5 bg-white border border-slate-200/60 rounded-2xl space-y-4 shadow-soft">
            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-display border-b border-slate-100 pb-2">Audit Metadata</h4>
            <div className="space-y-3 text-xs font-semibold text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Source Type:</span>
                <span className="text-slate-800 font-bold flex items-center gap-1">
                  {doc.source_type === 'URL' && '🌐 URL Link'}
                  {doc.source_type === 'TEXT' && '📝 Plain Text'}
                  {(doc.source_type === 'PDF' || !doc.source_type) && '📄 PDF Document'}
                </span>
              </div>
              {doc.source_type === 'URL' && doc.source_url && (
                <div className="border-b border-slate-55 pb-2.5 space-y-1">
                  <span className="block text-slate-400">Source Address:</span>
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] text-brand-600 hover:text-brand-700 hover:underline break-all font-mono font-bold"
                  >
                    {doc.source_url}
                  </a>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Confidence Score:</span>
                <span className="text-emerald-500 font-extrabold">
                  {analysis.confidence_score 
                    ? (analysis.confidence_score <= 1 
                      ? `${(analysis.confidence_score * 100).toFixed(0)}%` 
                      : `${analysis.confidence_score}%`)
                    : '95%'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>AI Auditor Engine:</span>
                <span className="text-slate-700 font-mono text-[11px]">{analysis.model_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>LLM Provider:</span>
                <span className="text-slate-800 font-bold uppercase">{analysis.provider}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Execution Speed:</span>
                <span className="text-brand-600 font-bold">{analysis.processing_time}s</span>
              </div>
              <div className="flex justify-between">
                <span>Generated Date:</span>
                <span className="text-slate-700">{formatDate(analysis.created_at)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: summaries, recommendations, clause lists */}
        <div className="lg:col-span-2 space-y-6 print:col-span-3">
          
          {/* Actions Control Deck Card */}
          <section className="p-4 bg-white border border-slate-200/60 rounded-2xl flex flex-wrap items-center gap-2.5 print:hidden shadow-soft">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              📥 Download JSON
            </button>
            <button
              onClick={handleDownloadTxtReport}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              📝 Download TXT Report
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              🖨️ Print Report
            </button>
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              disabled={analyzeMutation.isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all select-none disabled:opacity-50 ml-auto"
            >
              🔄 Re-analyze
            </button>
          </section>

          {/* AI Summary Card */}
          <section className="p-6 bg-white border border-slate-200/60 rounded-2xl space-y-3 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 select-none border-b border-slate-100 pb-2.5">
              <span>📋</span> Executive Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
              {analysis.summary}
            </p>
          </section>

          {/* AI Assessment Card */}
          {analysis.ai_explanation && (
            <section className="p-6 bg-white border border-slate-200/60 rounded-2xl space-y-3 shadow-soft">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 select-none border-b border-slate-100 pb-2.5">
                <span>🤖</span> AI Auditor Assessment
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {analysis.ai_explanation}
              </p>
            </section>
          )}

          {/* Key Recommendations gradient Panel */}
          <section className="p-6 bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-100 rounded-2xl space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-brand-700 font-display flex items-center gap-2 select-none">
              <span>💡</span> Key Recommendations
            </h3>
            <p className="text-xs sm:text-sm text-brand-900 leading-relaxed whitespace-pre-line font-semibold">
              {analysis.recommendations}
            </p>
          </section>

          {/* Missing Protective Clauses Panel */}
          <section className="p-6 bg-white border border-slate-200/60 rounded-2xl space-y-4 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-2.5 select-none">
              <span>⚠️</span> Missing Protective Clauses ({analysis.missing_clauses?.length || 0})
            </h3>
            {!analysis.missing_clauses || analysis.missing_clauses.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600">
                ✓ No standard protective clauses were found missing. The document is structurally complete.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.missing_clauses.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 font-medium shadow-sm">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-display flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* High Risk Clauses Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                High Risk Clauses ({highRiskClauses.length})
              </h3>
              {highRiskClauses.length > 0 && (
                <div className="flex gap-2 print:hidden font-bold text-[10px] text-slate-400">
                  <button onClick={() => setAllExpanded(true)} className="hover:text-slate-700 transition">[Expand All]</button>
                  <span>|</span>
                  <button onClick={() => setAllExpanded(false)} className="hover:text-slate-700 transition">[Collapse All]</button>
                </div>
              )}
            </div>

            {highRiskClauses.length === 0 ? (
              <div className="p-8 border border-slate-200/60 bg-white rounded-2xl text-center text-xs font-bold text-slate-400 shadow-soft">
                ✓ No critical or high-risk clauses flagged in this agreement.
              </div>
            ) : (
              <div className="space-y-4">
                {highRiskClauses.map((item: AnalysisItem) => {
                  const isExpanded = expandedClauses[item.id] ?? false;
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/60 space-y-3.5 transition hover:border-slate-350 shadow-soft"
                    >
                      <div
                        onClick={() => toggleExpand(item.id)}
                        className="flex justify-between items-start gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1 select-none">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getRiskBadgeColor(item.risk_level)}`}>
                              {item.risk_level}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 font-display">
                            {item.title}
                          </h4>
                        </div>
                        <button className="text-slate-400 hover:text-slate-700 text-[10px] font-bold print:hidden whitespace-nowrap pt-1">
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs font-semibold text-slate-500 animate-fadeIn">
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">AI Assessment</h5>
                            <p className="text-slate-650 leading-relaxed font-normal">{item.explanation}</p>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Original Text Quote</h5>
                            <div className={getClauseHighlightStyles(item.risk_level)}>
                              "{item.original_text}"
                            </div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-900 shadow-sm">
                            <h5 className="font-bold text-brand-700 uppercase text-[9px] tracking-widest mb-0.5">Suggested Action</h5>
                            <p className="text-slate-700 leading-relaxed font-sans font-normal">{item.suggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Warning Clauses Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                Warning Clauses ({warningClauses.length})
              </h3>
            </div>

            {warningClauses.length === 0 ? (
              <div className="p-8 border border-slate-200/60 bg-white rounded-2xl text-center text-xs font-bold text-slate-400 shadow-soft">
                ✓ No medium-risk warning clauses flagged in this agreement.
              </div>
            ) : (
              <div className="space-y-4">
                {warningClauses.map((item: AnalysisItem) => {
                  const isExpanded = expandedClauses[item.id] ?? false;
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/60 space-y-3.5 transition hover:border-slate-350 shadow-soft"
                    >
                      <div
                        onClick={() => toggleExpand(item.id)}
                        className="flex justify-between items-start gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1 select-none">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getRiskBadgeColor(item.risk_level)}`}>
                              {item.risk_level}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 font-display">
                            {item.title}
                          </h4>
                        </div>
                        <button className="text-slate-400 hover:text-slate-700 text-[10px] font-bold print:hidden whitespace-nowrap pt-1">
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs font-semibold text-slate-500 animate-fadeIn">
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">AI Assessment</h5>
                            <p className="text-slate-650 leading-relaxed font-normal">{item.explanation}</p>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Original Text Quote</h5>
                            <div className={getClauseHighlightStyles(item.risk_level)}>
                              "{item.original_text}"
                            </div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-900 shadow-sm">
                            <h5 className="font-bold text-brand-700 uppercase text-[9px] tracking-widest mb-0.5">Suggested Action</h5>
                            <p className="text-slate-700 leading-relaxed font-sans font-normal">{item.suggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Safe Clauses Section */}
          <section className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              Safe Clauses ({safeClauses.length})
            </h3>
            
            {safeClauses.length === 0 ? (
              <div className="p-6 border border-slate-200/60 bg-white rounded-2xl text-center text-slate-400 text-xs font-bold shadow-soft">
                No explicitly safe user-protective covenants identified.
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4 shadow-sm font-semibold text-slate-500 text-xs">
                <p className="text-[11px] text-slate-450 leading-relaxed uppercase tracking-widest block select-none">
                  Identified standard user protections or safe clauses:
                </p>
                <ul className="space-y-3.5 text-xs text-slate-600 list-none pl-0">
                  {safeClauses.map((item: AnalysisItem) => (
                    <li key={item.id} className="flex items-start gap-2.5">
                      <span className="text-emerald-500 text-base font-extrabold select-none">✓</span>
                      <div>
                        <strong className="text-slate-800 font-bold text-sm leading-tight block">{item.title}</strong>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono mt-0.5 block">
                          {item.category}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-normal">{item.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

        </div>
      </div>

    </div>
  );
};
