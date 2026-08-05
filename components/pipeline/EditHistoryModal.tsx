'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { Spinner } from '@/components/ui/Loading'
import {
  FieldConfig,
  PERSONAL_NEW_BUSINESS_FIELDS,
  PERSONAL_RENEWAL_FIELDS,
  COMMERCIAL_LINES_FIELDS,
  COMMERCIAL_RENEWAL_FIELDS
} from '@/utils/stageFieldsConfig'
import { Modal } from '@/components/ui/Modal'

type Props = {
  historyItem: any
  pipelineType: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditHistoryModal({
  historyItem,
  pipelineType,
  onClose,
  onSuccess
}: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [mandatoryFields, setMandatoryFields] = useState<Record<string, FieldConfig>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (historyItem) {
      // 1. Determine which config map to use
      let configMap = PERSONAL_NEW_BUSINESS_FIELDS
      if (pipelineType === 'CommercialRenewal') {
        configMap = COMMERCIAL_RENEWAL_FIELDS
      } else if (pipelineType === 'Commercial') {
        configMap = COMMERCIAL_LINES_FIELDS
      } else if (pipelineType === 'PersonalRenewal') {
        configMap = PERSONAL_RENEWAL_FIELDS
      }

      const normalizedName = (historyItem.stage_name || '').trim()
      const matchedKey = Object.keys(configMap).find(
        key => key.toLowerCase() === normalizedName.toLowerCase()
      )

      let fields: Record<string, FieldConfig> = {}
      if (matchedKey) {
        fields = configMap[matchedKey]
      } else {
        // Fallback to metadata keys if no config is found for this custom stage
        if (historyItem.stage_metadata) {
          Object.keys(historyItem.stage_metadata).forEach(key => {
            fields[key] = { label: key, type: 'text', required: true }
          })
        }
      }

      setMandatoryFields(fields)

      // 2. Initialize form data with existing metadata
      const initialData = historyItem.stage_metadata ? { ...historyItem.stage_metadata } : {}
      
      // Handle legacy commission records
      if (initialData.expected_commission !== undefined && !initialData.expected_commission_type) {
        initialData.expected_commission_type = 'AMOUNT'
      }

      setFormData(initialData)
    }
  }, [historyItem, pipelineType])

  // Effect for commission calculation
  useEffect(() => {
    if (formData.expected_commission_type === 'PERCENTAGE') {
      const premium = Number(formData.bound_premium || formData.new_premium || 0)
      const percentage = Number(formData.expected_commission_percentage || 0)
      
      const calculatedAmount = Number(((premium * percentage) / 100).toFixed(2))
      
      if (formData.expected_commission !== calculatedAmount) {
        setFormData(prev => ({ ...prev, expected_commission: calculatedAmount }))
      }
    }
  }, [formData.expected_commission_type, formData.expected_commission_percentage, formData.bound_premium, formData.new_premium])

  /* ================= CLIENT VALIDATION ================= */
  function validateClientSide() {
    for (const key in mandatoryFields) {
      const cfg = mandatoryFields[key]
      const value = formData[key]

      if (
        cfg.required &&
        (value === undefined || value === null || value === '')
      ) {
        toast(`Please fill out ${cfg.label}`, 'error')
        return false
      }
    }

    if (formData.expected_commission_type === 'PERCENTAGE' && !Number(formData.bound_premium || formData.new_premium)) {
      toast('Please enter Bound Premium to calculate Commission Percentage', 'error')
      return false
    }

    return true
  }

  async function handleSave() {
    if (!validateClientSide()) return

    setSaving(true)
    try {
      const response = await fetch('/api/update-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId: historyItem.id,
          stageMetadata: formData
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update history')
      }

      toast('History updated successfully', 'success')
      onSuccess()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ================= RENDER FIELD ================= */
  function renderField(fieldKey: string, config: FieldConfig) {
    let value = formData[fieldKey]
    
    // For dropdowns, if the value was saved as boolean previously but config options are 'Yes' / 'No'
    if (config.type === 'dropdown' && typeof value === 'boolean') {
        value = value ? 'Yes' : 'No'
    } else {
        value = value ?? ''
    }

    switch (config.type) {
      case 'text':
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

      case 'date':
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

      case 'commission': {
        const cType = formData.expected_commission_type || 'AMOUNT'
        const premium = Number(formData.bound_premium || formData.new_premium || 0)
        return (
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</label>
              <select
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-gray-700 w-40"
                value={cType}
                onChange={(e) => setFormData({ ...formData, expected_commission_type: e.target.value })}
              >
                <option value="AMOUNT">Dollar ($)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>

            {cType === 'AMOUNT' ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2.5 pl-7 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
                  value={formData.expected_commission ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_commission: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg p-2.5 pr-7 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
                      value={formData.expected_commission_percentage ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expected_commission_percentage: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                  </div>
                  <div className="flex items-center text-gray-400 font-bold">→</div>
                  <div className="relative flex-1 opacity-70">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      disabled
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2.5 pl-7 text-gray-700 cursor-not-allowed font-medium"
                      value={formData.expected_commission ?? 0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" title="Auto-calculated">🔒</span>
                  </div>
                </div>
                {!premium && (
                  <p className="text-xs text-red-500 font-medium animate-pulse">Please enter Bound Premium first to calculate percentage.</p>
                )}
              </div>
            )}
          </div>
        )
      }

      case 'number':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg p-2.5 pl-7 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700"
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
          </div>
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
              onChange={(e) => {
                let val: any = e.target.value
                if (val === 'Yes') val = true
                if (val === 'No') val = false
                setFormData({ ...formData, [fieldKey]: val })
              }}
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

  if (!historyItem) return null

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit History Entry"
      subtitle={historyItem.stage_name}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
            {Object.keys(mandatoryFields).length > 0 ? (
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-5">
                <h3 className="font-semibold text-emerald-800 text-sm uppercase tracking-wide border-b border-emerald-50 pb-2">
                  Update Stage Data
                </h3>
                {Object.entries(mandatoryFields).map(([key, config]) => (
                  <div key={key}>
                    <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                      {config.label}{' '}
                      {config.required && <span className="text-red-500">*</span>}
                    </label>
                    {renderField(key, config)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-6">
                No editable fields found for this stage.
              </div>
            )}
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(mandatoryFields).length === 0}
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform flex items-center justify-center gap-2 h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white md:hover:-translate-y-0.5 shadow-emerald-200 hover:shadow-emerald-300 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {saving ? (
            <>
              <Spinner size={18} />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </Modal>
  )
}
