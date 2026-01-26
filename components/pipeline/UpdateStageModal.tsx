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

    switch (config.type) {
      case 'date':
        return (
          <input
            type="date"
            className="w-full border p-2"
            value={value}
            onChange={e =>
              setFormData({ ...formData, [fieldKey]: e.target.value })
            }
          />
        )

      case 'boolean':
        return (
          <select
            className="w-full border p-2"
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
            className="w-full border p-2"
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
            className="w-full border p-2"
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
            className="w-full border p-2"
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
            className="w-full border p-2"
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg space-y-4">
        <h2 className="text-lg font-semibold">Update Status</h2>

        {loading ? (
          <p>Loading stages...</p>
        ) : (
          <select
            className="w-full border p-2"
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
        {Object.entries(mandatoryFields).map(([key, config]) => (
          <div key={key} className="mt-3">
            <label className="block text-sm font-medium mb-1">
              {config.label}
              {config.required && ' *'}
            </label>

            {renderField(key, config)}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
