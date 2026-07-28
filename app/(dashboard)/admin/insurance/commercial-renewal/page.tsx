'use client'

import { Suspense } from 'react'
import { BusinessCategoryConsole } from '@/components/leads/BusinessCategoryConsole'
import Loading from '@/components/ui/Loading'

export default function AdminInsuranceCommercialRenewalPage() {
    return (
        <Suspense fallback={<Loading message="Loading Commercial Renewal Console..." />}>
            <BusinessCategoryConsole
                category="commercial"
                flow="renewal"
                title="Commercial Renewal Console"
                description="Manage unassigned Commercial Renewal leads, monitor commercial renewal schedules, assign CSRs, and track retention workflows."
            />
        </Suspense>
    )
}
