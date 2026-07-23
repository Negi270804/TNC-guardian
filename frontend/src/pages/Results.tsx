import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document, Analysis } from '@/types';
import { formatDate } from '@/utils';

// Helper component for drawing the circular progress SVG ring
const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10B981'; // Green (0-30)
  if (score > 30 && score <= 60) strokeColor = '#F59E0B'; // Yellow (31-60)
  else if (score > 60) strokeColor = '#EF4444'; // Red (61-100)

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="#1e293b"
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
        <span className="text-4xl font-extrabold text-slate-100 font-display">{score}</span>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Risk Score</span>
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
      const response = await apiClient.get<Document>(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch full analysis results
  const { data: analysis, isLoading: isAnalysisLoading, error: analysisError } = useQuery<Analysis>({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await apiClient.get<Analysis>(`/results/${id}`);
      return response.data;
    },
    enabled: !!id,
    retry: false,
  });

  // Re-analyze Mutation
  const analyzeMutation = useMutation<any, Error, string>({
    mutationFn: async (docId: string) => {
      const response = await apiClient.post<any>(`/analysis/${docId}`);
      return response.data;
    },
    onSuccess: (newAnalysis) => {
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
    report += `TNC GUARDIAN - AI LEGAL RISK ANALYSIS REPORT\n`;
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
      analysis.missing_clauses.forEach((item, index) => {
        report += `${index + 1}. ${item.title}\n`;
        report += `   Why it is missing/important: ${item.explanation}\n\n`;
      });
    }

    report += `----------------------------------------------------\n`;
    report += `FLAGGED CLAUSES (${analysis.items.length})\n`;
    report += `----------------------------------------------------\n`;

    analysis.items.forEach((item, index) => {
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
    setExpandedClauses((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const setAllExpanded = (expand: boolean) => {
    if (!analysis) return;
    const updated: Record<string, boolean> = {};
    analysis.items.forEach((item) => {
      updated[item.id] = expand;
    });
    setExpandedClauses(updated);
  };

  const getRiskDetails = (score: number) => {
    if (score <= 30) {
      return {
        label: 'Low Risk',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-950/60',
        borderClass: 'border-green-800/40',
        bgProgress: 'bg-green-500',
        description: 'This document contains standard operational terms with very low risk of user exploitation or privacy leaks.',
      };
    } else if (score <= 60) {
      return {
        label: 'Medium Risk',
        colorClass: 'text-yellow-400',
        bgClass: 'bg-yellow-950/60',
        borderClass: 'border-yellow-800/40',
        bgProgress: 'bg-yellow-500',
        description: 'Contains standard tracking cookies or auto-renewal charges. Review before committing to automated billings.',
      };
    } else {
      return {
        label: 'High Risk',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-950/60',
        borderClass: 'border-red-800/40',
        bgProgress: 'bg-red-500',
        description: 'Includes mandatory class-action waivers, broad liability releases, strict manual cancellation notifications, or data sharing marketing affiliates.',
      };
    }
  };

  const getRiskBadgeColor = (level: string) => {
    const norm = level.toUpperCase();
    if (norm === 'CRITICAL') return 'bg-red-950/60 text-red-400 border-red-800/30';
    if (norm === 'HIGH') return 'bg-orange-950/60 text-orange-400 border-orange-800/30';
    if (norm === 'MEDIUM') return 'bg-yellow-950/60 text-yellow-400 border-yellow-800/30';
    return 'bg-green-950/60 text-green-400 border-green-800/30';
  };

  const getClauseHighlightStyles = (level: string) => {
    const norm = level.toUpperCase();
    if (norm === 'CRITICAL' || norm === 'HIGH') {
      return 'p-3 rounded border border-red-900/30 bg-red-950/10 font-mono text-red-200 text-[11px] leading-relaxed italic border-l-4 border-l-red-500';
    }
    if (norm === 'MEDIUM') {
      return 'p-3 rounded border border-yellow-900/30 bg-yellow-950/10 font-mono text-yellow-200 text-[11px] leading-relaxed italic border-l-4 border-l-yellow-500';
    }
    return 'p-3 rounded border border-green-900/30 bg-green-950/10 font-mono text-green-200 text-[11px] leading-relaxed italic border-l-4 border-l-green-500';
  };

  const isPending = isDocLoading || isAnalysisLoading;
  const hasError = docError || analysisError;

  if (isPending) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="h-8 bg-slate-800 rounded w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-72 bg-slate-800 rounded" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-slate-800 rounded" />
            <div className="h-64 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !doc) {
    return (
      <div className="p-12 border border-slate-850 bg-slate-900 rounded-xl text-center space-y-5">
        <span className="text-5xl block">⚠️</span>
        <h3 className="text-xl font-bold text-slate-200">Analysis Results Unavailable</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          We could not load the results report for this document. Verify the document exists and has been successfully analyzed.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/documents" className="px-4 py-2 bg-slate-855 border border-slate-800 text-xs text-slate-200 rounded-md hover:text-white transition">
            Back to Documents
          </Link>
          {doc && (
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-md transition font-semibold"
            >
              Trigger AI Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  // Handle case where document exists but analysis has not been run
  if (!analysis) {
    return (
      <div className="p-12 border border-slate-855 bg-slate-900 rounded-xl text-center space-y-5">
        <span className="text-5xl block">🤖</span>
        <h3 className="text-xl font-bold text-slate-200 font-display">Analysis Not Found</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          An AI analysis report has not been generated for "{doc.original_filename}" yet.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/documents" className="px-4 py-2 bg-slate-850 border border-slate-800 text-xs text-slate-200 rounded-md hover:text-white transition">
            Back to Repository
          </Link>
          <button
            onClick={() => analyzeMutation.mutate(doc.id)}
            disabled={analyzeMutation.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-md transition font-semibold disabled:opacity-50"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Run AI Legal Audit'}
          </button>
        </div>
      </div>
    );
  }

  // Calculate Breakdown counts
  const criticalCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'CRITICAL').length;
  const highCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'HIGH').length;
  const mediumCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'MEDIUM').length;
  const lowCount = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'LOW').length;

  const detectedRisks = analysis.items.filter((i) => i.risk_level.toUpperCase() !== 'LOW');
  const safePoints = analysis.items.filter((i) => i.risk_level.toUpperCase() === 'LOW');

  const riskDetails = getRiskDetails(analysis.overall_risk_score);

  return (
    <div className="space-y-8 relative select-text print:bg-white print:text-black print:p-8 print:space-y-6">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-green-950 border border-green-800 text-sm text-green-300 shadow-lg animate-bounce print:hidden">
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-red-950 border border-red-800 text-sm text-red-300 shadow-lg print:hidden">
          {errorToast}
        </div>
      )}

      {/* Re-analysis Loading Screen Overlay */}
      {analyzeMutation.isPending && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 print:hidden">
          <style>{`
            @keyframes progress-indeterminate {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
            .animate-progress-indeterminate {
              animation: progress-indeterminate 2s infinite ease-in-out;
              width: 50%;
            }
          `}</style>
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500/20 border-b-emerald-500/20 border-l-emerald-500/20 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-b-green-400 border-t-green-400/20 border-r-green-400/20 border-l-green-400/20 animate-spin" style={{ animationDirection: 'reverse' }} />
              <span className="text-3xl">⚖️</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-100 font-display">AI Re-analysis in Progress</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Updating clause evaluations, verifying revisions, and re-scoring overall document risk indicators...
              </p>
            </div>
            <div className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Auditing Engine Status</span>
                <span className="text-emerald-400 font-semibold animate-pulse">RE-RUNNING</span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-1 overflow-hidden relative">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-1 rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/documents" className="hover:text-slate-300">Documents</Link>
            <span>/</span>
            <Link to={`/documents/${doc.id}`} className="hover:text-slate-300">Details</Link>
            <span>/</span>
            <span className="text-slate-400">Results Report</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-display truncate max-w-xl">
            Audit Report: {doc.original_filename}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/documents/${doc.id}`}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition"
          >
            ← View Extracted Text
          </Link>
        </div>
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Risk Gauge & Audit Parameters */}
        <div className="lg:col-span-1 space-y-6 print:col-span-3">
          
          {/* Circular Risk Score card */}
          <section className={`p-6 rounded-xl border flex flex-col items-center text-center space-y-4 ${riskDetails.bgClass} ${riskDetails.borderClass}`}>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-display">Document Risk Rating</h3>
            
            <CircularProgress score={analysis.overall_risk_score} />
            
            <div className="space-y-1">
              <h4 className={`text-xl font-bold font-display uppercase ${riskDetails.colorClass}`}>
                {riskDetails.label}
              </h4>
              <p className="text-[11px] text-slate-450 leading-relaxed max-w-[220px] mx-auto">
                {riskDetails.description}
              </p>
            </div>

            {/* Risk scale meter line representation */}
            <div className="w-full pt-2">
              <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase pb-1">
                <span>Safe</span>
                <span>Moderate</span>
                <span>Critical</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900/60 relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${riskDetails.bgProgress}`}
                  style={{ width: `${analysis.overall_risk_score}%` }}
                />
              </div>
            </div>
          </section>

          {/* Counts Breakdown section */}
          <section className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">Risk Levels Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Critical counts card */}
              <div className="p-3 bg-red-950/20 border border-red-950 rounded-lg text-center">
                <span className="text-xl font-extrabold text-red-400 block">{criticalCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Critical</span>
              </div>
              {/* High counts card */}
              <div className="p-3 bg-orange-950/20 border border-orange-950 rounded-lg text-center">
                <span className="text-xl font-extrabold text-orange-400 block">{highCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">High</span>
              </div>
              {/* Medium counts card */}
              <div className="p-3 bg-yellow-950/20 border border-yellow-950 rounded-lg text-center">
                <span className="text-xl font-extrabold text-yellow-400 block">{mediumCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Moderate</span>
              </div>
              {/* Low counts card */}
              <div className="p-3 bg-green-950/20 border border-green-950 rounded-lg text-center">
                <span className="text-xl font-extrabold text-green-400 block">{lowCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Low Risk</span>
              </div>
            </div>
          </section>

          {/* Audit parameters metadata */}
          <section className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">Audit Metadata</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Source Type:</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  {doc.source_type === 'URL' && '🌐 URL'}
                  {doc.source_type === 'TEXT' && '📝 TEXT'}
                  {(doc.source_type === 'PDF' || !doc.source_type) && '📄 PDF'}
                </span>
              </div>
              {doc.source_type === 'URL' && doc.source_url && (
                <div className="border-b border-slate-850 pb-1.5 space-y-1">
                  <span className="block text-slate-500">Source URL:</span>
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] text-green-400 hover:text-green-300 hover:underline break-all font-mono"
                  >
                    {doc.source_url}
                  </a>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>AI Confidence Score:</span>
                <span className="text-emerald-450 font-bold">
                  {analysis.confidence_score 
                    ? (analysis.confidence_score <= 1 
                      ? `${(analysis.confidence_score * 100).toFixed(0)}%` 
                      : `${analysis.confidence_score}%`)
                    : '95%'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>AI Engine Model:</span>
                <span className="text-slate-200 font-mono">{analysis.model_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Service Provider:</span>
                <span className="text-slate-200 font-semibold uppercase">{analysis.provider}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Processing Time:</span>
                <span className="text-emerald-400 font-bold">{analysis.processing_time}s</span>
              </div>
              <div className="flex justify-between">
                <span>Generated On:</span>
                <span className="text-slate-200">{formatDate(analysis.created_at)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Summaries, Key recommendations, Action buttons, Flagged clauses list */}
        <div className="lg:col-span-2 space-y-6 print:col-span-3">
          
          {/* Action triggers grid */}
          <section className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-medium transition flex items-center gap-1.5"
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-medium transition flex items-center gap-1.5"
            >
              📥 Download JSON
            </button>
            <button
              onClick={handleDownloadTxtReport}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-medium transition flex items-center gap-1.5"
            >
              📝 Text Report
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-medium transition flex items-center gap-1.5"
            >
              🖨️ Print Report
            </button>
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              disabled={analyzeMutation.isPending}
              className="px-3 py-1.5 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 hover:text-emerald-300 rounded text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              🔄 Re-analyze
            </button>
          </section>

          {/* Overall Summary Card */}
          <section className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
              <span>📋</span> Executive Summary
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {analysis.summary}
            </p>
          </section>

          {/* Overall AI Explanation Card */}
          {analysis.ai_explanation && (
            <section className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
                <span>🤖</span> AI Auditor Assessment
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-line">
                {analysis.ai_explanation}
              </p>
            </section>
          )}

          {/* Key Recommendations Panel */}
          <section className="p-6 rounded-xl border border-emerald-900/20 bg-emerald-950/5 space-y-3">
            <h3 className="text-base font-bold text-emerald-400 font-display flex items-center gap-2">
              <span>💡</span> Key Recommendations
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {analysis.recommendations}
            </p>
          </section>

          {/* Missing Critical Clauses Card */}
          <section className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
              <span>⚠️</span> Missing Protective Clauses ({analysis.missing_clauses?.length || 0})
            </h3>
            {!analysis.missing_clauses || analysis.missing_clauses.length === 0 ? (
              <div className="p-4 rounded-lg bg-green-950/20 border border-green-900/20 text-xs text-green-400">
                ✓ No standard protective clauses were found missing. The terms are structurally complete.
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.missing_clauses.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-850 space-y-2">
                    <h4 className="font-semibold text-slate-200 text-sm font-display">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Detected Clauses List */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-200 font-display flex items-center gap-2">
                <span>🛡️</span> Flagged Risk Clauses ({detectedRisks.length})
              </h3>
              {detectedRisks.length > 0 && (
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => setAllExpanded(true)}
                    className="text-[10px] text-slate-400 hover:text-white transition font-medium"
                  >
                    [Expand All]
                  </button>
                  <button
                    onClick={() => setAllExpanded(false)}
                    className="text-[10px] text-slate-400 hover:text-white transition font-medium"
                  >
                    [Collapse All]
                  </button>
                </div>
              )}
            </div>

            {detectedRisks.length === 0 ? (
              <div className="p-8 border border-slate-850 bg-slate-950 rounded-lg text-center text-slate-500">
                🎉 No medium, high, or critical risks flagged in this document!
              </div>
            ) : (
              <div className="space-y-3">
                {detectedRisks.map((item) => {
                  const isExpanded = expandedClauses[item.id] ?? false;
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-3 transition-all duration-200 hover:border-slate-700"
                    >
                      {/* Title block */}
                      <div
                        onClick={() => toggleExpand(item.id)}
                        className="flex justify-between items-start gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getRiskBadgeColor(item.risk_level)}`}>
                              {item.risk_level}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 font-display">
                            {item.title}
                          </h4>
                        </div>
                        <button className="text-slate-500 hover:text-white text-xs font-semibold focus:outline-none print:hidden">
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      </div>

                      {/* Expanded Section Details */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-850 space-y-3 text-xs animate-fade-in">
                          {/* AI Explanation */}
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">AI Evaluation</h5>
                            <p className="text-slate-300 leading-relaxed">{item.explanation}</p>
                          </div>

                          {/* Original Text Block Quote */}
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Original Text Quote</h5>
                            <div className={getClauseHighlightStyles(item.risk_level)}>
                              "{item.original_text}"
                            </div>
                          </div>

                          {/* Recommendation Suggestion */}
                          <div className="space-y-1 p-2.5 rounded bg-emerald-950/10 border border-emerald-900/10">
                            <h5 className="font-bold text-emerald-400 uppercase text-[9px] tracking-wider">Suggested Actions</h5>
                            <p className="text-slate-300 leading-relaxed font-sans">{item.suggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Safe Points */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-200 font-display flex items-center gap-2">
              <span>🎉</span> Safe Points ({safePoints.length})
            </h3>
            {safePoints.length === 0 ? (
              <div className="p-6 border border-slate-850 bg-slate-950/40 rounded-lg text-center text-slate-650 text-xs">
                No explicitly safe legal covenants or data exclusions identified.
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-green-900/20 bg-green-950/5 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  The following provisions represent standard user protections or parameters deemed safe by the auditing engine:
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300 list-none pl-0">
                  {safePoints.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5">
                      <span className="text-green-500 font-extrabold mt-0.5">✓</span>
                      <div>
                        <strong className="text-slate-200 font-semibold">{item.title}</strong>
                        <span className="text-slate-500 mx-1.5">|</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{item.category}</span>
                        <p className="text-[11px] text-slate-450 mt-0.5 leading-relaxed">{item.explanation}</p>
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
