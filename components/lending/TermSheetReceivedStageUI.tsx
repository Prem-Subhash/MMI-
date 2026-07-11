'use client'

import React, { useState, useRef } from 'react'
import {
  Building2,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  Search,
  Check,
  AlertCircle,
  Landmark,
  DollarSign,
  Percent,
  Calendar,
  FileUp,
  Download,
  Eye,
  ChevronDown
} from 'lucide-react'
import { toast } from '@/lib/toast'

export interface TermSheetDoc {
  id: string
  fileName: string
  fileSize: string
  uploadedAt: string
  status: 'Received' | 'In Review' | 'Accepted'
  termAmount?: string
  interestRate?: string
  termMonths?: string
}

const AVAILABLE_BANKS = [
  'American Commercial Bank & Trust',
  'Byline Bank',
  'Celtic Bank',
  'Center Stone SBA Lending',
  'First Financial Bank',
  'Harvest Bank',
  'LakeSide Bank',
  'Merchants Bank',
  'US Bank',
  'First Midwest Commercial',
  'BMO Harris Commercial Lending',
  'Chase Business Banking'
]

interface TermSheetReceivedStageUIProps {
  loanId?: string
  borrowerName?: string
  loanAmount?: string
  loanType?: string
  initialSelectedBanks?: string[]
  onClose?: () => void
  onSave?: (selectedBanks: string[], documents: Record<string, TermSheetDoc[]>) => void
}

