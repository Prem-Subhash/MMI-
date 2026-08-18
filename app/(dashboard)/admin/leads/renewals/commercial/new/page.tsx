'use client'

import { useRouter } from 'next/navigation'
import { CommercialRenewalForm } from '@/components/leads/CommercialRenewalForm'

export default function AdminCommercialRenewalNewPage() {
  const router = useRouter()

  return (
    <CommercialRenewalForm 
      assignedCsrId={null} 
      onSuccess={() => router.push('/admin/insurance/commercial-renewal')}
      onCancel={() => router.push('/admin/insurance/commercial-renewal')}
    />
  )
}
