'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  leadId: string
  // IMPORTANT: We need pipelineId to know which fields to show
  pipelineId: string
  currentStageId?: string
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
// PERSONAL LINES (NEW BUSINESS) FIELDS
// ==========================================
const PERSONAL_NEW_BUSINESS_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    target_completion_date: { label: 'Target Date', type: 'date', required: true },
    docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    info_received: { label: 'Docs Received?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_quote_sent: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed': {
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'number', required: true },
    docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    policy_docs_sent: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Did Not Bind': {
    // X-date is auto-calculated (60 days prior to Renewal Date) — no manual input needed
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// PERSONAL LINES RENEWAL FIELDS
// ==========================================
const PERSONAL_RENEWAL_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    ezlynx_updated: { label: 'EZLynx Updated?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Quoted Multiple Carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_setup: { label: 'Autopay Setup?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    paid_for_renewal: { label: 'Policy Paid?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    quote_finalized: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_quote_sent: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    savings_amount: { label: 'Savings', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'number', required: true },
    docs_saved_ezlynx: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_prev_carrier: { label: 'Prior Term Cancelled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    cancellation_reason: { label: 'Cancellation Reason', type: 'text', required: true },
    // x_date: { label: 'X-Date', type: 'date', required: false },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// COMMERCIAL LINES FIELDS
// ==========================================
const COMMERCIAL_LINES_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    target_completion_date: { label: 'Target Date', type: 'date', required: true },
    documents_saved_filecenter: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    required_documents_received: { label: 'Docs Received?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    agency_fees: { label: 'Agency Fee', type: 'number', required: true }, // Not explicitly requested in text but needed for consistency
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed': {
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'number', required: true },
    agency_fees: { label: 'Agency Fee', type: 'number', required: true },
    policy_docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
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
    business_profile_updated_ezlynx: { label: 'EZLynx Updated?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Quoted Multiple Carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_enabled: { label: 'Autopay Enabled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    policy_paid: { label: 'Policy Paid?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    savings_amount: { label: 'Savings', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'number', required: true },
    policy_docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_previous_carrier: { label: 'Prior Term Cancelled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

export default function UpdateStageModal({
  leadId,
  pipelineId,
  currentStageId,
  onClose,
  onSuccess,
}: Props) {
  const [stages, setStages] = useState<any[]>([])
  const [selectedStageId, setSelectedStageId] = useState(currentStageId || '')
  const [mandatoryFields, setMandatoryFields] =
    useState<Record<string, FieldConfig>>({})
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Identify if we are in Commercial Lines based on pipeline name/category?
  // We can just query pipeline details or check if the stage name matches a key in Commercial Fields.
  // Ideally, we load the pipeline info.
  const [pipelineType, setPipelineType] = useState<'PersonalNewBusiness' | 'PersonalRenewal' | 'Commercial' | 'CommercialRenewal' | 'Unknown'>('Unknown')

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
      } else if (name.includes('Renewal')) {
        setPipelineType('PersonalRenewal')
      } else {
        setPipelineType('PersonalNewBusiness')
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

    // Automatically load fields if we have a currentStageId
    if (currentStageId && stagesRes.data) {
      const stage = stagesRes.data.find((s: any) => s.id === currentStageId)
      if (stage) {
        // This is a bit of a hack—we need the pipelineType which is set async.
        // But pipelineType is derived from pipelineRes which we just got.
        const name = pipelineRes.data?.name || ''
        const category = pipelineRes.data?.category || ''
        let pType = 'PersonalNewBusiness'
        if (name.includes('Commercial') && name.includes('Renewal')) pType = 'CommercialRenewal'
        else if (name.includes('Commercial') || category.includes('Commercial')) pType = 'Commercial'
        else if (name.includes('Renewal')) pType = 'PersonalRenewal'

        updateMandatoryFields(stage, pType)
      }
    }
  }

  function updateMandatoryFields(stage: any, pType: string) {
    // Pick correct config map
    let configMap = PERSONAL_NEW_BUSINESS_FIELDS
    if (pType === 'CommercialRenewal') {
      configMap = COMMERCIAL_RENEWAL_FIELDS
    } else if (pType === 'Commercial') {
      configMap = COMMERCIAL_LINES_FIELDS
    } else if (pType === 'PersonalRenewal') {
      configMap = PERSONAL_RENEWAL_FIELDS
    }

    // Normalize name for lookup
    const normalizedName = stage.stage_name.trim()

    // Try exact match or match from FIELDS keys
    const matchedKey = Object.keys(configMap).find(
      key => key.toLowerCase() === normalizedName.toLowerCase()
    )

    let fields: Record<string, FieldConfig> = {}

    if (matchedKey) {
      fields = configMap[matchedKey]
    } else if (Array.isArray(stage.mandatory_fields)) {
      stage.mandatory_fields.forEach((f: string) => {
        fields[f] = { label: f, type: 'text', required: true }
      })
    } else if (typeof stage.mandatory_fields === 'object' && stage.mandatory_fields !== null) {
      fields = stage.mandatory_fields
    }

    setMandatoryFields(fields)
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

    const inputClass = "w-full border border-gray-200 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"

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
          docs_sent_to_client: formData.docs_sent_to_client === 'Yes',
          // Normalizing new booleans for Personal New Business logic
          docs_saved: formData.docs_saved === 'Yes',
          info_received: formData.info_received === 'Yes',
          policy_docs_sent: formData.policy_docs_sent === 'Yes'
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

  // Check if any Yes/No field is selected as 'No'
  const isBlockedByNo = Object.entries(mandatoryFields).some(([key, config]) => {
    return (
      config.type === 'dropdown' &&
      config.options?.includes('Yes') &&
      config.options?.includes('No') &&
      formData[key] === 'No'
    )
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-[#2E5C85]">Update Status</h2>
          <button onClick={onClose} className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-medium">Loading pipeline stages...</p>
          </div>
        ) : (
          <div>
            <label className="block text-emerald-700 font-bold mb-2 text-sm uppercase tracking-wide">Select New Status</label>
            <div className="relative">
              <select
                className="w-full border-2 border-emerald-500 rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-gray-900 font-bold appearance-none bg-white cursor-pointer transition-all shadow-sm"
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

                  updateMandatoryFields(stage, pipelineType)
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
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ================= DYNAMIC FIELDS ================= */}
        <div className="space-y-5">
          {Object.entries(mandatoryFields).map(([key, config]) => {
            const isNo = config.type === 'dropdown' &&
              config.options?.includes('Yes') &&
              config.options?.includes('No') &&
              formData[key] === 'No';

            // Field-specific error messages for every Yes/No field across all pipeline types
            const FIELD_ERROR_MESSAGES: Record<string, string> = {
              // Personal New Business — Quoting in Progress
              docs_saved:                    "Please save all client documents in FileCenter before moving to the next stage.",
              info_received:                 "Please collect all required information and documents from the client before proceeding.",
              // Personal New Business / All pipelines — Quote Has Been Emailed
              finalized_quote:               "Please finalize the quote before moving to the next stage.",
              quote_finalized:               "Please finalize the quote before moving to the next stage.",
              // Personal New Business / All pipelines — Completed
              policy_docs_sent:              "Please send the policy documents to the client before proceeding.",
              docs_sent_to_client:           "Please send the policy documents to the client before proceeding.",
              // Personal New Business / Commercial — Completed
              docs_saved_ezlynx:             "Please save the policy documents in EZLynx & File Center before proceeding.",
              policy_docs_saved:             "Please save the policy documents in EZLynx & File Center before proceeding.",
              // Personal Renewal / Commercial Renewal — Quoting in Progress
              ezlynx_updated:                "Please update the client's profile in EZLynx before moving to the next stage.",
              business_profile_updated_ezlynx: "Please update the business profile in EZLynx before moving to the next stage.",
              // Personal Renewal / Commercial Renewal — Same Declaration Emailed
              quoted_multiple_carriers:      "Please quote in multiple carriers before moving to the next stage.",
              autopay_setup:                 "Please ensure the current policy is set up on autopay before proceeding.",
              autopay_enabled:               "Please ensure the current policy is set up on autopay before proceeding.",
              // Personal Renewal / Commercial Renewal — Completed (Same)
              paid_for_renewal:              "Please ensure the policy is paid for the renewal term before proceeding.",
              policy_paid:                   "Please ensure the policy is paid for the renewal term before proceeding.",
              // Personal Renewal / Commercial Renewal — Completed (Switch)
              cancelled_prev_carrier:        "Please cancel the renewal term with the previous carrier before proceeding.",
              cancelled_previous_carrier:    "Please cancel the renewal term with the previous carrier before proceeding.",
              // Commercial — Quoting in Progress
              documents_saved_filecenter:    "Please save all documents in FileCenter before moving to the next stage.",
              required_documents_received:   "Please collect all required information and documents from the client before proceeding.",
            }
            const errorText = FIELD_ERROR_MESSAGES[key] ?? `Please complete "${config.label}" before moving to the next stage.`

            return (
              <div key={key} className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  {config.label}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className={isNo ? 'ring-2 ring-red-500 rounded-xl transition-all' : ''}>
                  {renderField(key, config)}
                </div>
                {isNo && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs font-bold leading-tight">
                      {errorText}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isBlockedByNo}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
              ${saving || isBlockedByNo
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-0.5 shadow-emerald-200 hover:shadow-emerald-300'
              }
            `}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Status'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
