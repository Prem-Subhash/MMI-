'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { User, Phone, Mail, X } from 'lucide-react'

type Props = {
  lead: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditClientModal({ lead, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    client_name: lead.client_name || '',
    email: lead.email || '',
    phone: (lead.phone || '').replace(/\D/g, '').slice(0, 10)
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid = !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  const isPhoneValid = formData.phone.length === 10

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, phone: digits }))
  }

  const handleSave = async () => {
    setError(null)

    if (!formData.client_name.trim()) {
      setError('Client name is required')
      return
    }

    if (formData.email && !isEmailValid) {
      setError('Please enter a valid email address')
      return
    }

    if (!isPhoneValid) {
      setError('Phone number must be exactly 10 digits')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          ...formData
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update client info')
      }

      if (result.message === 'No changes detected') {
        toast('No changes detected', 'info')
      } else {
        toast(result.message || 'Client information updated successfully', 'success')
      }
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="relative overflow-hidden bg-slate-50 px-8 pt-8 pb-6 border-b border-slate-100">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shadow-inner">
                  <User size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black tracking-tight">Edit Client Info</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Update personal details reliably</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {/* FORM FIELDS */}
          <div className="space-y-5">
            {/* NAME */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-black uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                Client Name
              </label>
              <div className="relative group/input">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                  value={formData.client_name}
                  onChange={e => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="Full Name"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-black uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                Email Address
              </label>
              <div className="relative group/input">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                <input 
                  type="email"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-base font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all shadow-sm ${!isEmailValid && formData.email ? 'border-red-300 ring-red-100 bg-red-50/20' : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'}`}
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-black uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                Phone Number
              </label>
              <div className="relative group/input">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" />
                <input 
                  type="text"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-base font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all shadow-sm ${!isPhoneValid && formData.phone ? 'border-red-300 ring-red-100 bg-red-50/20' : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'}`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="000 000 0000"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black hover:bg-slate-50 hover:text-black transition-all active:scale-95 text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-[0_10px_20px_-5px_rgba(16,184,137,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-3
                ${saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(16,184,137,0.5)]'}
              `}
            >
              {saving ? (
                <>
                  <Spinner size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <span>Save Info</span>
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <X size={12} className="rotate-45" />
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
