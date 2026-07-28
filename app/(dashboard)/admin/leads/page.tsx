'use client'

import { Suspense } from 'react'
import { AdminAllLeadsContent } from '@/components/leads/AdminAllLeadsContent'
import Loading from '@/components/ui/Loading'

export default function AdminLeadsPage() {
    return (
        <Suspense fallback={<Loading message="Loading all leads..." />}>
            <AdminAllLeadsContent />
        </Suspense>
    )
}
