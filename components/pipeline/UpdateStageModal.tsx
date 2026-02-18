'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  leadId: string
  // IMPORTANT: We need pipelineId to know which fields to show
  pipelineId: string
  onClose: () => void
  onSuccess: () => void
}

type FieldConfig = {
  label: string
  type: string
  required?: boolean
  options?: string[]
}

// ==========================================
// PERSONAL LINES FIELDS
// ==========================================
const PERSONAL_LINES_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    ezlynx_updated: { label: 'Have you updated the client’s profile in EZLynx?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Did you quote in multiple carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_setup: { label: 'Is the current policy set up on autopay?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    paid_for_renewal: { label: 'Is the policy paid for the renewal term?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    quote_finalized: { label: 'Have you finalized the quote?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_quote_sent: { label: 'Which carrier quote are you sending?', type: 'text', required: true },
    quoted_premium: { label: 'What is the quoted premium?', type: 'number', required: true },
    savings_amount: { label: 'How much is the client saving by switching?', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'What is the payment method?', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'What is the payment frequency?', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    policy_number: { label: 'New Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Expected Commission', type: 'number', required: true },
    docs_saved_ezlynx: { label: 'Policy documents saved in EZLynx & File Center?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Have you sent the policy documents to client?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_prev_carrier: { label: 'Did you cancel the renewal term in previous carrier?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    cancellation_reason: { label: 'Why did the client cancel the renewal term?', type: 'text', required: true },
    // x_date: { label: 'X-date (Automatically added – 60 days prior)', type: 'date', required: false },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// COMMERCIAL LINES FIELDS
// ==========================================
const COMMERCIAL_LINES_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    target_completion_date: { label: 'Target Completion Date', type: 'date', required: true },
    documents_saved_filecenter: { label: 'Have you saved documents in FileCenter?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    required_documents_received: { label: 'Have you received all required information or documents from client?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Have you finalized the quote?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Which carrier quote are you sending?', type: 'text', required: true },
    quoted_premium: { label: 'What is the quoted premium?', type: 'number', required: true },
    agency_fees: { label: 'Agency Fees', type: 'number', required: true }, // Not explicitly requested in text but needed for consistency
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'What is the payment method?', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'What is the payment frequency?', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed': {
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Expected Commission', type: 'number', required: true },
    agency_fees: { label: 'Agency Fees', type: 'number', required: true },
    policy_docs_saved: { label: 'Policy documents saved in EZLynx & File Center?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Have you sent the policy documents to client?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Did Not Bind': {
    // X-date is auto-calculated, so we don't need a field here for it unless we want to override it. 
    // The requirement says "Automatically added", usually implying backend calc.
    reason_not_bound: { label: 'Reason Not Bound', type: 'text', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}


// ==========================================
// COMMERCIAL RENEWAL FIELDS
// ==========================================
const COMMERCIAL_RENEWAL_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    business_profile_updated_ezlynx: { label: 'Have you updated the business profile in EZLynx?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Did you quote in multiple carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_enabled: { label: 'Is the current policy set up on autopay?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    policy_paid: { label: 'Is the policy paid for the renewal term?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Have you finalized the quote?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Which carrier quote are you sending?', type: 'text', required: true },
    quoted_premium: { label: 'What is the quoted premium?', type: 'number', required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    savings_amount: { label: 'Savings Amount', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'What is the payment method?', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'What is the payment frequency?', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    policy_number: { label: 'New Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Expected Commission', type: 'number', required: true },
    policy_docs_saved: { label: 'Policy documents saved in EZLynx & File Center?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Have you sent the policy documents to client?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_previous_carrier: { label: 'Did you cancel the renewal term in previous carrier?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

export default function UpdateStageModal({
  leadId,
  pipelineId,
  onClose,
  onSuccess,
}: Props) {
  const [stages, setStages] = useState<any[]>([])
  const [selectedStageId, setSelectedStageId] = useState('')
  const [mandatoryFields, setMandatoryFields] =
    useState<Record<string, FieldConfig>>({})
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Identify if we are in Commercial Lines based on pipeline name/category?
  // We can just query pipeline details or check if the stage name matches a key in Commercial Fields.
  // Ideally, we load the pipeline info.
  const [pipelineType, setPipelineType] = useState<'Personal' | 'Commercial' | 'CommercialRenewal' | 'Unknown'>('Unknown')

  /* ================= LOAD STAGES ================= */
  useEffect(() => {
    if (!pipelineId) {
      alert('Pipeline ID missing. Please refresh the page.')
      return
    }
    loadStages()
  }, [pipelineId])

  async function loadStages() {
    setLoading(true)

    // Parallel fetch: Pipeline Details + Stages
    const [pipelineRes, stagesRes] = await Promise.all([
      supabase.from('pipelines').select('name, category').eq('id', pipelineId).single(),
      supabase.from('pipeline_stages').select('*').eq('pipeline_id', pipelineId).order('stage_order')
    ])

    if (pipelineRes.error) {
      console.error('Pipeline fetch error', pipelineRes.error)
    } else {
      const name = pipelineRes.data?.name || ''
      const category = pipelineRes.data?.category || ''

      if (name.includes('Commercial') && name.includes('Renewal')) {
        setPipelineType('CommercialRenewal')
      } else if (name.includes('Commercial') || category.includes('Commercial')) {
        setPipelineType('Commercial')
      } else {
        setPipelineType('Personal')
      }
    }

    if (stagesRes.error) {
      console.error(stagesRes.error)
      alert('Failed to load pipeline stages')
      setLoading(false)
      return
    }

    setStages(stagesRes.data || [])
    setLoading(false)
  }

  /* ================= CLIENT VALIDATION ================= */
  function validateClientSide() {
    for (const key in mandatoryFields) {
      const cfg = mandatoryFields[key]
      const value = formData[key]

      if (
        cfg.required &&
        (value === undefined || value === null || value === '')
      ) {
        alert(`Please fill "${cfg.label}"`)
        return false
      }
    }
    return true
  }

  /* ================= FIELD RENDERER ================= */
  function renderField(fieldKey: string, config: FieldConfig) {
    const value = formData[fieldKey] ?? ''

    switch (config.type) {
      case 'date': {
        // const today = new Date().toISOString().split('T')[0]
        return (
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )
      }

      case 'number':
        return (
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                [fieldKey]:
                  e.target.value === ''
                    ? ''
                    : Number(e.target.value),
              })
            }
          />
        )

      case 'textarea':
        return (
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 resize-y"
            rows={4}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )

      case 'dropdown':
        return (
          <div className="relative">
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 appearance-none bg-white cursor-pointer"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [fieldKey]: e.target.value })
              }
            >
              <option value="">Select</option>
              {config.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )

      default:
        return (
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )
    }
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    if (!selectedStageId) {
      alert('Please select a status')
      return
    }

    if (!validateClientSide()) return

    setSaving(true)

    // 🔍 DEBUG — VERY IMPORTANT
    console.log('SENDING TO API:', {
      leadId,
      stageId: selectedStageId,
      stageMetadata: formData,
    })

    const res = await fetch('/api/update-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        stageId: selectedStageId,
        stageMetadata: {
          ...formData,
          // normalize boolean if ever used
          email_sent:
            formData.email_sent === 'yes'
              ? true
              : formData.email_sent === 'no'
                ? false
                : formData.email_sent,
          // Normalize boolean dropdowns to actual booleans for Commercial logic
          documents_saved_filecenter: formData.documents_saved_filecenter === 'Yes',
          required_documents_received: formData.required_documents_received === 'Yes',
          finalized_quote: formData.finalized_quote === 'Yes',
          policy_docs_saved: formData.policy_docs_saved === 'Yes',
          docs_sent_to_client: formData.docs_sent_to_client === 'Yes'
        },
      }),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      alert(result.error || 'Status update failed')
      console.error(result)
      return
    }

    // Success
    alert('Pipeline stage updated successfully!')
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Update Status</h2>

        {loading ? (
          <div className="py-4 text-center text-gray-500">Loading pipeline stages...</div>
        ) : (
          <div>
            <label className="block text-gray-700 font-medium mb-2">New Status</label>
            <div className="relative">
              <select
                className="w-full border border-emerald-500 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                value={selectedStageId}
                onChange={(e) => {
                  const stageId = e.target.value
                  setSelectedStageId(stageId)

                  const stage = stages.find((s) => s.id === stageId)

                  if (!stage) {
                    setMandatoryFields({})
                    setFormData({})
                    return
                  }

                  // Pick correct config map
                  let configMap = PERSONAL_LINES_FIELDS
                  if (pipelineType === 'CommercialRenewal') {
                    configMap = COMMERCIAL_RENEWAL_FIELDS
                  } else if (pipelineType === 'Commercial') {
                    configMap = COMMERCIAL_LINES_FIELDS
                  }

                  // Normalize name for lookup
                  const normalizedName = stage.stage_name.trim()

                  // Try exact match or match from FIELDS keys
                  // Note: Keys in configMap are Case Sensitive usually, but let's be safe
                  const matchedKey = Object.keys(configMap).find(
                    key => key.toLowerCase() === normalizedName.toLowerCase()
                  )

                  let fields: Record<string, FieldConfig> = {}

                  if (matchedKey) {
                    fields = configMap[matchedKey]
                  } else if (Array.isArray(stage.mandatory_fields)) {
                    // Fallback: Convert DB array to config to prevent empty rendering
                    stage.mandatory_fields.forEach((f: string) => {
                      fields[f] = { label: f, type: 'text', required: true }
                    })
                  } else if (typeof stage.mandatory_fields === 'object' && stage.mandatory_fields !== null) {
                    // If DB already has object config
                    fields = stage.mandatory_fields
                  }

                  setMandatoryFields(fields)
                  setFormData({})
                }}
              >
                <option value="">Select new status</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.stage_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ================= DYNAMIC FIELDS ================= */}
        {Object.entries(mandatoryFields).map(([key, config]) => (
          <div key={key}>
            <label className="block text-gray-700 font-medium mb-1.5">
              {config.label}
              {config.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {renderField(key, config)}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
