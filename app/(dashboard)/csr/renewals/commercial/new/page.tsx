'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CommercialRenewalForm } from '@/components/leads/CommercialRenewalForm'
import { toast } from '@/lib/toast'
import Loading from '@/components/ui/Loading'

export default function CommercialRenewalNewPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
            toast('Your session expired. Please log in again.', 'error')
            return
        }
        setUserId(data.user.id)
    })
  }, [])

  if (!userId) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loading />
        </div>
    )
  }

  return (
    <CommercialRenewalForm 
      assignedCsrId={userId} 
      onSuccess={() => router.push('/csr/renewals/commercial')}
      onCancel={() => router.push('/csr/renewals/commercial')}
    />
  )
}
