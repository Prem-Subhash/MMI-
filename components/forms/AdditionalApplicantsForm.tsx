'use client'

import { EDUCATION_OPTIONS } from './constants'

type Applicant = {
  name?: string
  education?: string
  profession?: string
}

type Props = {
  data: Applicant[]
  onChange: (value: Applicant[]) => void
  disabled?: boolean
}

export default function AdditionalApplicantsForm({
  data = [],
  onChange,
  disabled = false,
}: Props) {
  const applicants = data.length ? data : [{}]

  const updateApplicant = (
    index: number,
    field: keyof Applicant,
    value: string
  ) => {
    const updated = [...applicants]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    onChange(updated)
  }

  const addApplicant = () => {
    if (applicants.length >= 5) return
    onChange([...applicants, {}])
  }

  const removeApplicant = (index: number) => {
    const updated = applicants.filter((_, i) => i !== index)
    onChange(updated.length ? updated : [{}])
  }

  return (
    <div className="mb-10 border rounded">
      {/* SECTION HEADER */}
      <div className="bg-gray-200 px-4 py-2 font-semibold">
        ADDITIONAL APPLICANTS
      </div>

      <div className="p-4 space-y-6">
        {applicants.map((applicant, index) => (
          <div
            key={index}
            className="border p-4 rounded space-y-4"
          >
            <div className="font-medium">
              {index + 1})
            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Name:
              </label>
              <input
                type="text"
                value={applicant.name || ''}
                disabled={disabled}
                onChange={e =>
                  updateApplicant(
                    index,
                    'name',
                    e.target.value
                  )
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* EDUCATION */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Education:
              </label>
              <select
                value={applicant.education || ''}
                disabled={disabled}
                onChange={e =>
                  updateApplicant(
                    index,
                    'education',
                    e.target.value
                  )
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
                value={applicant.profession || ''}
                disabled={disabled}
                onChange={e =>
                  updateApplicant(
                    index,
                    'profession',
                    e.target.value
                  )
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {!disabled && (
              <button
                onClick={() => removeApplicant(index)}
                className="text-red-600 text-sm"
              >
                Remove Applicant
              </button>
            )}
          </div>
        ))}

        {!disabled && applicants.length < 5 && (
          <button
            onClick={addApplicant}
            className="text-blue-600 text-sm"
          >
            + Add Another Applicant
          </button>
        )}
      </div>
    </div>
  )
}
