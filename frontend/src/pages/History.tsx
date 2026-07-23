import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';

// Reusable Circular Progress ring component for Details modal
const CircularRiskProgress: React.FC<{ score: number }> = ({ score }) => {
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10B981'; // Green (0-30)
  if (score > 30 && score <= 60) strokeColor = '#F59E0B'; // Yellow (31-60)
  else if (score > 60) strokeColor = '#EF4444'; // Red (61-100)

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
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
        <span className="text-2xl font-bold text-slate-100 font-display">{score}</span>
        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
};

export const History: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [fileType, setFileType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [analysisDate, setAnalysisDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Clear selections on query changes
  React.useEffect(() => {
    setSelectedIds([]);
  }, [page, limit, search, riskLevel, fileType, statusFilter, uploadDate, analysisDate, sortBy, order]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(historyItems.map((item: any) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle sorting helper
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('desc');
    }
    setPage(1);
  };

  // Build params dynamically
  const queryParams = {
    page,
    limit,
    sort_by: sortBy,
    order,
    ...(search && { search }),
    ...(riskLevel && { risk_level: riskLevel }),
    ...(fileType && { file_type: fileType }),
    ...(statusFilter && { status: statusFilter }),
    ...(uploadDate && { upload_date: uploadDate }),
    ...(analysisDate && { analysis_date: analysisDate }),
  };

  // Fetch History List using React Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['history', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/history', { params: queryParams });
      return response.data;
    },
  });

  const historyItems = data?.items || [];
  const totalRecords = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Fetch details of active document
  const { data: detailDoc, isLoading: isDetailLoading } = useQuery({
    queryKey: ['history-detail', activeDetailId],
    queryFn: async () => {
      const response = await apiClient.get(`/history/${activeDetailId}`);
      return response.data;
    },
    enabled: !!activeDetailId && detailModalOpen,
  });

  // Re-analyze Mutation
  const reanalyzeMutation = useMutation({
    mutationFn: async (docId: string) => {
      const response = await apiClient.post(`/history/${docId}/reanalyze`);
      return response.data;
    },
    onSuccess: (newAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast(`AI Risk Audit refreshed! New score: ${newAnalysis.overall_risk_score}/100`);
      setTimeout(() => setSuccessToast(null), 5000);
      
      // If modal is open displaying this document, refresh details too
      if (activeDetailId) {
        queryClient.invalidateQueries({ queryKey: ['history-detail', activeDetailId] });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Re-analysis trigger failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await apiClient.delete(`/history/${docId}`);
    },
    onMutate: async (docId) => {
      await queryClient.cancelQueries({ queryKey: ['history', queryParams] });
      const previousHistory = queryClient.getQueryData(['history', queryParams]);
      
      queryClient.setQueryData(['history', queryParams], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.id !== docId),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousHistory };
    },
    onError: (err: any, _, context: any) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history', queryParams], context.previousHistory);
      }
      const msg = err.response?.data?.detail || 'Failed to delete history record.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast('History record and physical files deleted successfully.');
      setDeleteModalOpen(false);
      setDocToDelete(null);
      setTimeout(() => setSuccessToast(null), 4000);
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiClient.post('/history/bulk-delete', { document_ids: ids });
      return response.data;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['history', queryParams] });
      const previousHistory = queryClient.getQueryData(['history', queryParams]);
      
      queryClient.setQueryData(['history', queryParams], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => !ids.includes(item.id)),
          total: Math.max(0, old.total - ids.length),
        };
      });

      return { previousHistory };
    },
    onError: (err: any, _, context: any) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history', queryParams], context.previousHistory);
      }
      const msg = err.response?.data?.detail || 'Bulk deletion failed.';
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessToast(data.message || 'Selected records deleted successfully!');
      setSelectedIds([]);
      setTimeout(() => setSuccessToast(null), 4000);
    },
  });

  // Client-side report generation & download
  const downloadReport = (doc: any) => {
    if (!doc.analysis) {
      setErrorToast("No analysis audit results found for this document.");
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    const analysis = doc.analysis;
    const clausesText = analysis.items && analysis.items.length > 0
      ? analysis.items.map((c: any, idx: number) => `
### Clause ${idx + 1}: ${c.title}
- **Category**: ${c.category}
- **Risk Level**: ${c.risk_level}
- **Original Text**: "${c.original_text}"
- **Explanation**: ${c.explanation}
- **Remediation Suggestion**: ${c.suggestion}
`).join('\n')
      : 'No risk clauses detected.';

    // Deserialize missing clauses if it is a JSON string
    let parsedMissing: any[] = [];
    if (analysis.missing_clauses) {
      if (typeof analysis.missing_clauses === 'string') {
        try {
          parsedMissing = JSON.parse(analysis.missing_clauses);
        } catch (e) {
          parsedMissing = [];
        }
      } else if (Array.isArray(analysis.missing_clauses)) {
        parsedMissing = analysis.missing_clauses;
      }
    }

    const missingClausesText = parsedMissing.length > 0
      ? parsedMissing.map((m: any, idx: number) => `
### Missing Clause ${idx + 1}: ${m.title}
- **Explanation**: ${m.explanation}
`).join('\n')
      : 'No standard protective clauses were identified as missing.';

    const confidenceScoreText = analysis.confidence_score 
      ? (analysis.confidence_score <= 1 
        ? `${(analysis.confidence_score * 100).toFixed(0)}%` 
        : `${analysis.confidence_score}%`)
      : '95%';

    const reportContent = `# Legal Risk Audit Report: ${doc.original_filename}
- **Source Type**: ${doc.source_type || 'PDF'}
- **File Size**: ${formatBytes(doc.file_size)}
- **Upload Date**: ${formatDate(doc.created_at)}
- **Analysis Date**: ${formatDate(analysis.created_at)}
- **AI Audit Provider**: ${analysis.provider} (${analysis.model_name})
- **Confidence Score**: ${confidenceScoreText}

---

## 📊 Executive Summary
- **Overall Risk Score**: ${analysis.overall_risk_score}/100
- **Risk Category Assessment**: ${doc.risk_level || 'UNKNOWN'}

### 📝 Summary
${analysis.summary}

${analysis.ai_explanation ? `### 🤖 AI Auditor Assessment\n${analysis.ai_explanation}\n` : ''}

### 💡 Precautionary Recommendations
${analysis.recommendations}

---

## ⚠️ Missing Protective Clauses
${missingClausesText}

---

## 🔍 Flagged Clauses Details
${clausesText}

---
*Generated by TNC Guardian Document Intelligence.*
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.original_filename.replace(/\.[^/.]+$/, "")}_audit_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessToast('Audit report downloaded successfully.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDownload = async (docId: string) => {
    setIsDownloadingId(docId);
    try {
      const response = await apiClient.get(`/history/${docId}`);
      downloadReport(response.data);
    } catch (err) {
      setErrorToast('Failed to fetch full report details.');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsDownloadingId(null);
    }
  };

  // Open details helper
  const openDetails = (docId: string) => {
    setActiveDetailId(docId);
    setDetailModalOpen(true);
  };

  // Risk badge color helper
  const getRiskBadgeStyles = (level: string | null | undefined) => {
    if (!level) return 'text-slate-400 bg-slate-800/40 border border-slate-700/50';
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-950/40 border border-red-800/50';
      case 'HIGH':
        return 'text-orange-400 bg-orange-950/40 border border-orange-800/50';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/40 border border-yellow-800/50';
      case 'LOW':
        return 'text-green-400 bg-green-950/40 border border-green-800/50';
      default:
        return 'text-slate-400 bg-slate-800/40 border border-slate-700/50';
    }
  };

  // Status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/50';
      case 'PROCESSING':
        return 'text-blue-400 bg-blue-950/30 border border-blue-900/50 animate-pulse';
      case 'FAILED':
        return 'text-red-400 bg-red-950/30 border border-red-900/50';
      default:
        return 'text-slate-400 bg-slate-900 border border-slate-800';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-emerald-950 border border-emerald-800 text-sm text-emerald-300 shadow-xl animate-fade-in flex items-center gap-2">
          <span>✅</span> {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-red-950 border border-red-800 text-sm text-red-300 shadow-xl animate-fade-in flex items-center gap-2">
          <span>❌</span> {errorToast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 font-display">Analysis History Logs</h2>
          <p className="text-sm text-slate-400 mt-1">Review, query, and manage your previously analyzed documents.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="self-start px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-850 hover:border-slate-800 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <span>🔄</span> Refresh Logs
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="p-5 bg-slate-900 border border-slate-850 rounded-xl space-y-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by file name, keywords..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 transition duration-150"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg px-4 py-2.5 text-sm text-slate-300 transition duration-150"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg px-4 py-2.5 text-sm text-slate-300 transition duration-150"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Extended filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-850/60">
          {/* File Type filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">File Format</label>
            <select
              value={fileType}
              onChange={(e) => { setFileType(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg px-3 py-2 text-xs text-slate-300 transition duration-150"
            >
              <option value="">All Formats</option>
              <option value="pdf">PDF Document</option>
              <option value="docx">Word (DOCX)</option>
              <option value="txt">Text File</option>
              <option value="png">PNG Image</option>
              <option value="jpg">JPG Image</option>
            </select>
          </div>

          {/* Upload Date filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Upload Date</label>
            <input
              type="date"
              value={uploadDate}
              onChange={(e) => { setUploadDate(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg px-3 py-2 text-xs text-slate-300 transition duration-150"
            />
          </div>

          {/* Analysis Date filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Analysis Date</label>
            <input
              type="date"
              value={analysisDate}
              onChange={(e) => { setAnalysisDate(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-lg px-3 py-2 text-xs text-slate-300 transition duration-150"
            />
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setRiskLevel('');
                setFileType('');
                setStatusFilter('');
                setUploadDate('');
                setAnalysisDate('');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-850 hover:border-slate-800 rounded-lg text-xs font-semibold tracking-wide transition duration-150"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-950/10 border border-red-900/20 rounded-xl animate-fade-in">
          <span className="text-xs text-slate-350">
            Selected <span className="font-bold text-red-400">{selectedIds.length}</span> audit logs for batch deletion.
          </span>
          <button
            onClick={() => setBulkDeleteModalOpen(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg border border-red-700 transition shadow-lg"
          >
            🗑️ Delete Selected
          </button>
        </div>
      )}

      {/* Main logs list container */}
      <div className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-850 shadow-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={historyItems.length > 0 && selectedIds.length === historyItems.length}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = selectedIds.length > 0 && selectedIds.length < historyItems.length;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="rounded bg-slate-950 border-slate-800 text-green-600 focus:ring-green-500/20 w-4 h-4 cursor-pointer"
                />
              </th>
              <th onClick={() => handleSort('original_filename')} className="p-4 cursor-pointer hover:bg-slate-900 transition">
                <div className="flex items-center gap-1.5">
                  <span>File Name</span>
                  {sortBy === 'original_filename' && (order === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('file_type')} className="p-4 cursor-pointer hover:bg-slate-900 transition w-28">
                <div className="flex items-center gap-1.5">
                  <span>Source</span>
                  {sortBy === 'file_type' && (order === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('created_at')} className="p-4 cursor-pointer hover:bg-slate-900 transition w-36">
                <div className="flex items-center gap-1.5">
                  <span>Upload Date</span>
                  {sortBy === 'created_at' && (order === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('analysis_date')} className="p-4 cursor-pointer hover:bg-slate-900 transition w-36">
                <div className="flex items-center gap-1.5">
                  <span>Analysis Date</span>
                  {sortBy === 'analysis_date' && (order === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('risk_score')} className="p-4 cursor-pointer hover:bg-slate-900 transition w-32">
                <div className="flex items-center gap-1.5">
                  <span>Risk Score</span>
                  {sortBy === 'risk_score' && (order === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="p-4 w-32">Status</th>
              <th className="p-4 w-32">AI Provider</th>
              <th className="p-4 text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-300 divide-y divide-slate-850/60">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: limit }).map((_, idx) => (
                <tr key={idx} className="bg-slate-900/50">
                  <td className="p-4 text-center"><div className="w-4 h-4 bg-slate-800/80 rounded mx-auto animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-48 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-12 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-24 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-24 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-16 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-20 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/80 rounded w-16 animate-pulse" /></td>
                  <td className="p-4 text-right"><div className="h-7 bg-slate-800/80 rounded w-24 ml-auto animate-pulse" /></td>
                </tr>
              ))
            ) : historyItems.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="p-16 text-center space-y-4">
                  <div className="text-5xl block animate-bounce">🔍</div>
                  <h4 className="text-slate-200 font-semibold text-base font-display">No history logs found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find any audited documents matching your search queries or filter choices. Try adjusting your parameters.
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setRiskLevel('');
                      setFileType('');
                      setStatusFilter('');
                      setUploadDate('');
                      setAnalysisDate('');
                      setPage(1);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-750 transition"
                  >
                    Reset All Queries
                  </button>
                </td>
              </tr>
            ) : (
              // Document History Rows
              historyItems.map((doc: any) => (
                <tr key={doc.id} className={`${selectedIds.includes(doc.id) ? 'bg-green-950/10 hover:bg-green-950/20' : 'hover:bg-slate-850/30'} transition group duration-100`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => handleSelectRow(doc.id)}
                      className="rounded bg-slate-950 border-slate-800 text-green-600 focus:ring-green-500/20 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  {/* File Name */}
                  <td className="p-4 font-medium text-slate-100 font-display">
                    <span 
                      onClick={() => openDetails(doc.id)} 
                      className="hover:text-green-400 cursor-pointer transition underline decoration-dotted decoration-slate-600 hover:decoration-green-500"
                    >
                      {doc.source_type === 'URL' && doc.source_url ? (
                        (() => {
                          try {
                            const parsed = new URL(doc.source_url);
                            return parsed.hostname.replace('www.', '');
                          } catch (e) {
                            return doc.original_filename;
                          }
                        })()
                      ) : doc.original_filename}
                    </span>
                  </td>
                  
                  {/* Source */}
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-xs text-slate-400 font-semibold uppercase font-display flex items-center gap-1.5 w-fit">
                      {doc.source_type === 'URL' && '🌐 URL'}
                      {doc.source_type === 'TEXT' && '📝 TEXT'}
                      {(doc.source_type === 'PDF' || !doc.source_type) && '📄 PDF'}
                    </span>
                  </td>

                  {/* Upload Date */}
                  <td className="p-4 text-slate-400 text-xs">
                    {formatDate(doc.created_at)}
                  </td>

                  {/* Analysis Date */}
                  <td className="p-4 text-slate-400 text-xs">
                    {doc.analysis ? formatDate(doc.analysis.created_at) : 'Not analyzed'}
                  </td>

                  {/* Risk Score */}
                  <td className="p-4">
                    {doc.analysis ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-display ${getRiskBadgeStyles(doc.risk_level)}`}>
                        {doc.analysis.overall_risk_score} ({doc.risk_level})
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs italic">N/A</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${getStatusBadgeStyles(doc.processing_status)}`}>
                      {doc.processing_status}
                    </span>
                  </td>

                  {/* Provider */}
                  <td className="p-4 text-slate-400 text-xs font-display">
                    {doc.analysis ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-300 capitalize">{doc.analysis.provider}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{doc.analysis.model_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Actions column */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                      {/* View Details / Results */}
                      {doc.analysis ? (
                        <Link
                          to={`/results/${doc.id}`}
                          className="p-1.5 bg-slate-950 hover:bg-green-950/20 text-slate-400 hover:text-green-400 border border-slate-850 hover:border-green-900 rounded transition"
                          title="View Audit Results page"
                        >
                          👁️
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 bg-slate-950 text-slate-700 border border-slate-850 rounded cursor-not-allowed"
                          title="No analysis results available"
                        >
                          👁️
                        </button>
                      )}

                      {/* Download report */}
                      <button
                        onClick={() => handleDownload(doc.id)}
                        disabled={!doc.analysis || isDownloadingId === doc.id}
                        className={`p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded transition text-slate-400 hover:text-slate-200 ${
                          (!doc.analysis || isDownloadingId === doc.id) && 'opacity-30 cursor-not-allowed'
                        }`}
                        title="Download Markdown Report"
                      >
                        {isDownloadingId === doc.id ? '⏳' : '📥'}
                      </button>

                      {/* Re-analyze */}
                      <button
                        onClick={() => reanalyzeMutation.mutate(doc.id)}
                        disabled={reanalyzeMutation.isPending || doc.processing_status === 'PROCESSING'}
                        className={`p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded transition text-slate-400 hover:text-slate-200 ${
                          (reanalyzeMutation.isPending || doc.processing_status === 'PROCESSING') && 'opacity-30 cursor-not-allowed'
                        }`}
                        title="Re-run AI Analysis"
                      >
                        🔄
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setDocToDelete(doc);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-900 rounded transition"
                        title="Delete Document & History"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/50 border border-slate-850 rounded-xl">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Showing <span className="font-semibold text-slate-200">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(page * limit, totalRecords)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{totalRecords}</span> logs
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    page === p
                      ? 'bg-green-600 text-white border border-green-500'
                      : 'bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 1. History Details Modal Drawer */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Document Audit Details</span>
                <h3 className="text-xl font-bold text-white font-display mt-0.5">
                  {detailDoc?.original_filename || 'Loading Metadata...'}
                </h3>
              </div>
              <button
                onClick={() => { setDetailModalOpen(false); setActiveDetailId(null); }}
                className="text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 p-2 rounded-lg text-sm transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {isDetailLoading ? (
                <div className="space-y-6 py-12">
                  <div className="h-6 bg-slate-800 rounded w-1/3 animate-pulse" />
                  <div className="h-32 bg-slate-800 rounded animate-pulse" />
                  <div className="h-6 bg-slate-800 rounded w-1/4 animate-pulse" />
                  <div className="h-24 bg-slate-800 rounded animate-pulse" />
                </div>
              ) : !detailDoc ? (
                <div className="text-center py-12 text-slate-400">
                  Failed to load analysis details.
                </div>
              ) : (
                <>
                  {/* Section: Score, Metadata and Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* circular progress score */}
                    <div className="md:col-span-1 p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center space-y-2 shadow-inner">
                      {detailDoc.analysis ? (
                        <>
                          <CircularRiskProgress score={detailDoc.analysis.overall_risk_score} />
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getRiskBadgeStyles(detailDoc.risk_level)}`}>
                            {detailDoc.risk_level}
                          </span>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <span className="text-4xl block">⚖️</span>
                          <span className="text-xs text-slate-500 italic block mt-2">Not Audited</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Card */}
                    <div className="md:col-span-3 p-5 bg-slate-950/50 border border-slate-850 rounded-xl space-y-3 text-xs text-slate-400">
                      <h4 className="font-bold text-slate-200 text-sm font-display border-b border-slate-850 pb-1.5">Original File Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-slate-500 font-semibold uppercase">File Name</span>
                          <span className="text-slate-200 font-medium break-all">{detailDoc.original_filename}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-semibold uppercase">Source Type</span>
                          <span className="text-slate-200 font-semibold uppercase flex items-center gap-1.5">
                            {detailDoc.source_type === 'URL' && '🌐 URL'}
                            {detailDoc.source_type === 'TEXT' && '📝 TEXT'}
                            {(detailDoc.source_type === 'PDF' || !detailDoc.source_type) && '📄 PDF'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-semibold uppercase">File Size</span>
                          <span className="text-slate-200 font-medium">{formatBytes(detailDoc.file_size)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-semibold uppercase">Upload Date</span>
                          <span className="text-slate-200 font-medium">{formatDate(detailDoc.created_at)}</span>
                        </div>
                        {detailDoc.source_type === 'URL' && detailDoc.source_url && (
                          <div className="col-span-2">
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Source URL</span>
                            <a
                              href={detailDoc.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-400 hover:text-green-300 hover:underline break-all font-mono"
                            >
                              {detailDoc.source_url}
                            </a>
                          </div>
                        )}
                        {detailDoc.page_count && (
                          <div>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Page Count</span>
                            <span className="text-slate-200 font-medium">{detailDoc.page_count} pages</span>
                          </div>
                        )}
                        {detailDoc.word_count && (
                          <div>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Word Count</span>
                            <span className="text-slate-200 font-medium">{detailDoc.word_count} words</span>
                          </div>
                        )}
                        {detailDoc.analysis && (
                          <div>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Confidence Score</span>
                            <span className="text-slate-200 font-medium">
                              {detailDoc.analysis.confidence_score 
                                ? (detailDoc.analysis.confidence_score <= 1 
                                  ? `${(detailDoc.analysis.confidence_score * 100).toFixed(0)}%` 
                                  : `${detailDoc.analysis.confidence_score}%`)
                                : '95%'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Analysis Summary & recommendations */}
                  {detailDoc.analysis ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary */}
                        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            <h4 className="font-bold text-slate-200 font-display text-sm">Executive Summary</h4>
                          </div>
                          <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">
                            {detailDoc.analysis.summary}
                          </p>
                        </div>

                        {/* Recommendations */}
                        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            <h4 className="font-bold text-slate-200 font-display text-sm">Precautionary Recommendations</h4>
                          </div>
                          <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">
                            {detailDoc.analysis.recommendations}
                          </p>
                        </div>
                      </div>

                      {/* AI Auditor Assessment */}
                      {detailDoc.analysis.ai_explanation && (
                        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🤖</span>
                            <h4 className="font-bold text-slate-200 font-display text-sm">AI Auditor Assessment</h4>
                          </div>
                          <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">
                            {detailDoc.analysis.ai_explanation}
                          </p>
                        </div>
                      )}

                      {/* Missing Clauses Card */}
                      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          <h4 className="font-bold text-slate-200 font-display text-sm">
                            Missing Protective Clauses ({detailDoc.analysis.missing_clauses?.length || 0})
                          </h4>
                        </div>
                        {!detailDoc.analysis.missing_clauses || detailDoc.analysis.missing_clauses.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            No standard protective clauses were found missing from this document.
                          </p>
                        ) : (
                          <div className="space-y-3 pt-2">
                            {detailDoc.analysis.missing_clauses.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                                <h5 className="font-semibold text-slate-200 text-xs">{item.title}</h5>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{item.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                      <span className="text-3xl block">⚠️</span>
                      <h4 className="font-semibold text-slate-300 text-sm">No analysis reports generated</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This document has been uploaded but has not been processed through the AI analysis engine.
                      </p>
                      <button
                        onClick={() => {
                          setDetailModalOpen(false);
                          reanalyzeMutation.mutate(detailDoc.id);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Trigger AI Audit
                      </button>
                    </div>
                  )}

                  {/* Section: Detected Clauses List */}
                  {detailDoc.analysis && detailDoc.analysis.items && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-200 text-sm font-display">
                        Flagged Risk Clauses ({detailDoc.analysis.items.length})
                      </h4>
                      <div className="space-y-4">
                        {detailDoc.analysis.items.map((clause: any, index: number) => (
                          <div key={clause.id || index} className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                              <h5 className="font-semibold text-slate-100 text-sm font-display">
                                {index + 1}. {clause.title}
                              </h5>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-400 font-display">
                                  {clause.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-display ${getRiskBadgeStyles(clause.risk_level)}`}>
                                  {clause.risk_level}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                              {/* Original Text */}
                              <div className="md:col-span-1 space-y-1">
                                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Original Text</span>
                                <blockquote className="italic text-slate-450 bg-slate-950/70 border-l-2 border-slate-800 p-2.5 rounded font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                                  "{clause.original_text}"
                                </blockquote>
                              </div>

                              {/* Explanation */}
                              <div className="md:col-span-1 space-y-1">
                                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Explanation</span>
                                <p className="text-slate-350 leading-relaxed">{clause.explanation}</p>
                              </div>

                              {/* Suggestion */}
                              <div className="md:col-span-1 space-y-1">
                                <span className="block text-[10px] text-slate-500 font-semibold uppercase text-green-500">Precaution / Suggestion</span>
                                <p className="text-slate-350 leading-relaxed border-l-2 border-green-800/40 pl-2.5">{clause.suggestion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">ID: {detailDoc?.id}</span>
              <div className="flex items-center gap-2">
                {detailDoc?.analysis && (
                  <>
                    <button
                      onClick={() => handleDownload(detailDoc.id)}
                      disabled={isDownloadingId === detailDoc.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      {isDownloadingId === detailDoc.id ? 'Loading...' : 'Download Report'}
                    </button>
                    <Link
                      to={`/results/${detailDoc.id}`}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Open Full Results Page
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Safety Delete Confirmation Dialog */}
      {deleteModalOpen && docToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-6 animate-zoom-in">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Delete Audit Record?</h3>
                <p className="text-xs text-red-400/80">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase">Document to Delete</p>
              <p className="text-sm font-semibold text-slate-200 break-all">{docToDelete.original_filename}</p>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-850/50">
                <span>Type: {docToDelete.file_type.toUpperCase()}</span>
                <span>Size: {formatBytes(docToDelete.file_size)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Confirming deletion will remove the uploaded file from S3 storage, scrub all OCR database texts, wipe AI audit analyses, and delete the logs entirely.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => { setDeleteModalOpen(false); setDocToDelete(null); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-350 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(docToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bulk Delete Confirmation Dialog */}
      {bulkDeleteModalOpen && selectedIds.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-6 animate-zoom-in">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Delete Multiple Records?</h3>
                <p className="text-xs text-red-400/80">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg text-center space-y-1">
              <p className="text-xs text-slate-400 font-semibold uppercase">Documents Selected</p>
              <p className="text-xl font-bold text-red-400">{selectedIds.length}</p>
              <p className="text-xs text-slate-500">Audit logs and physical files will be deleted.</p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Confirming deletion will remove the selected files, clear all OCR records, and wipe the associated AI legal reports from the database.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => { setBulkDeleteModalOpen(false); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-350 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  bulkDeleteMutation.mutate(selectedIds);
                  setBulkDeleteModalOpen(false);
                }}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Confirm Bulk Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
