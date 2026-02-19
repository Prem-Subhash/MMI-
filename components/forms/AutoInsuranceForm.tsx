'use client'

import { YES_NO_OPTIONS } from './constants'

type Props = {
  data: any
  onChange: (value: any) => void
  disabled?: boolean
}

export default function AutoInsuranceForm({
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
        QUESTIONS FOR AUTO INSURANCE QUOTE
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

        {/* MONTHS WITH CARRIER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            How long have you stayed with your current carrier? (in Months)
          </label>
          <input
            type="number"
            value={data.months_with_carrier || ''}
            disabled={disabled}
            onChange={e =>
              updateField('months_with_carrier', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* AUTO CLAIMS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Have you had any auto loss claims in the last 5 years?
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

        {/* VIOLATIONS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Have you had any driving violations in the last 5 years?
          </label>
          <select
            value={data.violations_last_5_years || ''}
            disabled={disabled}
            onChange={e =>
              updateField(
                'violations_last_5_years',
                e.target.value
              )
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

        {/* VIOLATION COUNT (CONDITIONAL) */}
        {data.violations_last_5_years === 'yes' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              If yes, then how many?
            </label>
            <input
              type="number"
              value={data.violation_count || ''}
              disabled={disabled}
              onChange={e =>
                updateField('violation_count', e.target.value)
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        )}

        {/* GOOD DRIVER DISCOUNT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Does any driver qualify for Good Student or Defensive Driver discount?
          </label>
          <select
            value={data.good_driver_discount || ''}
            disabled={disabled}
            onChange={e =>
              updateField(
                'good_driver_discount',
                e.target.value
              )
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
      </div>
    </div>
  )
}
