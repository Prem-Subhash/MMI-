'use client'

import React, { useState, useRef } from 'react'
import {
  DollarSign,
  CheckCircle2,
  Calendar,
  Hash,
  UploadCloud,
  FileCheck2,
  Trash2,
  X
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface CheckReceivedStageUIProps {
  loanId?: string
  borrowerName?: string
  currentStage: number
  onClose?: () => void
  onSave?: (checkData: any) => void
}

export default function CheckReceivedStageUI({
  loanId = 'AL-1004',
  borrowerName = 'Apex Logistics LLC',
  currentStage,
  onClose,
  onSave
}: CheckReceivedStageUIProps) {
  const [checkAmount, setCheckAmount] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [receivedDate, setReceivedDate] = useState('')
  const [depositedDate, setDepositedDate] = useState('')
  const [proofFile, setProofFile] = useState<{ id: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isBank = currentStage === 20
  const stageName = isBank 
    ? '20. Check Received from the Bank'
    : '21. Check Received from Borrower'
  
  const sourceName = isBank ? 'Bank' : 'Borrower'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setProofFile({
        id: Math.random().toString(),
        name: file.name
      })
      toast('Check image uploaded successfully', 'success')
      e.target.value = ''
    }
  }

  const handleSave = () => {
    if (!checkAmount || !checkNumber || !receivedDate) {
      toast('Please fill in amount, check number, and received date.', 'error')
      return
    }

    const checkData = {
      source: sourceName,
      amount: checkAmount,
      check_number: checkNumber,
      received_date: receivedDate,
      deposited_date: depositedDate,
      proof_file: proofFile
    }

    toast(`Saved ${sourceName} check details`, 'success')
    if (onSave) onSave(checkData)
  }

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">
            <DollarSign size={14} />
            <span>Fund Disbursement Phase</span>
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

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Record {sourceName} Check Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Check Amount ($) *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={checkAmount}
                  onChange={e => setCheckAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Check / Wire Number *</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={checkNumber}
                  onChange={e => setCheckNumber(e.target.value)}
                  placeholder="e.g. 1004592"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Received Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Deposited Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={depositedDate}
                    onChange={e => setDepositedDate(e.target.value)}
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase text-gray-700">Proof of Check / Receipt</label>
            {!proofFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer h-[190px] transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <UploadCloud size={28} className="text-emerald-500 mb-3" />
                <p className="text-sm font-bold text-slate-700">Upload Check Image</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG, PDF</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center h-[190px] bg-slate-50 relative">
                <FileCheck2 size={36} className="text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-800 break-all">{proofFile.name}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 bg-emerald-100 px-2 py-0.5 rounded-full">Uploaded Successfully</p>
                <button
                  type="button"
                  onClick={() => setProofFile(null)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <strong className="text-slate-800">Note:</strong> Financial records are stored securely in the database.
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
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>
    </div>
  )
}
