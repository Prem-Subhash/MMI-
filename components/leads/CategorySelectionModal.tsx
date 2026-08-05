'use client'

import React from 'react'
import { User, Briefcase, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface CategorySelectionModalProps {
  isOpen: boolean
  onClose?: () => void
  onSelect: (category: 'personal' | 'commercial') => void
  title?: string
  description?: string
  showCloseButton?: boolean
}

export default function CategorySelectionModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select Insurance Category",
  description = "Please select the insurance classification to configure the lead creation flow.",
  showCloseButton = true
}: CategorySelectionModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (showCloseButton && onClose) {
          onClose()
        }
      }}
      title={title}
      subtitle={description}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <button
          onClick={() => onSelect('personal')}
          className="w-full text-left bg-white rounded-2xl border-2 border-gray-100 hover:border-[#10B889] p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer group"
        >
          <div className="p-3 bg-emerald-50 text-[#10B889] rounded-xl group-hover:bg-[#10B889] group-hover:text-white transition-colors duration-300">
            <User size={26} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">Personal Lines</h4>
            <p className="text-sm text-gray-500 mt-0.5">Home, Condo, Landlord Home, Motorcycle, Umbrella, Auto policies.</p>
          </div>
        </button>

        <button
          onClick={() => onSelect('commercial')}
          className="w-full text-left bg-white rounded-2xl border-2 border-gray-100 hover:border-[#2E5C85] p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer group"
        >
          <div className="p-3 bg-blue-50 text-[#2E5C85] rounded-xl group-hover:bg-[#2E5C85] group-hover:text-white transition-colors duration-300">
            <Briefcase size={26} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">Commercial Lines</h4>
            <p className="text-sm text-gray-500 mt-0.5">Business Owners Policy (BOP), Commercial Auto, Packages, Liability & more.</p>
          </div>
        </button>
      </div>
    </Modal>
  )
}
