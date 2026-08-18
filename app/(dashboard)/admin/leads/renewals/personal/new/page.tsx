'use client'

import { useRouter } from 'next/navigation'
import { PersonalRenewalForm } from '@/components/leads/PersonalRenewalForm'

export default function AdminPersonalRenewalNewPage() {
  const router = useRouter()

  return (
    <PersonalRenewalForm 
      assignedCsrId={null} 
      onSuccess={() => router.push('/admin/insurance/personal-renewal')}
      onCancel={() => router.push('/admin/insurance/personal-renewal')}
    />
  )
}
