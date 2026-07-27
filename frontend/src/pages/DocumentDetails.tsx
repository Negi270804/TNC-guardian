import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document, Analysis } from '@/types';
import { formatDate, formatBytes } from '@/utils';
import { API_ROUTES } from '@/config/api-routes';

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
      const response = await apiClient.get<Document>(API_ROUTES.DOCUMENTS.BY_ID(id!));
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch full analysis details
  const { data: analysis, isLoading: isAnalysisLoading } = useQuery<Analysis>({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await apiClient.get<Analysis>(API_ROUTES.ANALYSIS.BY_ID(id!));
      return response.data;
    },
    enabled: !!id && doc?.processing_status === 'COMPLETED' && !!doc?.analysis,
    retry: false,
  });

  // Analyze Mutation
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
    if (score <= 30) return { text: 'text-success', bg: 'bg-green-50/50', border: 'border-green-200', bgProgress: 'bg-success', label: 'Low Risk' };
    if (score <= 60) return { text: 'text-warning', bg: 'bg-amber-50/50', border: 'border-amber-200', bgProgress: 'bg-warning', label: 'Medium Risk' };
    return { text: 'text-danger', bg: 'bg-red-50/50', border: 'border-red-200', bgProgress: 'bg-danger', label: 'High Risk' };
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
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-64 bg-slate-100 rounded-2xl" />
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-8 border border-slate-200 bg-white rounded-2xl text-center space-y-4 shadow-soft">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-lg font-bold text-slate-800">Failed to load document</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">The file could not be retrieved. Ensure it is owned by your account.</p>
        <Link to="/documents" className="btn-secondary py-2 px-4 text-xs font-semibold">
          Return to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative fade-in">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-green-200 text-sm font-semibold text-green-700 shadow-xl">
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-700 shadow-xl">
          {errorToast}
        </div>
      )}

      {/* AI Analysis Loading Screen Overlay */}
      {analyzeMutation.isPending && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
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
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500/20 border-b-brand-500/20 border-l-brand-500/20 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-b-brand-400 border-t-brand-400/20 border-r-brand-400/20 border-l-brand-400/20 animate-spin" style={{ animationDirection: 'reverse' }} />
              <span className="text-3xl">⚖️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">AI Legal Audit in Progress</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Analyzing clauses, identifying liability limits, checking hidden fees and auto-renewal constraints...
              </p>
            </div>

            <div className="w-full bg-[#F8FAFC] border border-slate-200/60 rounded-xl p-4.5 space-y-2.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Auditing Engine Status</span>
                <span className="text-brand-600 font-extrabold animate-pulse">ACTIVE</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden relative border border-slate-200/10">
                <div className="bg-brand-500 h-full rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header and navigation breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <Link to="/documents" className="hover:text-slate-655">Documents</Link>
            <span>/</span>
            <span className="text-slate-600 font-bold">Details</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display truncate max-w-xl">
            {doc.original_filename}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc.analysis && (
            <Link
              to={`/results/${doc.id}`}
              className="btn-primary py-2 px-4 text-xs shadow-md"
            >
              📊 Results Dashboard
            </Link>
          )}
          <Link
            to="/documents"
            className="btn-secondary py-2 px-4 text-xs font-bold"
          >
            ← Back to Repository
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: metadata cards */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">File Details</h3>
            
            <div className="space-y-3 text-xs text-slate-500 font-semibold">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>File Format:</span>
                <span className="uppercase text-slate-800 font-bold">{doc.file_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>File Size:</span>
                <span className="text-slate-800 font-bold">{formatBytes(doc.file_size)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Uploaded Date:</span>
                <span className="text-slate-800 font-bold">{formatDate(doc.created_at)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>OCR Status:</span>
                <span className="font-extrabold uppercase">
                  {doc.processing_status === 'COMPLETED' && <span className="text-success">Extracted</span>}
                  {doc.processing_status === 'PROCESSING' && <span className="text-warning animate-pulse">Extracting text...</span>}
                  {doc.processing_status === 'FAILED' && <span className="text-danger">Text Extraction Failed</span>}
                  {doc.processing_status === 'UPLOADED' && <span className="text-slate-400">Not Extracted</span>}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Analysis Status:</span>
                <span className="font-extrabold uppercase">
                  {doc.analysis ? (
                    <span className="text-success">Analyzed</span>
                  ) : (
                    <span className="text-slate-400">Not Analyzed</span>
                  )}
                </span>
              </div>
              {doc.analysis && (
                <>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span>Overall Risk Score:</span>
                    <span className={`font-extrabold ${getRiskColor(doc.analysis.overall_risk_score).text}`}>
                      {doc.analysis.overall_risk_score}/100
                    </span>
                  </div>
                  {analysis && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span>Flagged Clauses:</span>
                      <span className="text-slate-800 font-bold">{analysis.items?.length || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span>Analysis Time:</span>
                    <span className="text-slate-800 font-bold">{doc.analysis.processing_time || analysis?.processing_time}s</span>
                  </div>
                </>
              )}
              {doc.page_count !== null && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span>Page Count:</span>
                  <span className="text-slate-800 font-bold">{doc.page_count}</span>
                </div>
              )}
              {doc.word_count !== null && (
                <div className="flex justify-between py-2">
                  <span>Word Count:</span>
                  <span className="text-slate-800 font-bold">{doc.word_count}</span>
                </div>
              )}
            </div>
          </section>

          {doc.processing_status === 'COMPLETED' && (
            <button
              onClick={() => analyzeMutation.mutate(doc.id)}
              disabled={analyzeMutation.isPending}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                doc.analysis
                  ? 'btn-secondary'
                  : 'btn-primary'
              }`}
            >
              ⚖️ {doc.analysis ? 'Re-run AI Analysis' : 'Run AI Legal Audit'}
            </button>
          )}

          {/* Quick instructions panel */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200/60 space-y-2 shadow-soft">
            <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider font-display">Text Extraction Engine</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              This system extracts plain-text layouts from documents using selective stream parses, falling back to EasyOCR neural image processing when text characters are unselectable.
            </p>
          </section>
        </div>

        {/* Right column: Extracted text & AI Audit Report tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 space-x-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-white border-slate-200 text-slate-900 border-b-transparent shadow-sm'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              <span>📝</span> Extracted Text
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-white border-slate-200 text-slate-900 border-b-transparent shadow-sm'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              <span>🛡️</span> AI Audit Report {doc.analysis && `(${doc.analysis.overall_risk_score}/100)`}
            </button>
          </div>

          {activeTab === 'text' ? (
            <section className="p-6 rounded-2xl bg-white border border-slate-200/60 flex flex-col h-[560px] space-y-4 shadow-soft">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 font-display">Extracted Text Content</h3>
                
                {doc.text_extracted && doc.extracted_text && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="btn-outline py-1.5 px-3 text-xs shadow-sm"
                    >
                      {copied ? '✓ Copied' : '📋 Copy Text'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="btn-outline py-1.5 px-3 text-xs shadow-sm"
                    >
                      📥 Download Text
                    </button>
                  </div>
                )}
              </div>

              {/* Viewer text box */}
              <div className="flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 overflow-y-auto text-sm text-slate-700 font-mono leading-relaxed select-text shadow-inner">
                {!doc.text_extracted ? (
                  /* Text not extracted state */
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-3xl">🔍</span>
                    <h4 className="font-bold text-slate-850 text-sm">Text has not been extracted yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                      Trigger the OCR extraction engine using the "Extract Text" command on the main documents directory.
                    </p>
                    <Link to="/documents" className="btn-primary py-2 px-4 text-xs font-semibold">
                      Go to Documents
                    </Link>
                  </div>
                ) : !doc.extracted_text || doc.extracted_text.trim() === '' ? (
                  /* Empty text returned */
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-1 font-semibold">
                    <span className="text-2xl">📝</span>
                    <p className="text-xs">No text content discovered</p>
                    <p className="text-[10px] text-slate-400 font-normal">The file was processed but yielded no character outputs.</p>
                  </div>
                ) : (
                  /* Extracted text scroll container */
                  <pre className="whitespace-pre-wrap font-sans font-medium text-slate-700">{doc.extracted_text}</pre>
                )}
              </div>
            </section>
          ) : (
            <section className="p-6 rounded-2xl bg-white border border-slate-200/60 flex flex-col h-[560px] space-y-4 shadow-soft">
              {!doc.analysis ? (
                /* Not analyzed state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-4xl">🤖</span>
                  <h4 className="font-bold text-slate-850 text-sm">AI Risk Audit has not been run yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                    Analyze the terms and conditions text to identify privacy issues, auto-renewals, cancellation policies, hidden fees, and payment risks.
                  </p>
                  <button
                    onClick={() => analyzeMutation.mutate(doc.id)}
                    disabled={analyzeMutation.isPending}
                    className="btn-primary py-2 px-4 text-xs font-semibold"
                  >
                    Run AI Analysis
                  </button>
                </div>
              ) : isAnalysisLoading ? (
                /* Loading details state */
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Loading audit report details...</span>
                </div>
              ) : !analysis ? (
                /* Error state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-3xl">⚠️</span>
                  <h4 className="font-bold text-slate-850 text-sm">Failed to retrieve analysis details</h4>
                  <p className="text-xs text-slate-500 font-semibold">We couldn't fetch the detailed risk audit report from the database.</p>
                  <button
                    onClick={() => analyzeMutation.mutate(doc.id)}
                    className="btn-primary py-2 px-4 text-xs font-semibold"
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
                        <div className={`p-4 rounded-xl border ${rc.bg} ${rc.border} flex flex-col justify-between shadow-sm`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Risk Score</span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${rc.text} bg-white ${rc.border}`}>
                              {rc.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-3">
                            <span className="text-4xl font-extrabold text-slate-900 font-display">{analysis.overall_risk_score}</span>
                            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                          </div>
                          {/* Progress indicator bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200/20">
                            <div className={`${rc.bgProgress} h-full rounded-full`} style={{ width: `${analysis.overall_risk_score}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Audit Metadata details */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between shadow-sm font-semibold text-slate-500">
                      <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Audit Details</span>
                      
                      <div className="space-y-1.5 mt-3 text-xs">
                        <div className="flex justify-between">
                          <span>Service Provider:</span>
                          <span className="text-slate-800 font-bold uppercase">{analysis.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Engine Model:</span>
                          <span className="text-slate-800 font-mono">{analysis.model_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Analysis Speed:</span>
                          <span className="text-brand-600 font-bold">{analysis.processing_time}s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary Section */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC]/50 space-y-2">
                    <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <span>📝</span> Executive Summary
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line font-medium">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Recommendations Section */}
                  <div className="p-5 rounded-xl border border-brand-100 bg-brand-50 space-y-2 text-brand-900 font-medium">
                    <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <span>💡</span> Key Recommendations
                    </h4>
                    <p className="text-xs leading-relaxed font-sans whitespace-pre-line">
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
