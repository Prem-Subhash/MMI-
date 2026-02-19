'use client'

import {
  YES_NO_OPTIONS,
  BASEMENT_TYPES,
} from './constants'

type Props = {
  data: any
  onChange: (value: any) => void
  disabled?: boolean
}

export default function HomeInsuranceForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  const updateField = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  return (
    <div className="mb-10 border rounded">
      {/* SECTION HEADER — MATCH PDF */}
      <div className="bg-gray-200 px-4 py-2 font-semibold">
        QUESTIONS FOR HOME INSURANCE QUOTE
      </div>

      {/* SECTION BODY */}
      <div className="p-4 space-y-4">
        {/* CURRENT CARRIER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            What is the name of your current carrier?
          </label>
          <input
            type="text"
            value={data.current_carrier || ''}
            disabled={disabled}
            onChange={e =>
              updateField('current_carrier', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* YEARS WITH CARRIER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            How long have you stayed with your current carrier? (in Years)
          </label>
          <input
            type="number"
            value={data.years_with_carrier || ''}
            disabled={disabled}
            onChange={e =>
              updateField('years_with_carrier', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* CLAIMS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Have you had any claims in the last 5 years?
          </label>
          <select
            value={data.claims_last_5_years || ''}
            disabled={disabled}
            onChange={e =>
              updateField('claims_last_5_years', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select</option>
            {YES_NO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* CLAIM COUNT (CONDITIONAL) */}
        {data.claims_last_5_years === 'yes' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              If yes, then how many?
            </label>
            <input
              type="number"
              value={data.claims_count || ''}
              disabled={disabled}
              onChange={e =>
                updateField('claims_count', e.target.value)
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        )}

        {/* ROOF YEAR */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Which year was the roof last replaced?
          </label>
          <input
            type="number"
            value={data.roof_replaced_year || ''}
            disabled={disabled}
            onChange={e =>
              updateField('roof_replaced_year', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* BASEMENT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Is there a basement?
          </label>
          <select
            value={data.has_basement || ''}
            disabled={disabled}
            onChange={e =>
              updateField('has_basement', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select</option>
            {YES_NO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* BASEMENT TYPE (CONDITIONAL) */}
        {data.has_basement === 'yes' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              If yes, then what type?
            </label>
            <select
              value={data.basement_type || ''}
              disabled={disabled}
              onChange={e =>
                updateField('basement_type', e.target.value)
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select</option>
              {BASEMENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ALARM SYSTEM */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Do you have centralized alarm/security system?
          </label>
          <select
            value={data.has_alarm || ''}
            disabled={disabled}
            onChange={e =>
              updateField('has_alarm', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select</option>
            {YES_NO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ESCROW */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Will the policy be paid by escrow?
          </label>
          <select
            value={data.paid_by_escrow || ''}
            disabled={disabled}
            onChange={e =>
              updateField('paid_by_escrow', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select</option>
            {YES_NO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* MORTGAGE CLAUSE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Please provide your mortgagee clause below (if applicable):
          </label>
          <textarea
            value={data.mortgage_clause || ''}
            disabled={disabled}
            onChange={e =>
              updateField('mortgage_clause', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
