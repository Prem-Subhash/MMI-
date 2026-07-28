'use client'

import React, { useState, useRef } from 'react'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  FileUp,
  X
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface UWDocumentsStageUIProps {
  loanId?: string
  borrowerName?: string
  currentStage: number
  onClose?: () => void
  onSave?: (notes: string, uploadedFiles: any[]) => void
}

export default function UWDocumentsStageUI({
  loanId = 'AL-1004',
  borrowerName = 'Apex Logistics LLC',
  currentStage,
  onClose,
  onSave
}: UWDocumentsStageUIProps) {
  const [requestedNotes, setRequestedNotes] = useState('')
  const [files, setFiles] = useState<{ id: string; name: string; size: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const stageName = currentStage === 11 
    ? '11. UW Document \u2013 Requested'
    : currentStage === 12
    ? '12. Which Documents were Requested? (Notes)'
    : '13. UW Document \u2013 Received'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`
      }))
      setFiles(prev => [...prev, ...newFiles])
      toast(`Uploaded ${newFiles.length} document(s)`, 'success')
      e.target.value = ''
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    toast('Document removed', 'info')
  }

  const handleSave = () => {
    toast(`Saved UW Documents data for ${stageName}`, 'success')
    if (onSave) onSave(requestedNotes, files)
  }

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      <div className="bg-gradient-to-r from-[#2E5C85] to-[#10B889] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
            <FileText size={14} />
            <span>Underwriting Phase</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {stageName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <div>
            <span className="text-white/70 block uppercase text-[10px] font-bold">Borrower File</span>
            <span className="font-extrabold text-white">{borrowerName} ({loanId})</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 mb-2">
          Requested Documents Notes
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Specify which documents were requested from the borrower or underwriter.
        </p>
        <textarea
          rows={4}
          value={requestedNotes}
          onChange={e => setRequestedNotes(e.target.value)}
          placeholder="e.g. 3 years tax returns, P&L statement, balance sheet..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5C85]"
        />
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 mb-2">
          Received Documents Upload
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload the documents received for underwriting.
        </p>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-[#10B889] hover:bg-emerald-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
            <FileUp size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">Click or drag files here to upload</p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX (max 25MB)</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-extrabold text-slate-500 uppercase">Uploaded Files ({files.length})</p>
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-[#2E5C85]" size={18} />
                  <div>
                    <p className="text-sm font-bold">{f.name}</p>
                    <p className="text-[10px] text-gray-500">{f.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(f.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <strong className="text-slate-800">Note:</strong> Information will be logged in stage history.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#2E5C85] hover:bg-[#20415e] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Save Documents Stage</span>
          </button>
        </div>
      </div>
    </div>
  )
}
