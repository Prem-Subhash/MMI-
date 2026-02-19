'use client'

import { EDUCATION_OPTIONS } from './constants'

type Props = {
  data: {
    name?: string
    education?: string
    profession?: string
  }
  onChange: (value: any) => void
  disabled?: boolean
}

export default function PrimaryApplicantForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  const updateField = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  return (
    <div className="mb-10 border rounded">
      {/* SECTION HEADER — MATCH PDF */}
      <div className="bg-gray-200 px-4 py-2 font-semibold">
        PRIMARY APPLICANT
      </div>

      {/* SECTION BODY */}
      <div className="p-4 space-y-4">
        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Name:
          </label>
          <input
            type="text"
            value={data.name || ''}
            disabled={disabled}
            onChange={e => updateField('name', e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* EDUCATION */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Education:
          </label>
          <select
            value={data.education || ''}
            disabled={disabled}
            onChange={e =>
              updateField('education', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select</option>
            {EDUCATION_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* JOB / PROFESSION */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Job / Profession:
          </label>
          <input
            type="text"
            value={data.profession || ''}
            disabled={disabled}
            onChange={e =>
              updateField('profession', e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>
      </div>
    </div>
  )
}
