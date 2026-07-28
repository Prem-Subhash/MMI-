'use client'

import { Suspense } from 'react'
import { BusinessCategoryConsole } from '@/components/leads/BusinessCategoryConsole'
import Loading from '@/components/ui/Loading'

export default function AdminInsuranceCommercialPage() {
    return (
        <Suspense fallback={<Loading message="Loading Commercial Lines Console..." />}>
            <BusinessCategoryConsole
                category="commercial"
                flow="new"
                title="Commercial Lines Console"
                description="Manage unassigned Commercial leads, monitor commercial pipeline progression, assign CSRs, and track all active Commercial accounts."
            />
        </Suspense>
    )
}
