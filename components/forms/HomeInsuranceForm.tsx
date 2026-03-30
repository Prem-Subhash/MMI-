'use client'

import { 
  Home, 
  Building2, 
  Calendar,
  Hammer, 
  ShieldAlert, 
  ArrowDownCircle, 
  BellDot, 
  Banknote, 
  FileText 
} from 'lucide-react'
import { SectionCard, Input, Select, FieldGrid } from '@/components/ui/IntakeUI'
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
    <SectionCard
      icon={<Home size={32} strokeWidth={2.5} />}
      title="Home Insurance"
      subtitle="Details about your property and coverage"
    >
      <div className="space-y-8">
        <Input
          id="home-carrier"
          label="Current Carrier"
          placeholder="e.g. State Farm"
          icon={Building2}
          value={data.current_carrier || ''}
          disabled={disabled}
          onChange={e => updateField('current_carrier', e.target.value)}
        />

        <FieldGrid columns={2} gap={8}>
          <Input
            id="home-years"
            label="Years with Carrier"
            type="number"
            placeholder="0"
            icon={Calendar}
            value={data.years_with_carrier || ''}
            disabled={disabled}
            onChange={e => updateField('years_with_carrier', e.target.value)}
          />

          <Input
            id="home-roof"
            label="Roof Replacement Year"
            type="number"
            placeholder="e.g. 2018"
            icon={Hammer}
            value={data.roof_replaced_year || ''}
            disabled={disabled}
            onChange={e => updateField('roof_replaced_year', e.target.value)}
          />
        </FieldGrid>

        <FieldGrid columns={2} gap={8}>
          <Select
            id="home-claims"
            label="Any claims in last 5 years?"
            icon={ShieldAlert}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.claims_last_5_years || ''}
            disabled={disabled}
            onChange={e => updateField('claims_last_5_years', e.target.value)}
          />

          {data.claims_last_5_years === 'yes' ? (
            <Input
              id="home-claims-count"
              label="How many claims?"
              type="number"
              placeholder="0"
              icon={ShieldAlert}
              value={data.claims_count || ''}
              disabled={disabled}
              onChange={e => updateField('claims_count', e.target.value)}
            />
          ) : <div />}
        </FieldGrid>

        <FieldGrid columns={2} gap={8}>
          <Select
            id="home-basement"
            label="Is there a basement?"
            icon={ArrowDownCircle}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.has_basement || ''}
            disabled={disabled}
            onChange={e => updateField('has_basement', e.target.value)}
          />

          {data.has_basement === 'yes' ? (
            <Select
              id="home-basement-type"
              label="Basement Type"
              icon={ArrowDownCircle}
              placeholder="Select type"
              options={BASEMENT_TYPES}
              value={data.basement_type || ''}
              disabled={disabled}
              onChange={e => updateField('basement_type', e.target.value)}
            />
          ) : <div />}
        </FieldGrid>

        <FieldGrid columns={2} gap={8}>
          <Select
            id="home-alarm"
            label="Centralized Alarm/Security?"
            icon={BellDot}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.has_alarm || ''}
            disabled={disabled}
            onChange={e => updateField('has_alarm', e.target.value)}
          />

          <Select
            id="home-escrow"
            label="Paid by Escrow?"
            icon={Banknote}
            placeholder="Select option"
            options={YES_NO_OPTIONS}
            value={data.paid_by_escrow || ''}
            disabled={disabled}
            onChange={e => updateField('paid_by_escrow', e.target.value)}
          />
        </FieldGrid>

        <div className="space-y-2.5">
          <label className="block text-sm font-bold text-gray-700 ml-1">
            Mortgagee Clause (if applicable)
          </label>
          <div className="relative group isolate">
            <div className="absolute left-4 top-4 text-gray-400 z-10 pointer-events-none group-focus-within:text-red-500 transition-colors">
              <FileText size={20} />
            </div>
            <textarea
              placeholder="Details of your mortgagee clause..."
              value={data.mortgage_clause || ''}
              disabled={disabled}
              onChange={e => updateField('mortgage_clause', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-5 outline-none transition-all focus:border-red-300 focus:ring-4 focus:ring-red-50 placeholder:text-gray-400 font-semibold text-gray-900 text-lg min-h-[140px] resize-none"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
