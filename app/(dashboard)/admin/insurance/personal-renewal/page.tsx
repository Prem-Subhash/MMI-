'use client'

import { Suspense } from 'react'
import { BusinessCategoryConsole } from '@/components/leads/BusinessCategoryConsole'
import Loading from '@/components/ui/Loading'

export default function AdminInsurancePersonalRenewalPage() {
    return (
        <Suspense fallback={<Loading message="Loading Personal Renewal Console..." />}>
            <BusinessCategoryConsole
                category="personal"
                flow="renewal"
                title="Personal Renewal Console"
                description="Manage unassigned Personal Renewal leads, monitor the renewal pipeline, assign CSRs, and track all Personal policy renewals."
            />
        </Suspense>
    )
}
