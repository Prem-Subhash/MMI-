'use client'

import { Car, Building2, Calendar, ShieldAlert, BadgeCheck } from 'lucide-react'
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
              className="border-red-100 bg-red-50/10 focus:border-red-400"
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
