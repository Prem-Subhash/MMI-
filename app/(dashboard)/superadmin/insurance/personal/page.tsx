'use client'

import PersonalPipelinePage from '@/app/(dashboard)/csr/pipeline/personal/page'

export default function SuperAdminInsurancePersonalWrapper() {
    return <PersonalPipelinePage createRoute="/admin/leads/new?category=personal&flow=new" />
}
