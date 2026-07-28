'use client'

import React from 'react'
import MortgageHeader from '@/app/mortgage/components/MortgageHeader'
import PipelineView from '@/app/mortgage/components/PipelineView'

export default function SuperAdminMortgagePreApprovalWrapper() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MortgageHeader
        title="Pre-Approval Pipeline (2 Stages)"
        subtitle="Manage pre-qualification and manual underwriting for prospective borrowers"
      />
      <PipelineView
        pipelineType="PRE_APPROVAL"
        title="Pre-Approval Pipeline"
        subtitle="Borrower pre-qualification workflow"
      />
    </div>
  )
}
