'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { User, Phone, Mail, X, Briefcase, Shield } from 'lucide-react'
import { PERSONAL_POLICY_TYPES, COMMERCIAL_POLICY_TYPES } from '@/constants/policyTypes'
import { formatPhoneInput, formatDatabasePhone, PHONE_REGEX } from '@/utils/phoneFormatter'
import { Modal } from '@/components/ui/Modal'

type UpdatedClientFields = {
  client_name: string
  email: string
  phone: string
  business_name?: string
  selectedPolicies?: string[]
}

type Props = {
  lead: any
  onClose: () => void
  onSuccess: (updated?: UpdatedClientFields) => void
}

export default function EditClientModal({ lead, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    client_name: lead.client_name || '',
    email: lead.email || '',
    phone: formatDatabasePhone(lead.phone),
    business_name: lead.business_name || ''
  })
  
  const initialPolicies = lead.lead_policies?.length > 0 
    ? lead.lead_policies.map((p: any) => p.policy_type) 
    : lead.policy_type ? [lead.policy_type] : []
    
  const defaultPolicy = initialPolicies[0] || (lead.insurence_category === 'commercial' ? 'bop' : 'home')
  const [selectedPolicy, setSelectedPolicy] = useState<string>(defaultPolicy)

  const baseOptions = lead.insurence_category === 'commercial' 
    ? COMMERCIAL_POLICY_TYPES
    : PERSONAL_POLICY_TYPES

  const optionsList = [...baseOptions]
  if (defaultPolicy && !baseOptions.some(o => o.value.toLowerCase() === defaultPolicy.toLowerCase())) {
    optionsList.unshift({ value: defaultPolicy, label: defaultPolicy })
  }

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid = !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  const isPhoneValid = PHONE_REGEX.test(formData.phone)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))
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
      setError('Enter a valid 10-digit mobile number')
      return
    }

    if (!selectedPolicy) {
      setError('Please select a policy type')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          ...formData,
          selectedPolicies: [selectedPolicy]
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

      // Pass the saved values back so the parent can update immediately
      onSuccess({
        client_name: formData.client_name,
        email: formData.email,
        phone: formData.phone,
        business_name: formData.business_name,
        selectedPolicies: [selectedPolicy],
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Client Info"
      subtitle="Update personal details reliably"
      icon={<User size={24} strokeWidth={2.5} />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
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

            {/* BUSINESS NAME (Commercial Lines only) */}
            {lead.insurence_category === 'commercial' && (
              <div className="space-y-2 group">
                <label className="text-[11px] font-black text-black uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Business Name
                </label>
                <div className="relative group/input">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                    value={formData.business_name}
                    onChange={e => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Business Name"
                  />
                </div>
              </div>
            )}

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
                  maxLength={14}
                />
              </div>
            </div>

            {/* POLICIES (SINGLE SELECT) */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-black uppercase tracking-[0.1em] ml-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                Policy Type
              </label>
              <div className="relative group/input">
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-amber-600 transition-colors pointer-events-none" />
                <select
                  value={selectedPolicy}
                  onChange={e => setSelectedPolicy(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-black focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                >
                  {optionsList.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>

      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 text-sm uppercase tracking-wider h-[46px]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full sm:w-auto px-10 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-[0_10px_20px_-5px_rgba(16,184,137,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-3 h-[46px]
            ${saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(16,184,137,0.5)]'}
          `}
        >
          {saving ? (
            <>
              <Spinner size={18} />
              Saving...
            </>
          ) : (
            'Save Info'
          )}
        </button>
      </div>
    </Modal>
  )
}
