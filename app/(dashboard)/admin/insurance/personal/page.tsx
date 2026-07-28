'use client'

import { Suspense } from 'react'
import { BusinessCategoryConsole } from '@/components/leads/BusinessCategoryConsole'
import Loading from '@/components/ui/Loading'

export default function AdminInsurancePersonalPage() {
    return (
        <Suspense fallback={<Loading message="Loading Personal Lines Console..." />}>
            <BusinessCategoryConsole
                category="personal"
                flow="new"
                title="Personal Lines Console"
                description="Manage unassigned Personal leads, monitor the new business pipeline, assign CSRs, and track all active Personal policies."
            />
        </Suspense>
    )
}
