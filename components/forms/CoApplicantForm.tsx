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

export default function CoApplicantForm({
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
    <div className="py-14 px-10 bg-transparent group/section transition-colors duration-500 hover:bg-white/30">
      {/* SECTION HEADER */}
      <div className="flex flex-col mb-10">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Co-Applicant
        </h3>
        <p className="text-slate-500 text-sm font-medium">Secondary contact information if applicable.</p>
      </div>

      {/* SECTION BODY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {/* NAME */}
        <div className="md:col-span-2">
          <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
            Full Legal Name
          </label>
          <input
            type="text"
            placeholder="First name & Surname"
            value={data.name || ''}
            disabled={disabled}
            onChange={e => updateField('name', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
          />
        </div>

        {/* EDUCATION */}
        <div className="relative">
          <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
            Education Level
          </label>
          <div className="relative">
            <select
              value={data.education || ''}
              disabled={disabled}
              onChange={e => updateField('education', e.target.value)}
              className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] appearance-none transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold text-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
              <option value="">Select your education</option>
              {EDUCATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* JOB / PROFESSION */}
        <div>
          <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
            Current Profession
          </label>
          <input
            type="text"
            placeholder="e.g. Creative Director"
            value={data.profession || ''}
            disabled={disabled}
            onChange={e => updateField('profession', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
          />
        </div>
      </div>
    </div>
  )
}
