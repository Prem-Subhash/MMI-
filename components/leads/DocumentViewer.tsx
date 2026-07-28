'use client'

import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { toast } from '@/lib/toast';

export default function DocumentViewer({ documents }: { documents: any[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!documents || documents.length === 0) return null;

  const handleDownload = async (doc: any) => {
    try {
      setDownloadingId(doc.id);
      
      // 1. Fetch the file via our secure API route
      // The API route /api/documents/[id] handles signed URL generation server-side
      const response = await fetch(`/api/documents/${doc.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      // 2. Convert to blob for reliable cross-origin download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Programmatic download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 4. Cleanup
      window.URL.revokeObjectURL(blobUrl);

      // 5. Success Toast
      toast('Download successful', 'success');

    } catch (err) {
      console.error('Download error:', err);
      toast('Could not download file', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <h3 className="text-lg font-bold text-emerald-800 mb-5 flex items-center gap-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        Uploaded Documents
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc: any) => {
          const viewUrl = `/api/documents/${doc.id}`;
          const isDownloading = downloadingId === doc.id;

          return (
            <div key={doc.id} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4 relative group">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 break-all" title={doc.file_name}>{doc.file_name}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
                
                {/* Hover explicit filename reveal */}
                <div className="absolute hidden group-hover:block z-10 bg-slate-800 text-white text-xs p-2.5 rounded-lg break-words max-w-[200px] top-full left-0 mt-2 shadow-xl whitespace-normal pointer-events-none">
                  {doc.file_name}
                </div>
              </div>
              <div className="flex gap-2">
                  <a 
                    href={viewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-semibold text-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-lg transition-colors w-full inline-block border border-emerald-100"
                  >
                    View
                  </a>
                  <button 
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    className="text-sm font-semibold text-center text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg transition-colors w-full inline-block border border-blue-100 disabled:opacity-50"
                  >
                    {isDownloading ? '...' : 'Download'}
                  </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
