import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { API_ROUTES } from '@/config/api-routes';
import { motion, AnimatePresence } from 'framer-motion';

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
      const response = await apiClient.post<Document>(API_ROUTES.DOCUMENTS.EXTRACT(docId), {}, { timeout: 120000 });
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
    },
    onSuccess: (updatedDoc: Document) => {
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

  // Analyze PDF Mutation
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
    <div className="space-y-8 relative fade-in text-slate-700">
      
      {/* AI Analysis Loading Screen Overlay */}
      <AnimatePresence>
        {isAnyAnalysisPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50"
          >
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
            
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Top glowing laser line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
              
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Outer Spin Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500/10 border-b-brand-500/10 border-l-brand-500/10 animate-spin" />
                {/* Inner Reverse Spin Ring */}
                <div className="absolute inset-2 rounded-full border-4 border-b-brand-400 border-t-brand-400/10 border-r-brand-400/10 border-l-brand-400/10 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                <span className="text-3xl select-none">🛡️</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {urlLoadingStep === 'extracting' ? 'Extracting Webpage Link...' : 'AI Legal Audit In Progress'}
                </h3>
                <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto font-medium">
                  {urlLoadingStep === 'extracting'
                    ? 'Crawling URL components, parsing public HTML text, and cleaning cookie disclosures...'
                    : 'Auditing provisions, highlighting hidden auto-renew charges, and scoring liability limits...'}
                </p>
              </div>

              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-3 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>AUDITING ENGINE</span>
                  <span className="text-brand-650 font-extrabold animate-pulse uppercase tracking-wider">
                    {urlLoadingStep === 'extracting' ? 'CRAWLING' : 'COMPILING'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden relative">
                  <div className="bg-brand-500 h-full rounded-full animate-progress-indeterminate absolute" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/25 shadow-2xl print:hidden"
          >
            <span className="text-base select-none">✓</span>
            <span className="text-xs font-bold">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Error Toast */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-xl bg-red-950/90 text-red-400 border border-red-500/25 shadow-2xl print:hidden"
          >
            <span className="text-base select-none">⚠️</span>
            <span className="text-xs font-bold">{errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">AI Legal Auditor</h2>
        <p className="text-sm text-slate-450 mt-1 font-semibold">Select your source format and run instant legalese diagnostics.</p>
      </div>

      {/* Tab Menu Header Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 select-none ${
            activeTab === 'pdf'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/15'
              : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50'
          }`}
        >
          <span className="text-sm">📄</span>
          <span>PDF / Document</span>
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 select-none ${
            activeTab === 'url'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/15'
              : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50'
          }`}
        >
          <span className="text-sm">🌐</span>
          <span>Website URL</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 select-none ${
            activeTab === 'text'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/15'
              : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50'
          }`}
        >
          <span className="text-sm">📝</span>
          <span>Direct Text</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      {activeTab === 'pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Upload Area & Tips */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display border-b border-slate-100 dark:border-slate-800 pb-3">Upload Document</h3>
              
              <motion.div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerBrowse}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 min-h-[220px] select-none ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50/30'
                    : 'border-slate-200 bg-slate-50/40 hover:border-brand-500/50 hover:bg-brand-50/10'
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
                
                {/* Visual upload icon */}
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 text-xl border border-brand-500/20">
                  📁
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Drag & drop agreement here</p>
                  <p className="text-xs text-slate-400 font-semibold">or click to browse local files</p>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  PDF, DOCX, TXT (Max: 20MB)
                </p>
              </motion.div>

              {/* Upload Progress Indicator */}
              {uploadProgress !== null && (
                <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-450 uppercase tracking-wider">Uploading file</span>
                    <span className="text-brand-650">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-brand-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}

              {/* Supported/Optional Ingest Formats */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Audit Guidelines</span>
                  <ul className="list-none space-y-2 pl-0 text-xs text-slate-500 font-semibold">
                    <li className="flex items-center gap-2">
                      <span className="text-brand-500 text-sm">✓</span>
                      <span>Text extraction runs automatically on uploads.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-500 text-sm">✓</span>
                      <span>Scrubbing algorithms dynamically hide private PII.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-500 text-sm">✓</span>
                      <span>Scans complete in under 3 seconds.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Image OCR Support</span>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                    Image file uploads (PNG/JPG) require high-memory OCR clusters. If unavailable, use direct text pasting instead.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right panel: Uploaded Documents Table */}
          <div className="lg:col-span-2">
            <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">Recent Uploads</h3>

              {isLoading ? (
                <div className="space-y-3 py-6 animate-pulse">
                  <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-16 border border-slate-100 dark:border-slate-800/40 bg-slate-55/50 dark:bg-slate-950/20 rounded-xl text-center space-y-3.5 select-none">
                  <span className="text-4xl block">📂</span>
                  <h4 className="font-bold text-slate-700 dark:text-slate-400 text-sm">No files uploaded yet</h4>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed font-semibold">
                    Upload a compliance document using the drag-and-drop widget to save its configurations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/65 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 font-bold uppercase tracking-widest text-[9px] select-none">
                        <th className="p-4">File Name</th>
                        <th className="p-4 hidden md:table-cell">Type</th>
                        <th className="p-4 hidden sm:table-cell">Size</th>
                        <th className="p-4 hidden lg:table-cell">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-500">
                      {documents.map((doc, idx) => {
                        const isProcessing = extractMutation.isPending && extractMutation.variables === doc.id;
                        
                        return (
                          <motion.tr 
                            key={doc.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-slate-50/30 transition duration-150"
                          >
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-[180px] truncate" title={doc.original_filename}>
                              {doc.original_filename}
                            </td>
                            <td className="p-4 text-[10px] font-bold text-slate-400 hidden md:table-cell uppercase">{doc.file_type}</td>
                            <td className="p-4 text-xs text-slate-450 hidden sm:table-cell">{formatBytes(doc.file_size)}</td>
                            <td className="p-4 text-xs text-slate-450 hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                            <td className="p-4">
                              {doc.processing_status === 'COMPLETED' ? (
                                doc.analysis ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    doc.analysis.overall_risk_score <= 30
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                      : doc.analysis.overall_risk_score <= 60
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      : 'bg-red-500/10 text-red-650 border-red-500/20'
                                  }`}>
                                    Score: {doc.analysis.overall_risk_score}/100
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-brand-500/10 text-brand-600 border-brand-500/20 animate-pulse">
                                    Ready
                                  </span>
                                )
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  doc.processing_status === 'PROCESSING' || isProcessing
                                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/20 animate-pulse'
                                    : doc.processing_status === 'FAILED'
                                    ? 'bg-red-500/15 text-red-600 border-red-500/20'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {isProcessing || doc.processing_status === 'PROCESSING'
                                    ? 'Extracting...'
                                    : doc.processing_status === 'FAILED'
                                    ? 'Failed'
                                    : doc.processing_status}
                                </span>
                              )}
                            </td>
                            
                            {/* Action Buttons */}
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              {(doc.processing_status === 'UPLOADED' || doc.processing_status === 'FAILED') && (
                                <button
                                  onClick={() => {
                                    if (!isProcessing) {
                                      extractMutation.mutate(doc.id);
                                    }
                                  }}
                                  disabled={extractMutation.isPending || isProcessing}
                                  className="px-2 py-1 border border-brand-500/20 bg-brand-500/10 hover:bg-brand-500 hover:text-white text-brand-600 text-[10px] font-bold rounded transition"
                                >
                                  {isProcessing ? 'Extracting...' : 'Extract'}
                                </button>
                              )}

                              {doc.processing_status === 'COMPLETED' && (
                                <button
                                  onClick={() => analyzeMutation.mutate(doc.id)}
                                  disabled={analyzeMutation.isPending}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    doc.analysis
                                      ? 'bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550'
                                      : 'border-brand-500/20 bg-brand-500/10 text-brand-600 hover:bg-brand-500 hover:text-white animate-pulse'
                                  }`}
                                >
                                  {doc.analysis ? 'Re-analyze' : 'Analyze'}
                                </button>
                              )}

                              {doc.analysis && (
                                <Link
                                  to={`/results/${doc.id}`}
                                  className="px-2 py-1 border border-brand-500/20 bg-brand-500/10 hover:bg-brand-500 hover:text-white text-brand-600 text-[10px] font-bold rounded inline-block transition"
                                >
                                  Results
                                </Link>
                              )}

                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="px-2 py-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded transition"
                              >
                                Details
                              </button>
                              
                              <button
                                onClick={() => deleteMutation.mutate(doc.id)}
                                disabled={deleteMutation.isPending || isProcessing || analyzeMutation.isPending}
                                className="px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-650 text-[10px] font-bold rounded transition"
                              >
                                Delete
                              </button>
                            </td>
                          </motion.tr>
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-6 max-w-2xl"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Analyze Link URL</h3>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
              Provide the direct URL of the Terms & Conditions or Privacy Policy page. Our crawling engine extracts the clean text, bypasses cookies/newsletter prompts, and executes the audit.
            </p>
          </div>

          {urlAnalysisError ? (
            <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/10 space-y-5 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h4 className="text-base font-bold text-red-655 dark:text-red-400 font-display">Ingestion Failure</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">
                    Type: {urlAnalysisError.errorType}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-red-100 dark:border-slate-800 p-4 rounded-xl text-xs leading-relaxed text-red-700 dark:text-red-400 font-medium shadow-sm">
                <strong>Detail:</strong> {urlAnalysisError.reason}
              </div>

              {urlAnalysisError.suggestions && urlAnalysisError.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended Recovery Actions:</h5>
                  <ul className="list-none space-y-1.5 pl-0">
                    {urlAnalysisError.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-550 dark:text-slate-400 font-semibold">
                        <span className="text-brand-500 font-extrabold">✓</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Recovery actions list */}
              <div className="pt-4 border-t border-red-150 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('pdf');
                  }}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg shadow-sm transition"
                >
                  📄 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setActiveTab('text');
                  }}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg shadow-sm transition"
                >
                  📝 Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlAnalysisError(null);
                    setUrl('');
                  }}
                  className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow-md transition"
                >
                  Try Another URL
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Legal Agreement Link URL
                </label>
                <input
                  type="text"
                  placeholder="https://company.com/terms-of-service"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm transition-all duration-200 outline-none font-semibold"
                  disabled={analyzeUrlMutation.isPending}
                />
                <span className="text-[11px] text-slate-450 block mt-1 font-semibold">
                  Example: <span className="italic font-normal">https://openai.com/policies/terms-of-use/</span>
                </span>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={analyzeUrlMutation.isPending || !url.trim()}
                className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all select-none disabled:opacity-50"
              >
                {analyzeUrlMutation.isPending ? 'Crawling Webpage...' : 'Analyze URL'}
              </motion.button>
            </form>
          )}
        </motion.div>
      )}

      {activeTab === 'text' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-soft space-y-6 max-w-3xl"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Analyze Plain Text</h3>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
              Directly copy and paste the legal contract sections into the workspace editor below to run AI compliance checkups.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Terms Agreement Copy
              </label>
              <textarea
                placeholder="Paste Terms and Conditions or Privacy policy clauses here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={12}
                maxLength={150000}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-slate-900 dark:text-white placeholder-slate-450 rounded-xl text-sm transition-all duration-200 outline-none font-medium leading-relaxed resize-y min-h-[220px]"
                disabled={analyzeTextMutation.isPending}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-bold">
                <span>Minimum 100 characters required.</span>
                <span className={textInput.length < 100 || textInput.length > 150000 ? 'text-amber-500 font-bold' : 'text-slate-400 font-mono'}>
                  {textInput.length.toLocaleString()} / 150,000 chars
                </span>
              </div>
            </div>

            <motion.button
              onClick={handleTextSubmit}
              whileTap={{ scale: 0.97 }}
              disabled={analyzeTextMutation.isPending || textInput.length < 100 || textInput.length > 150000}
              className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all select-none disabled:opacity-50"
            >
              {analyzeTextMutation.isPending ? 'Analyzing Text...' : 'Analyze Text'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Details View Dialog Modal Container */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl text-slate-800 dark:text-slate-250 relative"
            >
              {/* Holographic glowing line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-350 to-transparent" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Document Metadata</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Backend reference structures and properties.</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-bold select-none p-1.5 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800/80 p-4.5 rounded-xl font-semibold">
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Document ID:</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{selectedDoc.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Original Name:</span>
                  <span className="max-w-[220px] truncate text-slate-700 dark:text-slate-300">{selectedDoc.original_filename}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Source Type:</span>
                  <span className="uppercase text-xs font-bold text-brand-600 dark:text-brand-400">{selectedDoc.source_type || 'PDF'}</span>
                </div>
                {selectedDoc.source_url && (
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                    <span className="text-slate-400">Source URL:</span>
                    <span className="text-xs max-w-[220px] truncate underline text-slate-500" title={selectedDoc.source_url}>
                      {selectedDoc.source_url}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Stored Name:</span>
                  <span className="font-mono text-xs max-w-[220px] truncate text-slate-700 dark:text-slate-300">{selectedDoc.stored_filename || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">File Type:</span>
                  <span className="uppercase text-xs text-slate-750 dark:text-slate-300">{selectedDoc.file_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">File Size:</span>
                  <span className="text-slate-700 dark:text-slate-300">{formatBytes(selectedDoc.file_size)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Upload Date:</span>
                  <span className="text-slate-700 dark:text-slate-300">{formatDate(selectedDoc.created_at)}</span>
                </div>
                {selectedDoc.storage_path && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disk Storage Path:</span>
                    <span className="font-mono text-[10px] text-slate-500 max-w-[220px] truncate" title={selectedDoc.storage_path}>
                      {selectedDoc.storage_path}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                >
                  Close Details
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedDoc.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-655 text-xs font-bold rounded-lg transition"
                >
                  Delete File
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR Disabled Info Modal Container */}
      <AnimatePresence>
        {ocrDisabledInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl text-slate-800 dark:text-slate-250 relative"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  🧪
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Image OCR Locked</h3>
                  <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                    Image compliance OCR requires larger GPU resources and is not enabled on this sandbox setup.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800/80 p-4.5 rounded-xl space-y-2.5 font-semibold text-slate-500">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended alternatives:</h4>
                <ul className="list-none space-y-2 text-xs text-slate-650 dark:text-slate-400 pl-0">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-extrabold">✓</span>
                    <span>Upload Text PDFs or agreements.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-extrabold">✓</span>
                    <span>Upload Word DOCX files.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-extrabold">✓</span>
                    <span>Analyze URL links directly.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-extrabold">✓</span>
                    <span>Copy and paste plain text documents.</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOcrDisabledInfo(null)}
                  className="px-5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                >
                  Close Info
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
