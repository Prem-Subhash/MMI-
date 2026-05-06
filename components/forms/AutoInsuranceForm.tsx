'use client'

import { Car, Building2, Calendar, ShieldAlert, BadgeCheck, Users, Plus, Trash2 } from 'lucide-react'
import { SectionCard, Input, Select, FieldGrid } from '@/components/ui/IntakeUI'
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

  const additionalDrivers: string[] = data.additional_drivers || []

  const addDriver = () => {
    onChange({ ...data, additional_drivers: [...additionalDrivers, ''] })
  }

  const updateDriver = (index: number, val: string) => {
    const newDrivers = [...additionalDrivers]
    newDrivers[index] = val
    onChange({ ...data, additional_drivers: newDrivers })
  }

  const removeDriver = (index: number) => {
    const newDrivers = additionalDrivers.filter((_, i) => i !== index)
    onChange({ ...data, additional_drivers: newDrivers })
  }

  return (
    <SectionCard
      icon={<Car size={32} strokeWidth={2.5} />}
      title="Auto Insurance"
      subtitle="Current policy and driving history"
    >
      <div className="space-y-10">
        <Input
          id="auto-carrier"
          label="Current Carrier"
          placeholder="e.g. Progressive"
          icon={Building2}
          value={data.current_carrier || ''}
          disabled={disabled}
          onChange={e => updateField('current_carrier', e.target.value)}
        />

        <FieldGrid columns={2} gap={10}>
          <Input
            id="auto-duration"
            label="Duration with Carrier (Months)"
            type="number"
            placeholder="e.g. 12"
            icon={Calendar}
            value={data.months_with_carrier || ''}
            disabled={disabled}
            onChange={e => updateField('months_with_carrier', e.target.value)}
          />

          <Select
            id="auto-claims"
            label="Claims in last 5 years?"
            icon={ShieldAlert}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.claims_last_5_years || ''}
            disabled={disabled}
            onChange={e => updateField('claims_last_5_years', e.target.value)}
          />
        </FieldGrid>

        {data.claims_last_5_years === 'yes' && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <Input
              id="auto-claims-count"
              label="How many claims?"
              type="number"
              placeholder="0"
              icon={ShieldAlert}
              value={data.claims_count || ''}
              disabled={disabled}
              onChange={e => updateField('claims_count', e.target.value)}
              className="border-red-100 bg-red-50/10 focus:border-red-400"
            />
          </div>
        )}

        <FieldGrid columns={2} gap={10}>
          <Select
            id="auto-violations"
            label="Violations in last 5 years?"
            icon={ShieldAlert}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.violations_last_5_years || ''}
            disabled={disabled}
            onChange={e => updateField('violations_last_5_years', e.target.value)}
          />

          <Select
            id="auto-discount"
            label="Qualify for discount?"
            icon={BadgeCheck}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.good_driver_discount || ''}
            disabled={disabled}
            onChange={e => updateField('good_driver_discount', e.target.value)}
          />
        </FieldGrid>

        {data.violations_last_5_years === 'yes' && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <Input
              id="auto-violation-count"
              label="How many violations?"
              type="number"
              placeholder="0"
              icon={ShieldAlert}
              value={data.violation_count || ''}
              disabled={disabled}
              onChange={e => updateField('violation_count', e.target.value)}
            />
          </div>
        )}

        {/* ADDITIONAL DRIVERS SECTION */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Additional Drivers
            </h4>
            {!disabled && (
              <button
                onClick={addDriver}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
              >
                <Plus size={14} /> Add Driver
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {additionalDrivers.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No additional drivers added.</p>
            ) : (
              additionalDrivers.map((driver, index) => (
                <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1">
                    <Input
                      id={`driver-${index}`}
                      label={`Driver #${index + 1} Name`}
                      placeholder="e.g. Jane Doe"
                      value={driver}
                      disabled={disabled}
                      onChange={e => updateDriver(index, e.target.value)}
                    />
                  </div>
                  {!disabled && (
                    <button
                      onClick={() => removeDriver(index)}
                      className="mt-6 p-3 text-red-500 hover:text-white hover:bg-red-500 bg-red-50 rounded-xl transition-colors border border-red-100 shrink-0"
                      title="Remove Driver"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
