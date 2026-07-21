import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Document } from '@/types';
import { formatDate, formatBytes } from '@/utils';
import { Link } from 'react-router-dom';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg'
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

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
      const response = await apiClient.post<Document>(`/documents/${docId}/extract`);
      return response.data;
    },
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
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
      setErrorToast(`Unsupported file extension '${ext}'. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG.`);
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

      <div>
        <h2 className="text-2xl font-bold text-slate-100 font-display">Document Repository</h2>
        <p className="text-sm text-slate-400 mt-1">Upload files and execute text extraction and OCR engine audits.</p>
      </div>

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
                  : 'border-slate-880 bg-slate-950 hover:border-slate-700'
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
                      <th className="p-3">Type</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Upload Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {documents.map((doc) => {
                      const isProcessing = extractMutation.isPending && extractMutation.variables === doc.id;
                      
                      return (
                        <tr key={doc.id} className="hover:bg-slate-900/40 text-slate-300 transition">
                          <td className="p-3 font-medium text-slate-100 max-w-[180px] truncate">
                            {doc.original_filename}
                          </td>
                          <td className="p-3 text-xs uppercase text-slate-500">{doc.file_type}</td>
                          <td className="p-3 text-xs text-slate-400">{formatBytes(doc.file_size)}</td>
                          <td className="p-3 text-xs text-slate-400">{formatDate(doc.created_at)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              doc.processing_status === 'COMPLETED'
                                ? 'bg-green-950/60 text-green-400 border-green-800/40'
                                : doc.processing_status === 'PROCESSING' || isProcessing
                                ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40 animate-pulse'
                                : doc.processing_status === 'FAILED'
                                ? 'bg-red-950/60 text-red-400 border-red-800/40'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}>
                              {isProcessing ? 'PROCESSING' : doc.processing_status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {/* Extract action button */}
                            {(doc.processing_status === 'UPLOADED' || doc.processing_status === 'FAILED') && (
                              <button
                                onClick={() => extractMutation.mutate(doc.id)}
                                disabled={extractMutation.isPending}
                                className="text-xs text-green-400 hover:text-green-300 px-2 py-1 bg-green-950/20 hover:bg-green-950/40 border border-green-900/20 rounded transition disabled:opacity-50"
                              >
                                {isProcessing ? 'Processing...' : 'Extract'}
                              </button>
                            )}

                            {/* View details page router link */}
                            <Link
                              to={`/documents/${doc.id}`}
                              className="inline-block text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded border border-slate-800 transition"
                            >
                              Details
                            </Link>
                            
                            <button
                              onClick={() => deleteMutation.mutate(doc.id)}
                              disabled={deleteMutation.isPending || isProcessing}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/20 hover:bg-red-950/40 rounded border border-red-900/20 transition"
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
                <span className="text-slate-500">Stored Name:</span>
                <span className="font-mono text-xs max-w-[240px] truncate">{selectedDoc.stored_filename}</span>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Disk Storage Path:</span>
                <span className="font-mono text-[10px] text-slate-400 max-w-[240px] truncate" title={selectedDoc.storage_path}>
                  {selectedDoc.storage_path}
                </span>
              </div>
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
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
