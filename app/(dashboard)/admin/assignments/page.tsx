'use client'

import { Suspense } from 'react'
import { AdminAssignmentsContent } from '@/components/leads/AdminAssignmentsContent'
import Loading from '@/components/ui/Loading'

export default function AdminAssignmentsPage() {
    return (
        <Suspense fallback={<Loading message="Loading Lead Assignments..." />}>
            <AdminAssignmentsContent />
        </Suspense>
    )
}
