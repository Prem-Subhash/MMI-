'use client'

import { Suspense } from 'react'
import { AdminLeadsContent } from '@/components/leads/AdminLeadsContent'
import Loading from '@/components/ui/Loading'

export default function AdminLeadsPage() {
    return (
        <Suspense fallback={<Loading message="Loading Admin Leads console..." />}>
            <AdminLeadsContent />
        </Suspense>
    )
}
