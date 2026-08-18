'use client'

import CommercialRenewalsPage from '@/app/(dashboard)/csr/renewals/commercial/page'

export default function SuperAdminInsuranceCommercialRenewalWrapper() {
    return <CommercialRenewalsPage createRoute="/admin/leads/renewals/commercial/new" />
}
