'use client'

import CommercialPipelinePage from '@/app/(dashboard)/csr/pipeline/commercial/page'

export default function SuperAdminInsuranceCommercialWrapper() {
    return <CommercialPipelinePage createRoute="/admin/leads/new?category=commercial&flow=new" />
}
