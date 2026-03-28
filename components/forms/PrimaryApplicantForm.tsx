'use client'

import { User, GraduationCap, Briefcase } from 'lucide-react'
import { SectionCard, Input, Select, FieldGrid } from '@/components/ui/IntakeUI'
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
    <SectionCard
      icon={<User size={32} strokeWidth={2.5} />}
      title="Primary Applicant"
      subtitle="The main individual seeking coverage"
    >
      <div className="space-y-8">
        <Input
          id="primary-name"
          label="Full Legal Name"
          placeholder="First name and Surname"
          icon={User}
          value={data.name || ''}
          disabled={disabled}
          onChange={e => updateField('name', e.target.value)}
        />

        <FieldGrid columns={2} gap={8}>
          <Select
            id="primary-education"
            label="Education Level"
            icon={GraduationCap}
            placeholder="Select education"
            options={EDUCATION_OPTIONS}
            value={data.education || ''}
            disabled={disabled}
            onChange={e => updateField('education', e.target.value)}
          />

          <Input
            id="primary-profession"
            label="Current Profession"
            placeholder="e.g. Software Engineer"
            icon={Briefcase}
            value={data.profession || ''}
            disabled={disabled}
            onChange={e => updateField('profession', e.target.value)}
          />
        </FieldGrid>
      </div>
    </SectionCard>
  )
}
