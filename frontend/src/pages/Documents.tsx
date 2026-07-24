import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.bmp'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/x-ms-bmp'
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Tab controls and new inputs
  const [activeTab, setActiveTab] = useState<'pdf' | 'url' | 'text'>('pdf');
  const [url, setUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [urlLoadingStep, setUrlLoadingStep] = useState<'extracting' | 'analyzing' | null>(null);
  const [urlAnalysisError, setUrlAnalysisError] = useState<{
    errorType: string;
    reason: string;
    suggestions: string[];
  } | null>(null);

  // Fetch document lists
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await apiClient.get<Document[]>('/documents');
      return response.data;
    },
  });

  // Upload Mutation
  const uploadMutation = useMutation<Document, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(1);
      const response = await apiClient.post<Document>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      });
      return response.data;
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      setSuccessToast(`"${newDoc.original_filename}" uploaded successfully!`);
      setUploadProgress(null);
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to upload document.';
      setErrorToast(msg);
      setUploadProgress(null);
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  // Extract Text Mutation
  const extractMutation = useMutation<Document, Error, string>({
    mutationFn: async (docId: string) => {
      // Set custom timeout of 120 seconds for text extraction to prevent premature client-side aborts
      const response = await apiClient.post<Document>(`/documents/${docId}/extract`, {}, { timeout: 120000 });
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['documents'] });
    },
    onSuccess: (updatedDoc) => {
      // Update cache immediately to prevent out-of-order state updates
      queryClient.setQueryData<Document[]>(['documents'], (old) => {
        if (!old) return [updatedDoc];
        return old.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast(`Extracted text from "${updatedDoc.original_filename}" successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      const msg = err.response?.data?.detail || 'Text extraction engine failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  // Analyze PDF Mutation (Existing Flow)
  const analyzeMutation = useMutation<any, Error, string>({
    mutationFn: async (docId: string) => {
      const response = await apiClient.post<any>(`/analysis/${docId}`);
      return response.data;
    },
    onSuccess: (newAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      setSuccessToast(`AI risk audit completed! Risk score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'AI Analysis engine failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  // Analyze URL Mutation
  const analyzeUrlMutation = useMutation<any, Error, string>({
    mutationFn: async (targetUrl: string) => {
      const response = await apiClient.post<any>('/analysis/url', { url: targetUrl });
      return response.data;
    },
    onSuccess: (newAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      setSuccessToast(`AI risk audit completed! Risk score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
      navigate(`/results/${newAnalysis.document_id}`);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      let errorType = "CRAWL_FAILED";
      let reason = "An unexpected error occurred during URL extraction.";
      let suggestions = [
        "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
        "Upload the Terms & Conditions as a PDF for analysis."
      ];

      if (typeof detail === 'string' && detail.startsWith('{')) {
        try {
          const parsed = JSON.parse(detail);
          errorType = parsed.error_type || errorType;
          reason = parsed.reason || reason;
          suggestions = parsed.suggestions || suggestions;
        } catch (e) {
          reason = detail;
        }
      } else if (typeof detail === 'string') {
        reason = detail;
      }

      setUrlAnalysisError({
        errorType,
        reason,
        suggestions
      });
      
      const msg = reason || 'URL Analysis failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  // Analyze Text Mutation
  const analyzeTextMutation = useMutation<any, Error, string>({
    mutationFn: async (pastedText: string) => {
      const response = await apiClient.post<any>('/analysis/text', { text: pastedText });
      return response.data;
    },
    onSuccess: (newAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      setSuccessToast(`AI risk audit completed! Risk score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
      navigate(`/results/${newAnalysis.document_id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Text Analysis failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (docId: string) => {
      await apiClient.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSuccessToast('Document deleted successfully.');
      setSelectedDoc(null);
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to delete document.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    },
  });

  const validateAndUpload = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorToast(`Unsupported file extension '${ext}'. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP, BMP.`);
      setTimeout(() => setErrorToast(null), 5500);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorToast(`Unsupported file content type: ${file.type || 'unknown'}.`);
      setTimeout(() => setErrorToast(null), 5500);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorToast(`File too large (${formatBytes(file.size)}). Max allowed size is 20 MB.`);
      setTimeout(() => setErrorToast(null), 5500);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlAnalysisError(null);
    if (!url.trim()) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorToast("Invalid URL. Supported protocols: http:// or https://");
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    setUrlLoadingStep('extracting');
    const timer = setTimeout(() => {
      setUrlLoadingStep('analyzing');
    }, 2500);

    analyzeUrlMutation.mutate(url, {
      onSettled: () => {
        clearTimeout(timer);
        setUrlLoadingStep(null);
      }
    });
  };

  const handleTextSubmit = () => {
    if (textInput.length < 100) {
      setErrorToast("Text too short. Please enter at least 100 characters.");
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }
    analyzeTextMutation.mutate(textInput);
  };

  const isAnyAnalysisPending = analyzeMutation.isPending || analyzeUrlMutation.isPending || analyzeTextMutation.isPending;

  return (
    <div className="space-y-8 relative">
      {/* AI Analysis Loading Screen Overlay */}
      {isAnyAnalysisPending && (
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
              <h3 className="text-lg font-bold text-slate-100 font-display">
                {urlLoadingStep === 'extracting' ? 'Extracting Webpage...' : 'AI Legal Audit in Progress'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {urlLoadingStep === 'extracting'
                  ? 'Fetching webpage content, parsing HTML elements, and cleaning cookie consent templates...'
                  : 'Analyzing clauses, identifying liability limits, checking hidden fees and auto-renewal constraints...'}
              </p>
            </div>

            <div className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Auditing Engine Status</span>
                <span className="text-emerald-400 font-semibold animate-pulse">
                  {urlLoadingStep === 'extracting' ? 'EXTRACTING' : 'ANALYZING'}
                </span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-1 overflow-hidden relative">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-1 rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

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

      <div>
        <h2 className="text-2xl font-bold text-slate-100 font-display">AI Legal Auditor</h2>
        <p className="text-sm text-slate-400 mt-1">Select your source type and run immediate legalese analysis.</p>
      </div>

      {/* Tab Menu Header */}
      <div className="grid grid-cols-3 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-3 py-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'pdf'
              ? 'border-green-500 text-green-400 bg-green-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <span>📄</span>
          <span className="hidden sm:inline">PDF / Document</span>
          <span className="sm:hidden">PDF</span>
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`px-3 py-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'url'
              ? 'border-green-500 text-green-400 bg-green-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <span>🌐</span>
          <span className="hidden sm:inline">URL Link</span>
          <span className="sm:hidden">URL</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-3 py-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'text'
              ? 'border-green-500 text-green-400 bg-green-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <span>📝</span>
          <span className="hidden sm:inline">Direct Text</span>
          <span className="sm:hidden">Text</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      {activeTab === 'pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 font-display">Upload Document</h3>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerBrowse}
                className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 min-h-[220px] ${
                  dragActive
                    ? 'border-green-500 bg-green-950/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileChange}
                  disabled={uploadMutation.isPending}
                />
                <span className="text-4xl text-slate-500">📁</span>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Drag & drop files here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse local files</p>
                </div>
                <p className="text-[10px] text-slate-600">
                  PDF, DOCX, TXT, PNG, JPG, JPEG (Max: 20MB)
                </p>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-2 p-3 bg-slate-950 border border-slate-850 rounded">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Uploading file...</span>
                    <span className="text-green-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uploads List Table */}
          <div className="lg:col-span-2">
            <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 font-display">Recent Uploads</h3>

              {isLoading ? (
                <div className="space-y-3 py-6">
                  <div className="h-10 bg-slate-800/50 rounded animate-pulse" />
                  <div className="h-10 bg-slate-800/50 rounded animate-pulse" />
                  <div className="h-10 bg-slate-800/50 rounded animate-pulse" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-16 border border-slate-850 bg-slate-950 rounded-lg text-center space-y-3">
                  <span className="text-4xl block">📂</span>
                  <h4 className="font-semibold text-slate-300 text-sm">No files uploaded yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Drag and drop a legal document in the upload area to save its metadata configurations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
                        <th className="p-3">File Name</th>
                        <th className="p-3 hidden md:table-cell">Type</th>
                        <th className="p-3 hidden sm:table-cell">Size</th>
                        <th className="p-3 hidden lg:table-cell">Upload Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {documents.map((doc) => {
                        const isProcessing = extractMutation.isPending && extractMutation.variables === doc.id;
                        
                        return (
                          <tr key={doc.id} className="hover:bg-slate-900/40 text-slate-300 transition">
                            <td className="p-3 font-medium text-slate-100 max-w-[120px] sm:max-w-[180px] truncate">
                              {doc.original_filename}
                            </td>
                            <td className="p-3 text-xs uppercase text-slate-500 hidden md:table-cell">{doc.file_type}</td>
                            <td className="p-3 text-xs text-slate-400 hidden sm:table-cell">{formatBytes(doc.file_size)}</td>
                            <td className="p-3 text-xs text-slate-400 hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                            <td className="p-3">
                              {doc.processing_status === 'COMPLETED' ? (
                                doc.analysis ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    doc.analysis.overall_risk_score <= 30
                                      ? 'bg-green-950/60 text-green-400 border-green-800/40'
                                      : doc.analysis.overall_risk_score <= 60
                                      ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40'
                                      : 'bg-red-950/60 text-red-400 border-red-800/40'
                                  }`}>
                                    Risk: {doc.analysis.overall_risk_score}/100
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-950/40 text-emerald-400 border-emerald-800/20">
                                    Ready to Analyze
                                  </span>
                                )
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  doc.processing_status === 'PROCESSING' || isProcessing
                                    ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40 animate-pulse'
                                    : doc.processing_status === 'FAILED'
                                    ? 'bg-red-950/60 text-red-400 border-red-800/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800'
                                }`}>
                                  {isProcessing || doc.processing_status === 'PROCESSING'
                                    ? 'Extracting text...'
                                    : doc.processing_status === 'FAILED'
                                    ? 'Text Extraction Failed'
                                    : doc.processing_status}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {(doc.processing_status === 'UPLOADED' || doc.processing_status === 'FAILED') && (
                                <button
                                  onClick={() => {
                                    if (doc.processing_status !== 'PROCESSING' && !isProcessing) {
                                      extractMutation.mutate(doc.id);
                                    }
                                  }}
                                  disabled={extractMutation.isPending || isProcessing || doc.processing_status === 'PROCESSING'}
                                  className="text-xs text-green-400 hover:text-green-300 px-2 py-1 bg-green-950/20 hover:bg-green-950/40 border border-green-900/20 rounded transition disabled:opacity-50"
                                >
                                  {isProcessing || doc.processing_status === 'PROCESSING' ? 'Processing...' : 'Extract'}
                                </button>
                              )}

                              {doc.processing_status === 'COMPLETED' && (
                                <button
                                  onClick={() => analyzeMutation.mutate(doc.id)}
                                  disabled={analyzeMutation.isPending}
                                  className={`text-xs px-2 py-1 rounded border transition disabled:opacity-50 ${
                                    doc.analysis
                                      ? 'text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-855 border-slate-800'
                                      : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-900/20 font-medium animate-pulse'
                                  }`}
                                >
                                  {doc.analysis ? 'Re-analyze' : 'Analyze'}
                                </button>
                              )}

                              {doc.analysis && (
                                <Link
                                  to={`/results/${doc.id}`}
                                  className="inline-block text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-950/20 rounded border border-emerald-900/20 transition font-semibold"
                                >
                                  Results
                                </Link>
                              )}

                              <Link
                                  to={`/documents/${doc.id}`}
                                  className="inline-block text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded border border-slate-800 transition"
                              >
                                Details
                              </Link>
                              
                              <button
                                onClick={() => deleteMutation.mutate(doc.id)}
                                disabled={deleteMutation.isPending || isProcessing || analyzeMutation.isPending}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/20 hover:bg-red-950/40 rounded border border-red-900/20 transition disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 font-display">Analyze Terms & Conditions from URL</h3>
            <p className="text-xs text-slate-450 mt-1">
              Provide the direct address of the T&C page. TNC Guardian will scrape the page, remove cookie banners/newsletters, bypass boilerplate scripts, and feed clean legal blocks to the AI analyzer.
            </p>
          </div>

          {urlAnalysisError ? (
            <div className="p-6 rounded-lg bg-red-950/20 border border-red-900/40 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <h4 className="text-base font-bold text-red-400 font-display">URL Analysis Failed</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    Failure Type: <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-red-300 font-semibold border border-red-900/10">{urlAnalysisError.errorType}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-lg text-xs leading-relaxed text-slate-300">
                <strong className="text-slate-200">Reason:</strong> {urlAnalysisError.reason}
              </div>

              {urlAnalysisError.suggestions && urlAnalysisError.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Recovery Actions:</h5>
                  <ul className="list-none space-y-1.5 pl-0">
                    {urlAnalysisError.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-350">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Action buttons */}
              <div className="pt-4 border-t border-slate-800/45 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('pdf');
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  📄 Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('text');
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  📝 Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('pdf');
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  🖼 Upload Image (OCR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setUrl('');
                  }}
                  className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-xs font-semibold text-green-400 hover:text-green-300 rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  🔗 Try Another URL
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Terms & Conditions URL
                </label>
                <input
                  type="text"
                  placeholder="https://openai.com/policies/terms-of-use/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-700 transition"
                  disabled={analyzeUrlMutation.isPending}
                />
                <span className="text-[11px] text-slate-500 block">
                  Example URL: <span className="italic text-slate-450">https://openai.com/policies/terms-of-use/</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={analyzeUrlMutation.isPending || !url.trim()}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-green-950/20 transition flex items-center gap-2"
              >
                {analyzeUrlMutation.isPending ? 'Extracting Webpage...' : 'Analyze URL'}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'text' && (
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 font-display">Analyze Direct Text Input</h3>
            <p className="text-xs text-slate-455 mt-1">
              Copy and paste terms agreement document chunks directly below to process AI diagnostics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Terms & Conditions Text
              </label>
              <textarea
                placeholder="Paste Terms & Conditions here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={12}
                maxLength={150000}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-700 transition resize-y font-sans leading-relaxed"
                disabled={analyzeTextMutation.isPending}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Minimum 100 characters required.</span>
                <span className={textInput.length < 100 || textInput.length > 150000 ? 'text-yellow-500' : 'text-slate-400'}>
                  {textInput.length.toLocaleString()} / 150,000 characters
                </span>
              </div>
            </div>

            <button
              onClick={handleTextSubmit}
              disabled={analyzeTextMutation.isPending || textInput.length < 100 || textInput.length > 150000}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-green-950/20 transition"
            >
              {analyzeTextMutation.isPending ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        </div>
      )}

      {/* Details View Dialog Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Document Metadata</h3>
                <p className="text-xs text-slate-500 mt-1">UUID reference and backend storage configurations.</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white font-semibold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300 bg-slate-950 p-4 rounded border border-slate-850">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Document ID:</span>
                <span className="font-mono text-xs">{selectedDoc.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Original Name:</span>
                <span className="max-w-[240px] truncate">{selectedDoc.original_filename}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Source Type:</span>
                <span className="uppercase text-xs font-semibold text-green-400">{selectedDoc.source_type || 'PDF'}</span>
              </div>
              {selectedDoc.source_url && (
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Source URL:</span>
                  <span className="text-xs max-w-[240px] truncate underline text-slate-400" title={selectedDoc.source_url}>
                    {selectedDoc.source_url}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Stored Name:</span>
                <span className="font-mono text-xs max-w-[240px] truncate">{selectedDoc.stored_filename || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">File Type:</span>
                <span className="uppercase text-xs">{selectedDoc.file_type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">File Size:</span>
                <span>{formatBytes(selectedDoc.file_size)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Upload Date:</span>
                <span>{formatDate(selectedDoc.created_at)}</span>
              </div>
              {selectedDoc.storage_path && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Disk Storage Path:</span>
                  <span className="font-mono text-[10px] text-slate-400 max-w-[240px] truncate" title={selectedDoc.storage_path}>
                    {selectedDoc.storage_path}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-850 text-slate-300 hover:text-white rounded border border-slate-800 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedDoc.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-950/30 text-red-400 hover:text-red-300 rounded border border-red-900/30 text-xs font-semibold transition"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
