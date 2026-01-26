'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  leadId: string
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

    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('stage_order')

    if (error) {
      console.error(error)
      alert('Failed to load pipeline stages')
      setLoading(false)
      return
    }

    setStages(data || [])
    setLoading(false)
  }

  /* ================= SAFE CLIENT-SIDE VALIDATION ================= */
  function validateClientSide() {
    for (const key in mandatoryFields) {
      const cfg = mandatoryFields[key]
      const value = formData[key]

      if (
        cfg.required &&
        (value === undefined ||
          value === null ||
          value === '')
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
      case 'date':
        return (
          <input
            type="date"
            className={inputClass}
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )

      case 'boolean':
        return (
          <select
            className={inputClass}
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        )

      case 'dropdown':
        return (
          <select
            className={inputClass}
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          >
            <option value="">Select</option>
            {config.options?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            className={inputClass}
            value={value}
            onChange={e =>
              setFormData({
                ...formData,
                [fieldKey]: e.target.value === ''
                  ? ''
                  : Number(e.target.value),
              })
            }
          />
        )

      case 'textarea':
        return (
          <textarea
            className={inputClass}
            rows={3}
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )

      default:
        return (
          <input
            type="text"
            className={inputClass}
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )
    }
  }

  /* ================= SAVE (BACKEND IS FINAL AUTHORITY) ================= */
  async function handleSave() {
    if (!selectedStageId) {
      alert('Please select a status')
      return
    }

    if (!validateClientSide()) return

    setSaving(true)

    const res = await fetch('/api/update-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        stageId: selectedStageId,
        formData,
      }),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      alert(result.error || 'Status update validation failed')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-xl shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Update Status</h2>

        {loading ? (
          <p className="text-gray-500">Loading stages...</p>
        ) : (
          <select
            className="w-full border border-gray-200 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
            value={selectedStageId}
            onChange={(e) => {
              const stageId = e.target.value
              setSelectedStageId(stageId)

              const stage = stages.find(s => s.id === stageId)

              setMandatoryFields(stage?.mandatory_fields || {})
              setFormData({})
            }}
          >
            <option value="">Select new status</option>
            {stages.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.stage_name}
              </option>
            ))}
          </select>
        )}

        {/* ================= DYNAMIC FIELDS ================= */}
        {Object.entries(mandatoryFields).length > 0 && (
          <div className="space-y-4 mt-4">
            {Object.entries(mandatoryFields)
              .sort(([, a], [, b]) => {
                const isNotesA = a.label.toLowerCase().includes('notes')
                const isNotesB = b.label.toLowerCase().includes('notes')
                if (isNotesA && !isNotesB) return 1
                if (!isNotesA && isNotesB) return -1
                return 0
              })
              .map(([key, config]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {config.label}
                  </label>

                  {renderField(key, config)}
                </div>
              ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
