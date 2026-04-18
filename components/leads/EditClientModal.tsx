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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-[#2E5C85]">Edit Client Info</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="space-y-4">
          {/* NAME */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={formData.client_name}
                onChange={e => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Full Name"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all ${!isEmailValid && formData.email ? 'border-red-300 ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
          </div>

          {/* PHONE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number (10 Digits)</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all ${!isPhoneValid && formData.phone ? 'border-red-300 ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="0000000000"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
              ${saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-0.5 shadow-emerald-200 hover:shadow-emerald-300'}
            `}
          >
            {saving ? (
              <>
                <Spinner size={16} />
                Saving...
              </>
            ) : (
              'Save Info'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
