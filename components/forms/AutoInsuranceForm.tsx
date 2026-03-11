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
    <div className="py-8 px-5 md:py-14 md:px-10 bg-transparent group/section transition-colors duration-500 hover:bg-white/30">
      {/* SECTION HEADER */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Auto Insurance Details
        </h3>
        <p className="text-slate-500 text-sm font-medium">Specific details about your vehicle coverage.</p>
      </div>

      {/* SECTION BODY */}
      <div className="space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-10">
          {/* CURRENT CARRIER */}
          <div className="md:col-span-2">
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Current Carrier
            </label>
            <input
              type="text"
              placeholder="e.g. Progressive"
              value={data.current_carrier || ''}
              disabled={disabled}
              onChange={e => updateField('current_carrier', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
            />
          </div>

          {/* DURATION WITH CARRIER */}
          <div className="md:col-span-2">
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Duration with Carrier (in Months)
            </label>
            <input
              type="number"
              placeholder="e.g. 24"
              value={data.months_with_carrier || ''}
              disabled={disabled}
              onChange={e => updateField('months_with_carrier', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-4">
          {/* AUTO CLAIMS */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
                Any auto loss claims in last 5 years?
              </label>
              <div className="relative">
                <select
                  value={data.claims_last_5_years || ''}
                  disabled={disabled}
                  onChange={e => updateField('claims_last_5_years', e.target.value)}
                  className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] appearance-none transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold text-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg"
                >
                  <option value="">Select option</option>
                  {YES_NO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {data.claims_last_5_years === 'yes' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-rose-600 mb-2 ml-2">
                  How many claims?
                </label>
                <input
                  type="number"
                  value={data.claims_count || ''}
                  disabled={disabled}
                  onChange={e => updateField('claims_count', e.target.value)}
                  className="w-full bg-rose-50/50 border-transparent px-6 py-5 rounded-[1.25rem] transition-all focus:bg-white focus:ring-2 focus:ring-rose-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
                />
              </div>
            )}
          </div>

          {/* VIOLATIONS */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
                Any violations in last 5 years?
              </label>
              <div className="relative">
                <select
                  value={data.violations_last_5_years || ''}
                  disabled={disabled}
                  onChange={e => updateField('violations_last_5_years', e.target.value)}
                  className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] appearance-none transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold text-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg"
                >
                  <option value="">Select option</option>
                  {YES_NO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {data.violations_last_5_years === 'yes' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-rose-600 mb-2 ml-2">
                  How many violations?
                </label>
                <input
                  type="number"
                  value={data.violation_count || ''}
                  disabled={disabled}
                  onChange={e => updateField('violation_count', e.target.value)}
                  className="w-full bg-rose-50/50 border-transparent px-6 py-5 rounded-[1.25rem] transition-all focus:bg-white focus:ring-2 focus:ring-rose-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* GOOD DRIVER DISCOUNT */}
        <div className="pt-4 pb-4">
          <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
            Qualify for Good Student or Defensive Driver discount?
          </label>
          <div className="relative">
            <select
              value={data.good_driver_discount || ''}
              disabled={disabled}
              onChange={e => updateField('good_driver_discount', e.target.value)}
              className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] appearance-none transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold text-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
              <option value="">Select option</option>
              {YES_NO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
