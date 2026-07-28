'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateApplicationModal from '@/app/mortgage/components/CreateApplicationModal'
import LoanFormModal from '@/app/mortgage/components/LoanFormModal'
import { PipelineType, MortgageLoan } from '@/app/mortgage/lib/types'

export default function SuperAdminMortgageCreateWrapper() {
  const router = useRouter()
  const [isSelectionOpen, setIsSelectionOpen] = useState(true)
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineType | null>(null)

  const handleSelectPipeline = (pipelineType: PipelineType) => {
    setIsSelectionOpen(false)
    setSelectedPipeline(pipelineType)
  }

  const handleClose = () => {
    router.push('/superadmin/mortgage/applications')
  }

  const handleSuccess = (loan: MortgageLoan) => {
    router.push('/superadmin/mortgage/applications')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 items-center justify-center">
      <CreateApplicationModal
        isOpen={isSelectionOpen}
        onClose={handleClose}
        onSelectPipeline={handleSelectPipeline}
      />
      {selectedPipeline && (
        <LoanFormModal
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          defaultPipelineType={selectedPipeline}
        />
      )}
    </div>
  )
}
