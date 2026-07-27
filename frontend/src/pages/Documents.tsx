import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { env } from '@/config/env';
import { API_ROUTES } from '@/config/api-routes';

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
  const [ocrDisabledInfo, setOcrDisabledInfo] = useState<any>(null);

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
      const response = await apiClient.get<Document[]>(API_ROUTES.DOCUMENTS.BASE);
      return response.data;
    },
  });

  // Upload Mutation
  const uploadMutation = useMutation<Document, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(1);
      const response = await apiClient.post<Document>(API_ROUTES.DOCUMENTS.UPLOAD, formData, {
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
      const response = await apiClient.post<Document>(API_ROUTES.DOCUMENTS.EXTRACT(docId), {}, { timeout: 120000 });
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['documents'] });
    },
    onSuccess: (updatedDoc: Document) => {
      // Update cache immediately to prevent out-of-order state updates
      queryClient.setQueryData<Document[]>(['documents'], (old: Document[] | undefined) => {
        if (!old) return [updatedDoc];
        return old.map((d: Document) => (d.id === updatedDoc.id ? updatedDoc : d));
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast(`Extracted text from "${updatedDoc.original_filename}" successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.feature === 'image_ocr') {
        setOcrDisabledInfo(detail);
      } else {
        const msg = typeof detail === 'string' ? detail : 'Text extraction engine failed.';
        setErrorToast(msg);
        setTimeout(() => setErrorToast(null), 4000);
      }
    },
  });

  // Analyze PDF Mutation (Existing Flow)
  const analyzeMutation = useMutation<any, Error, string>({
    mutationFn: async (docId: string) => {
      const response = await apiClient.post<any>(API_ROUTES.ANALYSIS.BY_ID(docId));
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
      const response = await apiClient.post<any>(API_ROUTES.ANALYSIS.URL, { url: targetUrl });
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
      const response = await apiClient.post<any>(API_ROUTES.ANALYSIS.TEXT, { text: pastedText });
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
      await apiClient.delete(API_ROUTES.DOCUMENTS.BY_ID(docId));
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
    <div className="space-y-8 relative fade-in">
      {/* AI Analysis Loading Screen Overlay */}
      {isAnyAnalysisPending && (
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
          <div className="w-full max-w-md bg-white border border-slate-200/85 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500/20 border-b-brand-500/20 border-l-brand-500/20 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-b-brand-400 border-t-brand-400/20 border-r-brand-400/20 border-l-brand-400/20 animate-spin" style={{ animationDirection: 'reverse' }} />
              <span className="text-3xl">⚖️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {urlLoadingStep === 'extracting' ? 'Extracting Webpage...' : 'AI Legal Audit in Progress'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {urlLoadingStep === 'extracting'
                  ? 'Fetching webpage content, parsing HTML elements, and cleaning cookie consent templates...'
                  : 'Analyzing clauses, identifying liability limits, checking hidden fees and auto-renewal constraints...'}
              </p>
            </div>

            <div className="w-full bg-[#F8FAFC] border border-slate-200/60 rounded-xl p-4.5 space-y-2.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Auditing Engine Status</span>
                <span className="text-brand-600 font-extrabold animate-pulse">
                  {urlLoadingStep === 'extracting' ? 'EXTRACTING' : 'ANALYZING'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden relative border border-slate-200/10">
                <div className="bg-brand-500 h-full rounded-full animate-progress-indeterminate absolute" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-green-200 text-sm font-semibold text-green-700 shadow-xl flex items-center gap-2">
          <span>✅</span>
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-700 shadow-xl flex items-center gap-2">
          <span>❌</span>
          {errorToast}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">AI Legal Auditor</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Select your source type and run immediate legalese analysis.</p>
      </div>

      {/* Tab Menu Header */}
      <div className="grid grid-cols-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-3 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'pdf'
              ? 'border-brand-500 text-brand-600 bg-brand-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <span>📄</span>
          <span className="hidden sm:inline">PDF / Document</span>
          <span className="sm:hidden">PDF</span>
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`px-3 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'url'
              ? 'border-brand-500 text-brand-600 bg-brand-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <span>🌐</span>
          <span className="hidden sm:inline">URL Link</span>
          <span className="sm:hidden">URL</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-3 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'text'
              ? 'border-brand-500 text-brand-600 bg-brand-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50'
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
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Upload Document</h3>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerBrowse}
                className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 min-h-[220px] ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50/50'
                    : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-350 hover:bg-slate-50/80'
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
                <span className="text-4xl text-slate-400">📁</span>
                <div>
                  <p className="text-sm font-bold text-slate-700">Drag & drop files here</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">or click to browse local files</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  PDF, DOCX, TXT, PNG, JPG, JPEG (Max: 20MB)
                </p>
              </div>

              {/* Supported/Optional Formats Info */}
              <div className="pt-4 border-t border-slate-100 space-y-3.5 text-left">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supported</span>
                  <ul className="list-none space-y-1.5 pl-0 text-xs text-slate-650 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-brand-500">✓</span>
                      <span>Text PDF</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-brand-500">✓</span>
                      <span>DOCX</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-brand-500">✓</span>
                      <span>TXT</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-brand-500">✓</span>
                      <span>URL Analysis</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optional</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-650 font-medium">
                      <span>🧪</span>
                      <span>Image OCR (PNG/JPG/JPEG)</span>
                    </div>
                    <span className="text-[10px] text-slate-450 block leading-tight font-normal">
                      Available only on supported deployments.
                    </span>
                  </div>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-2 p-3.5 bg-[#F8FAFC] border border-slate-200/60 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 font-semibold">Uploading file...</span>
                    <span className="text-brand-600 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uploads List Table */}
          <div className="lg:col-span-2">
            <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Recent Uploads</h3>

              {isLoading ? (
                <div className="space-y-3 py-6">
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-16 border border-slate-100 bg-[#F8FAFC] rounded-xl text-center space-y-3">
                  <span className="text-4xl block">📂</span>
                  <h4 className="font-semibold text-slate-700 text-sm">No files uploaded yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Drag and drop a legal document in the upload area to save its metadata configurations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="p-4">File Name</th>
                        <th className="p-4 hidden md:table-cell">Type</th>
                        <th className="p-4 hidden sm:table-cell">Size</th>
                        <th className="p-4 hidden lg:table-cell">Upload Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((doc) => {
                        const isProcessing = extractMutation.isPending && extractMutation.variables === doc.id;
                        
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/50 text-slate-600 transition duration-150">
                            <td className="p-4 font-semibold text-slate-800 max-w-[120px] sm:max-w-[180px] truncate" title={doc.original_filename}>
                              {doc.original_filename}
                            </td>
                            <td className="p-4 text-xs uppercase font-semibold text-slate-400 hidden md:table-cell">{doc.file_type}</td>
                            <td className="p-4 text-xs font-semibold text-slate-500 hidden sm:table-cell">{formatBytes(doc.file_size)}</td>
                            <td className="p-4 text-xs font-semibold text-slate-500 hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                            <td className="p-4">
                              {doc.processing_status === 'COMPLETED' ? (
                                doc.analysis ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    doc.analysis.overall_risk_score <= 30
                                      ? 'bg-green-50 text-success border-green-200'
                                      : doc.analysis.overall_risk_score <= 60
                                      ? 'bg-amber-50 text-warning border-amber-200'
                                      : 'bg-red-50 text-danger border-red-200'
                                  }`}>
                                    Risk: {doc.analysis.overall_risk_score}/100
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-brand-50 text-brand-600 border-brand-100 animate-pulse">
                                    Ready to Analyze
                                  </span>
                                )
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  doc.processing_status === 'PROCESSING' || isProcessing
                                    ? 'bg-amber-50 text-warning border-amber-200 animate-pulse'
                                    : doc.processing_status === 'FAILED'
                                    ? 'bg-red-50 text-danger border-red-200'
                                    : 'bg-slate-50 text-slate-550 border-slate-200'
                                }`}>
                                  {isProcessing || doc.processing_status === 'PROCESSING'
                                    ? 'Extracting text...'
                                    : doc.processing_status === 'FAILED'
                                    ? 'Text Extraction Failed'
                                    : doc.processing_status}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              {(doc.processing_status === 'UPLOADED' || doc.processing_status === 'FAILED') && (
                                <button
                                  onClick={() => {
                                    if (!isProcessing) {
                                      extractMutation.mutate(doc.id);
                                    }
                                  }}
                                  disabled={extractMutation.isPending || isProcessing}
                                  className="btn-outline py-1 px-2.5 text-[10px] font-bold border-brand-100 bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700"
                                >
                                  {isProcessing ? 'Processing...' : 'Extract'}
                                </button>
                              )}

                              {doc.processing_status === 'COMPLETED' && (
                                <button
                                  onClick={() => analyzeMutation.mutate(doc.id)}
                                  disabled={analyzeMutation.isPending}
                                  className={`btn-outline py-1 px-2.5 text-[10px] font-bold border transition ${
                                    doc.analysis
                                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                      : 'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 animate-pulse'
                                  }`}
                                >
                                  {doc.analysis ? 'Re-analyze' : 'Analyze'}
                                </button>
                              )}

                              {doc.analysis && (
                                <Link
                                  to={`/results/${doc.id}`}
                                  className="btn-outline inline-block py-1 px-2.5 text-[10px] font-bold border-brand-100 bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700"
                                >
                                  Results
                                </Link>
                              )}

                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="btn-secondary py-1 px-2.5 text-[10px] font-bold"
                              >
                                Details
                              </button>
                              
                              <button
                                onClick={() => deleteMutation.mutate(doc.id)}
                                disabled={deleteMutation.isPending || isProcessing || analyzeMutation.isPending}
                                className="btn-danger bg-red-50 text-danger border border-red-100 hover:bg-red-100 hover:text-red-700 py-1 px-2.5 text-[10px] font-bold"
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
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Analyze Terms & Conditions from URL</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Provide the direct address of the T&C page. {env.VITE_APP_NAME} will scrape the page, remove cookie banners/newsletters, bypass boilerplate scripts, and feed clean legal blocks to the AI analyzer.
            </p>
          </div>

          {urlAnalysisError ? (
            <div className="p-6 rounded-xl bg-red-50 border border-red-200 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <h4 className="text-base font-bold text-red-700 font-display">URL Analysis Failed</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Failure Type: <span className="font-mono bg-white px-1.5 py-0.5 rounded text-red-650 font-semibold border border-red-200">{urlAnalysisError.errorType}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-red-100 p-4 rounded-xl text-xs leading-relaxed text-red-700 font-medium">
                <strong className="text-red-800">Reason:</strong> {urlAnalysisError.reason}
              </div>

              {urlAnalysisError.suggestions && urlAnalysisError.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested Recovery Actions:</h5>
                  <ul className="list-none space-y-1.5 pl-0">
                    {urlAnalysisError.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-650 font-medium">
                        <span className="text-brand-500 font-bold">✓</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Action buttons */}
              <div className="pt-4 border-t border-red-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('pdf');
                  }}
                  className="btn-outline py-1.5 px-3.5 text-xs shadow-sm"
                >
                  📄 Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('text');
                  }}
                  className="btn-outline py-1.5 px-3.5 text-xs shadow-sm"
                >
                  📝 Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('pdf');
                  }}
                  className="btn-outline py-1.5 px-3.5 text-xs shadow-sm"
                >
                  🖼 Upload Image (OCR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setUrl('');
                  }}
                  className="btn-primary py-1.5 px-3.5 text-xs shadow-sm"
                >
                  🔗 Try Another URL
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Terms & Conditions URL
                </label>
                <input
                  type="text"
                  placeholder="https://openai.com/policies/terms-of-use/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="form-input text-sm"
                  disabled={analyzeUrlMutation.isPending}
                />
                <span className="text-[11px] text-slate-400 block mt-1 font-medium">
                  Example URL: <span className="italic font-normal">https://openai.com/policies/terms-of-use/</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={analyzeUrlMutation.isPending || !url.trim()}
                className="btn-primary text-sm font-semibold flex items-center gap-2"
              >
                {analyzeUrlMutation.isPending ? 'Extracting Webpage...' : 'Analyze URL'}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'text' && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Analyze Direct Text Input</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Copy and paste terms agreement document chunks directly below to process AI diagnostics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Terms & Conditions Text
              </label>
              <textarea
                placeholder="Paste Terms & Conditions here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={12}
                maxLength={150000}
                className="form-input text-sm resize-y font-sans leading-relaxed"
                disabled={analyzeTextMutation.isPending}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 font-semibold">
                <span>Minimum 100 characters required.</span>
                <span className={textInput.length < 100 || textInput.length > 150000 ? 'text-warning font-bold' : 'text-slate-400'}>
                  {textInput.length.toLocaleString()} / 150,000 characters
                </span>
              </div>
            </div>

            <button
              onClick={handleTextSubmit}
              disabled={analyzeTextMutation.isPending || textInput.length < 100 || textInput.length > 150000}
              className="btn-primary"
            >
              {analyzeTextMutation.isPending ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        </div>
      )}

      {/* Details View Dialog Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Document Metadata</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">UUID reference and backend storage configurations.</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-900 font-semibold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-650 bg-[#F8FAFC] p-4.5 rounded-xl border border-slate-200/60 font-semibold">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">Document ID:</span>
                <span className="font-mono text-xs text-slate-700">{selectedDoc.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">Original Name:</span>
                <span className="max-w-[240px] truncate text-slate-700">{selectedDoc.original_filename}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">Source Type:</span>
                <span className="uppercase text-xs font-extrabold text-brand-600">{selectedDoc.source_type || 'PDF'}</span>
              </div>
              {selectedDoc.source_url && (
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400">Source URL:</span>
                  <span className="text-xs max-w-[240px] truncate underline text-slate-500" title={selectedDoc.source_url}>
                    {selectedDoc.source_url}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">Stored Name:</span>
                <span className="font-mono text-xs max-w-[240px] truncate text-slate-700">{selectedDoc.stored_filename || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">File Type:</span>
                <span className="uppercase text-xs text-slate-700">{selectedDoc.file_type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">File Size:</span>
                <span className="text-slate-750">{formatBytes(selectedDoc.file_size)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400">Upload Date:</span>
                <span className="text-slate-755">{formatDate(selectedDoc.created_at)}</span>
              </div>
              {selectedDoc.storage_path && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Disk Storage Path:</span>
                  <span className="font-mono text-[10px] text-slate-500 max-w-[240px] truncate" title={selectedDoc.storage_path}>
                    {selectedDoc.storage_path}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="btn-outline py-2 px-4 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedDoc.id)}
                disabled={deleteMutation.isPending}
                className="btn-danger py-2 px-4 text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Disabled Info Modal */}
      {ocrDisabledInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">🧪</span>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-display">Image OCR (Beta)</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Image OCR requires higher-memory hosting and is not available on this deployment.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-100 p-4.5 rounded-xl space-y-3 font-semibold">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended alternatives:</h4>
              <ul className="list-none space-y-2 text-xs text-slate-600 pl-0">
                <li className="flex items-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Upload Text PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Upload DOCX</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Upload TXT</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Analyze URL</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setOcrDisabledInfo(null)}
                className="btn-secondary py-2 px-5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
