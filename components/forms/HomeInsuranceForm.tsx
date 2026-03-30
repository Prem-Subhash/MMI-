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
    <div className="py-8 px-5 md:py-14 md:px-10 bg-transparent group/section transition-colors duration-500 hover:bg-white/30">
      {/* SECTION HEADER */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Home Insurance Details
        </h3>
        <p className="text-slate-500 text-sm font-medium">Specific details about your property coverage.</p>
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
              placeholder="e.g. State Farm"
              value={data.current_carrier || ''}
              disabled={disabled}
              onChange={e => updateField('current_carrier', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
            />
          </div>

          {/* YEARS WITH CARRIER */}
          <div>
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Years with Carrier
            </label>
            <input
              type="number"
              placeholder="0"
              value={data.years_with_carrier || ''}
              disabled={disabled}
              onChange={e => updateField('years_with_carrier', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
            />
          </div>

          {/* ROOF YEAR */}
          <div>
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Roof Replacement Year
            </label>
            <input
              type="number"
              placeholder="e.g. 2018"
              value={data.roof_replaced_year || ''}
              disabled={disabled}
              onChange={e => updateField('roof_replaced_year', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-4">
          {/* CLAIMS */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
                Claims (Last 5 Years)
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
                  Number of Claims
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

          {/* BASEMENT */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
                Has Basement?
              </label>
              <div className="relative">
                <select
                  value={data.has_basement || ''}
                  disabled={disabled}
                  onChange={e => updateField('has_basement', e.target.value)}
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

            {data.has_basement === 'yes' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-900 mb-2 ml-2">
                  Basement Type
                </label>
                <div className="relative">
                  <select
                    value={data.basement_type || ''}
                    disabled={disabled}
                    onChange={e => updateField('basement_type', e.target.value)}
                   className="w-full bg-[#f0f2f5] border-transparent px-5 py-4 md:px-6 md:py-5 rounded-[1rem] md:rounded-[1.25rem] appearance-none transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold text-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-base md:text-lg"
                  >
                    <option value="">Select type</option>
                    {BASEMENT_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-4">
          {/* ALARM SYSTEM */}
          <div className="relative">
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Centralized Alarm/Security?
            </label>
            <div className="relative">
              <select
                value={data.has_alarm || ''}
                disabled={disabled}
                onChange={e => updateField('has_alarm', e.target.value)}
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

          {/* ESCROW */}
          <div className="relative">
            <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
              Paid by Escrow?
            </label>
            <div className="relative">
              <select
                value={data.paid_by_escrow || ''}
                disabled={disabled}
                onChange={e => updateField('paid_by_escrow', e.target.value)}
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

        {/* MORTGAGE CLAUSE */}
        <div className="pt-4">
          <label className="block text-[0.95rem] font-bold text-slate-900 mb-3 ml-1">
            Mortgagee Clause
          </label>
          <textarea
            placeholder="Details of your mortgagee clause..."
            value={data.mortgage_clause || ''}
            disabled={disabled}
            onChange={e => updateField('mortgage_clause', e.target.value)}
            className="w-full bg-[#f0f2f5] border-transparent px-6 py-5 rounded-[1.25rem] transition-all focus:bg-[#edf2f7] focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-400 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed resize-none text-lg"
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
