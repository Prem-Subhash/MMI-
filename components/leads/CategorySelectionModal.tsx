'use client'

import React from 'react'
import { User, Briefcase, X } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] p-6 text-white relative">
          {showCloseButton && onClose && (
            <button 
              onClick={onClose} 
              className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
          <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
          <p className="text-white/80 mt-1 text-sm">{description}</p>
        </div>

        {/* Content Options */}
        <div className="p-6 md:p-8 space-y-4 bg-gray-50/50">
          <button
            onClick={() => onSelect('personal')}
            className="w-full text-left bg-white rounded-2xl border-2 border-gray-100 hover:border-[#10B889] p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer group"
          >
            <div className="p-3 bg-emerald-50 text-[#10B889] rounded-xl group-hover:bg-[#10B889] group-hover:text-white transition-colors duration-300">
              <User size={26} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Personal Lines</h4>
              <p className="text-sm text-gray-500 mt-0.5">Auto, Home, Condo, Landlord Home, Umbrella policies.</p>
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
              <p className="text-sm text-gray-500 mt-0.5">Workers Comp, Business Owners Policy, Commercial Auto, Packages.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
