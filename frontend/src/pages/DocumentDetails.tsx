import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document, Analysis } from '@/types';
import { formatDate, formatBytes } from '@/utils';

export const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'analysis'>('text');

  // Fetch document details
  const { data: doc, isLoading, error } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await apiClient.get<Document>(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch full analysis details
  const { data: analysis, isLoading: isAnalysisLoading } = useQuery<Analysis>({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await apiClient.get<Analysis>(`/analysis/${id}`);
      return response.data;
    },
    enabled: !!id && doc?.processing_status === 'COMPLETED' && !!doc?.analysis,
    retry: false,
  });

  // Analyze Mutation
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
      setActiveTab('analysis');
      setSuccessToast(`AI Risk Audit completed! Risk Score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'AI analysis engine failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  const getRiskColor = (score: number) => {
    if (score <= 30) return { text: 'text-green-400', bg: 'bg-green-950/60', border: 'border-green-800/40', bgProgress: 'bg-green-500', label: 'Low Risk' };
    if (score <= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-950/60', border: 'border-yellow-800/40', bgProgress: 'bg-yellow-500', label: 'Medium Risk' };
    return { text: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-800/40', bgProgress: 'bg-red-500', label: 'High Risk' };
  };

  const handleCopy = async () => {
    if (doc?.extracted_text) {
      try {
        await navigator.clipboard.writeText(doc.extracted_text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text to clipboard:', err);
      }
    }
  };

  const handleDownload = () => {
    if (doc?.extracted_text) {
      const blob = new Blob([doc.extracted_text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.original_filename.split('.')[0]}_extracted.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-64 bg-slate-800 rounded" />
          <div className="lg:col-span-2 h-96 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-8 border border-slate-850 bg-slate-900 rounded-lg text-center space-y-4">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-lg font-semibold text-slate-200">Failed to load document</h3>
        <p className="text-sm text-slate-400">The file could not be retrieved. Ensure it is owned by your account.</p>
        <Link to="/documents" className="inline-block px-4 py-2 bg-slate-850 border border-slate-800 text-xs text-slate-200 rounded hover:text-white transition">
          Return to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
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

      {/* AI Analysis Loading Screen Overlay */}
      {analyzeMutation.isPending && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
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
              <h3 className="text-lg font-bold text-slate-100 font-display">AI Legal Audit in Progress</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Analyzing clauses, identifying liability limits, checking hidden fees and auto-renewal constraints...
              </p>
            </div>

            <div className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Auditing Engine Status</span>
                <span className="text-emerald-400 font-semibold animate-pulse">ACTIVE</span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-1 overflow-hidden relative">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-1 rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header and navigation breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/documents" className="hover:text-slate-300">Documents</Link>
            <span>/</span>
            <span className="text-slate-400">Details</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-display truncate max-w-xl">
            {doc.original_filename}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc.analysis && (
            <Link
              to={`/results/${doc.id}`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition shadow-md"
            >
              📊 Results Dashboard
            </Link>
          )}
          <Link
            to="/documents"
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition"
          >
            ← Back to Repository
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: metadata cards */}
        <div className="lg:col-span-1 space-y-6">
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 font-display">File Details</h3>
            
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span>File Format:</span>
                <span className="uppercase text-slate-200 font-medium">{doc.file_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span>File Size:</span>
                <span className="text-slate-200 font-medium">{formatBytes(doc.file_size)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span>Uploaded Date:</span>
                <span className="text-slate-200 font-medium">{formatDate(doc.created_at)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span>OCR Status:</span>
                <span className="font-semibold uppercase">
                  {doc.processing_status === 'COMPLETED' && <span className="text-green-500">Extracted</span>}
                  {doc.processing_status === 'PROCESSING' && <span className="text-yellow-500">Extracting text...</span>}
                  {doc.processing_status === 'FAILED' && <span className="text-red-500">Text Extraction Failed</span>}
                  {doc.processing_status === 'UPLOADED' && <span className="text-slate-400">Not Extracted</span>}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span>Analysis Status:</span>
                <span className="font-semibold uppercase">
                  {doc.analysis ? (
                    <span className="text-green-500">Analyzed</span>
                  ) : (
                    <span className="text-slate-400">Not Analyzed</span>
                  )}
                </span>
              </div>
              {doc.analysis && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-850">
                    <span>Overall Risk Score:</span>
                    <span className={`font-bold ${getRiskColor(doc.analysis.overall_risk_score).text}`}>
                      {doc.analysis.overall_risk_score}/100
                    </span>
                  </div>
                  {analysis && (
                    <div className="flex justify-between py-1.5 border-b border-slate-850">
                      <span>Flagged Clauses:</span>
                      <span className="text-slate-200 font-medium">{analysis.items?.length || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-slate-850">
                    <span>Analysis Time:</span>
                    <span className="text-slate-200 font-medium">{doc.analysis.processing_time || analysis?.processing_time}s</span>
                  </div>
                </>
              )}
              {doc.page_count !== null && (
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span>Page Count:</span>
                  <span className="text-slate-200 font-medium">{doc.page_count}</span>
                </div>
              )}
              {doc.word_count !== null && (
                <div className="flex justify-between py-1.5">
                  <span>Word Count:</span>
                  <span className="text-slate-200 font-medium">{doc.word_count}</span>
                </div>
              )}
            </div>
          </section>

          {doc.processing_status === 'COMPLETED' && (
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              disabled={analyzeMutation.isPending}
              className={`w-full py-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                doc.analysis
                  ? 'bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-900 hover:text-white'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-555'
              }`}
            >
              ⚖️ {doc.analysis ? 'Re-run AI Analysis' : 'Run AI Legal Audit'}
            </button>
          )}

          {/* Quick instructions panel */}
          <section className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Text Extraction Engine</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This system extracts plain-text layouts from documents using selective stream parses, falling back to EasyOCR neural image processing when text characters are unselectable.
            </p>
          </section>
        </div>

        {/* Right column: Extracted text & AI Audit Report tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 space-x-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 Extracted Text
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all flex items-center gap-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ AI Audit Report {doc.analysis && `(${doc.analysis.overall_risk_score}/100)`}
            </button>
          </div>

          {activeTab === 'text' ? (
            <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 flex flex-col h-[560px] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200 font-display">Extracted Text Content</h3>
                
                {doc.text_extracted && doc.extracted_text && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 text-xs font-medium rounded text-slate-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      {copied ? '✓ Copied' : '📋 Copy Text'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 text-xs font-medium rounded text-slate-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      📥 Download Text
                    </button>
                  </div>
                )}
              </div>

              {/* Viewer text box */}
              <div className="flex-1 rounded border border-slate-850 bg-slate-950 p-4 overflow-y-auto text-sm text-slate-300 font-mono leading-relaxed select-text">
                {!doc.text_extracted ? (
                  /* Text not extracted state */
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-3xl">🔍</span>
                    <h4 className="font-semibold text-slate-300 text-sm">Text has not been extracted yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Trigger the OCR extraction engine using the "Extract Text" command on the main documents directory.
                    </p>
                    <Link to="/documents" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition">
                      Go to Documents
                    </Link>
                  </div>
                ) : !doc.extracted_text || doc.extracted_text.trim() === '' ? (
                  /* Empty text returned */
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
                    <span className="text-2xl">📝</span>
                    <p className="text-xs font-semibold">No text content discovered</p>
                    <p className="text-[10px]">The file was processed but yielded no character outputs.</p>
                  </div>
                ) : (
                  /* Extracted text scroll container */
                  <pre className="whitespace-pre-wrap font-sans">{doc.extracted_text}</pre>
                )}
              </div>
            </section>
          ) : (
            <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 flex flex-col h-[560px] space-y-4">
              {!doc.analysis ? (
                /* Not analyzed state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-4xl">🤖</span>
                  <h4 className="font-semibold text-slate-300 text-sm">AI Risk Audit has not been run yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Analyze the terms and conditions text to identify privacy issues, auto-renewals, cancellation policies, hidden fees, and payment risks.
                  </p>
                  <button
                    onClick={() => analyzeMutation.mutate(doc.id)}
                    disabled={analyzeMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                  >
                    Run AI Analysis
                  </button>
                </div>
              ) : isAnalysisLoading ? (
                /* Loading details state */
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Loading audit report details...</span>
                </div>
              ) : !analysis ? (
                /* Error state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-3xl">⚠️</span>
                  <h4 className="font-semibold text-slate-300 text-sm">Failed to retrieve analysis details</h4>
                  <p className="text-xs text-slate-500">We couldn't fetch the detailed risk audit report from the database.</p>
                  <button
                    onClick={() => analyzeMutation.mutate(doc.id)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 text-xs font-semibold transition"
                  >
                    Re-run Audit
                  </button>
                </div>
              ) : (
                /* Audit report main details view */
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Overall Risk Score */}
                    {(() => {
                      const rc = getRiskColor(analysis.overall_risk_score);
                      return (
                        <div className={`p-4 rounded-xl border ${rc.bg} ${rc.border} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Risk Score</span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${rc.text} bg-slate-950/80 border ${rc.border}`}>
                              {rc.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-3">
                            <span className="text-4xl font-extrabold text-slate-100 font-display">{analysis.overall_risk_score}</span>
                            <span className="text-xs text-slate-500">/ 100</span>
                          </div>
                          {/* Progress indicator bar */}
                          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-900">
                            <div className={`${rc.bgProgress} h-1.5 rounded-full`} style={{ width: `${analysis.overall_risk_score}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Audit Metadata details */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Details</span>
                      
                      <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Service Provider:</span>
                          <span className="text-slate-200 font-semibold uppercase">{analysis.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Engine Model:</span>
                          <span className="text-slate-200 font-mono">{analysis.model_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Analysis Speed:</span>
                          <span className="text-emerald-400 font-bold">{analysis.processing_time}s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary Section */}
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/20 space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <span>📝</span> Executive Summary
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Recommendations Section */}
                  <div className="p-5 rounded-xl border border-emerald-900/20 bg-emerald-950/5 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <span>💡</span> Key Recommendations
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {analysis.recommendations}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
