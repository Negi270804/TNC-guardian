import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';

export const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // Fetch document details
  const { data: doc, isLoading, error } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await apiClient.get<Document>(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

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
    <div className="space-y-8">
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
        <Link
          to="/documents"
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded transition"
        >
          ← Back to Repository
        </Link>
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
                  {doc.processing_status === 'PROCESSING' && <span className="text-yellow-500">Processing</span>}
                  {doc.processing_status === 'FAILED' && <span className="text-red-500">Failed</span>}
                  {doc.processing_status === 'UPLOADED' && <span className="text-slate-400">Not Extracted</span>}
                </span>
              </div>
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

          {/* Quick instructions panel */}
          <section className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Text Extraction Engine</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This system extracts plain-text layouts from documents using selective stream parses, falling back to EasyOCR neural image processing when text characters are unselectable.
            </p>
          </section>
        </div>

        {/* Right column: Extracted text viewer */}
        <div className="lg:col-span-2">
          <section className="p-6 rounded-lg bg-slate-900 border border-slate-800 flex flex-col h-[560px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-200 font-display">Extracted Text Content</h3>
              
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
        </div>
      </div>
    </div>
  );
};