export default function TermSheetReceivedStageUI({
  loanId = 'AL-1004',
  borrowerName = 'Apex Logistics LLC',
  loanAmount = '$1,450,000',
  loanType = 'SBA 7a',
  initialSelectedBanks = [],
  onClose,
  onSave
}: TermSheetReceivedStageUIProps) {
  const [selectedBanks, setSelectedBanks] = useState<string[]>(initialSelectedBanks)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dragOverBank, setDragOverBank] = useState<string | null>(null)

  // Document state per bank - empty by default per requirement
  const [bankDocuments, setBankDocuments] = useState<Record<string, TermSheetDoc[]>>({})

  // File input refs map
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const filteredBanks = AVAILABLE_BANKS.filter((b) =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleBankSelection = (bank: string) => {
    if (selectedBanks.includes(bank)) {
      setSelectedBanks(selectedBanks.filter((item) => item !== bank))
      toast(`Removed ${bank} upload section`, 'info')
    } else {
      setSelectedBanks([...selectedBanks, bank])
      if (!bankDocuments[bank]) {
        setBankDocuments((prev) => ({ ...prev, [bank]: [] }))
      }
      toast(`Added ${bank} upload section`, 'success')
    }
  }

  const removeBank = (bank: string) => {
    setSelectedBanks((prev) => prev.filter((item) => item !== bank))
    toast(`Removed ${bank} and its upload section`, 'info')
  }

  const selectAllBanks = () => {
    setSelectedBanks([...AVAILABLE_BANKS])
    const newDocs = { ...bankDocuments }
    AVAILABLE_BANKS.forEach((b) => {
      if (!newDocs[b]) newDocs[b] = []
    })
    setBankDocuments(newDocs)
    toast('Selected all commercial lending banks', 'info')
  }

  const clearAllBanks = () => {
    setSelectedBanks([])
    toast('Cleared all selected banks', 'info')
  }

  // Handle simulated upload
  const handleFileUpload = (bankName: string, files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const newDocsList: TermSheetDoc[] = fileArray.map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: 'Just now',
      status: 'Received',
      termAmount: loanAmount,
      interestRate: '10.50% Est.',
      termMonths: '300 mos'
    }))

    setBankDocuments((prev) => ({
      ...prev,
      [bankName]: [...(prev[bankName] || []), ...newDocsList]
    }))

    toast(
      `Uploaded ${fileArray.length} term sheet document(s) for ${bankName}`,
      'success'
    )
  }

  const handleRemoveDocument = (bankName: string, docId: string) => {
    setBankDocuments((prev) => ({
      ...prev,
      [bankName]: (prev[bankName] || []).filter((doc) => doc.id !== docId)
    }))
    toast('Removed term sheet document', 'info')
  }

  const totalDocumentsUploaded = selectedBanks.reduce(
    (sum, bank) => sum + (bankDocuments[bank]?.length || 0),
    0
  )

  const banksWithUploadsCount = selectedBanks.filter(
    (bank) => (bankDocuments[bank]?.length || 0) > 0
  ).length

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
            <Building2 size={14} />
            <span>Accurate Lending Pipeline Stage UI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Stage 5: Term Sheet Received (Multi-Bank Manager)
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-2xl">
            Simultaneously assign multiple lender banks and dynamically manage individual term sheet document upload sections for each selected institution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <div>
            <span className="text-white/70 block uppercase text-[10px] font-bold">Borrower File</span>
            <span className="font-extrabold text-white">{borrowerName} ({loanId})</span>
          </div>
          <div className="h-6 w-px bg-white/20 mx-1" />
          <div>
            <span className="text-white/70 block uppercase text-[10px] font-bold">Requested Loan</span>
            <span className="font-extrabold text-white">{loanAmount} • {loanType}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Lender Banks</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{selectedBanks.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-[#10B889] rounded-xl border border-emerald-100">
            <Landmark size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Banks With Term Sheets</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {banksWithUploadsCount} <span className="text-xs font-semibold text-slate-400">/ {selectedBanks.length}</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Uploaded Documents</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalDocumentsUploaded}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* MULTI-SELECT BANK COMPONENT (REPLACED SINGLE BANK SELECTION) */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B889]" />
              <h3 className="text-base font-extrabold text-slate-900">
                Multi-Select Bank Assignment
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select multiple banks simultaneously. An individual term sheet upload card is dynamically generated below for every selected bank.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={selectAllBanks}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              Select All ({AVAILABLE_BANKS.length})
            </button>
            <button
              type="button"
              onClick={clearAllBanks}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Interactive Multi-Select Dropdown Button & Drawer */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-white border-2 border-gray-200 hover:border-[#10B889] rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <Landmark size={18} className="text-[#10B889]" />
              <span className="text-sm font-extrabold text-slate-800">
                {selectedBanks.length === 0
                  ? 'Click to select participating banks...'
                  : `${selectedBanks.length} Bank(s) Selected for Term Sheet Intake`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#10B889] text-white">
                {selectedBanks.length} Selected
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-[#10B889]' : ''
                }`}
              />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bank name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B889]"
                />
              </div>

              <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                {filteredBanks.map((bank) => {
                  const isChecked = selectedBanks.includes(bank)
                  return (
                    <div
                      key={bank}
                      onClick={() => toggleBankSelection(bank)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/70 border-[#10B889] text-slate-900 font-bold'
                          : 'bg-white border-gray-200/80 hover:bg-gray-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            isChecked
                              ? 'bg-[#10B889] border-[#10B889] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="text-xs truncate">{bank}</span>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Selected
                        </span>
                      )}
                    </div>
                  )
                })}
                {filteredBanks.length === 0 && (
                  <p className="col-span-2 text-center text-xs text-gray-400 py-6">
                    No banks found matching &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedBanks.length} of {AVAILABLE_BANKS.length} banks currently selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-lg shadow-2xs transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Bank Chips / Pills Container */}
        <div className="pt-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Active Participating Banks ({selectedBanks.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedBanks.map((bank) => (
              <div
                key={bank}
                className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-950 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs group hover:border-[#10B889] transition-all"
              >
                <Landmark size={14} className="text-[#10B889]" />
                <span>{bank}</span>
                <button
                  type="button"
                  onClick={() => removeBank(bank)}
                  className="text-emerald-700 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors"
                  title="Remove Bank"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {selectedBanks.length === 0 && (
              <div className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50">
                <AlertCircle size={24} className="mb-1 text-gray-400" />
                <p className="text-xs font-semibold">No banks selected</p>
                <p className="text-[11px] text-gray-400">
                  Use the multi-select dropdown above to choose participating lending banks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMICALLY GENERATED DOCUMENT UPLOAD SECTIONS FOR EVERY SELECTED BANK */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Dynamic Bank Document Upload Sections</span>
            <span className="bg-[#10B889] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {selectedBanks.length} {selectedBanks.length === 1 ? 'Bank' : 'Banks'}
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Each section corresponds dynamically to an active selected bank
          </span>
        </div>

        {selectedBanks.map((bankName) => {
          const docs = bankDocuments[bankName] || []
          const isDragging = dragOverBank === bankName

          return (
            <div
              key={bankName}
              className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300"
            >
              {/* Bank Header Card */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10B889]/10 text-[#10B889] flex items-center justify-center font-bold shrink-0 border border-[#10B889]/20">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                        {bankName}
                      </h4>
                      {docs.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>{docs.length} File(s) Uploaded</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span>Awaiting Upload</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Commercial term sheet, underwriting notes, and letter of interest attachments.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[bankName]?.click()}
                    className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <UploadCloud size={15} />
                    <span>Upload Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBank(bankName)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    title="Remove Bank & Section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Upload Drag & Drop Area */}
              <div className="p-5 space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverBank(bankName)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setDragOverBank(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverBank(null)
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(bankName, e.dataTransfer.files)
                    }
                  }}
                  onClick={() => fileInputRefs.current[bankName]?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#10B889] bg-emerald-50/60 scale-[0.99]'
                      : 'border-gray-200 hover:border-[#10B889]/60 hover:bg-gray-50/80'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    ref={(el) => {
                      fileInputRefs.current[bankName] = el
                    }}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(bankName, e.target.files)
                        e.target.value = ''
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#10B889] flex items-center justify-center">
                      <FileUp size={22} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Drag &amp; drop term sheet files here, or{' '}
                      <span className="text-[#10B889] underline font-extrabold">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supported formats: PDF, DOCX, XLSX (max 25 MB per file)
                    </p>
                  </div>
                </div>

                {/* Uploaded Files Placeholder List */}
                {docs.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Uploaded Files &amp; Term Preview ({docs.length})
                    </p>
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-slate-50 border border-gray-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-red-500 shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-slate-900 text-sm truncate">
                                {doc.fileName}
                              </p>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {doc.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span>Size: <strong className="text-slate-700">{doc.fileSize}</strong></span>
                              <span>•</span>
                              <span>Uploaded: <strong className="text-slate-700">{doc.uploadedAt}</strong></span>
                            </div>

                            {/* Optional quick terms preview tag */}
                            {doc.termAmount && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                                <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
                                  <DollarSign size={12} className="text-[#10B889]" />
                                  <span>{doc.termAmount}</span>
                                </span>
                                {doc.interestRate && (
                                  <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
                                    <Percent size={12} className="text-blue-600" />
                                    <span>{doc.interestRate}</span>
                                  </span>
                                )}
                                {doc.termMonths && (
                                  <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
                                    <Calendar size={12} className="text-purple-600" />
                                    <span>{doc.termMonths}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => toast(`Previewing ${doc.fileName}`, 'info')}
                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(bankName, doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete File"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 px-3 bg-slate-50/50 border border-dashed border-gray-200 rounded-xl flex items-center justify-between text-xs text-slate-400">
                    <span>No term sheet files uploaded for this bank yet.</span>
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[bankName]?.click()}
                      className="font-bold text-[#10B889] hover:underline"
                    >
                      + Browse File
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {selectedBanks.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
              <Landmark size={28} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">
              No banks selected yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No term sheet documents available. Use the multi-select bank dropdown above to select participating institutions and begin document intake.
            </p>
          </div>
        )}
      </div>

      {/* Footer Action Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <strong className="text-slate-800">Frontend Prototype Mode:</strong> Document list and bank selections are stored in active React state.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              toast('Saved Term Sheet Received stage selections!', 'success')
              if (onSave) onSave(selectedBanks, bankDocuments)
              if (onClose) onClose()
            }}
            className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Save Term Sheet Stage</span>
          </button>
        </div>
      </div>
    </div>
  )
}
