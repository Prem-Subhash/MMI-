'use client'

import PersonalRenewalsPage from '@/app/(dashboard)/csr/renewals/personal/page'

export default function SuperAdminInsurancePersonalRenewalWrapper() {
    return <PersonalRenewalsPage createRoute="/admin/leads/renewals/personal/new" />
}
