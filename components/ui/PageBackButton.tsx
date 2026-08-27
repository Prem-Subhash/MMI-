'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageBackButtonProps {
  fallbackUrl?: string
  label?: string
  className?: string
  onBack?: () => void
}

export default function PageBackButton({
  fallbackUrl = '/admin/leads',
  label = 'Back',
  className = '',
  onBack,
}: PageBackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onBack) {
      onBack()
      return
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <div className={`mb-4 flex items-center justify-start ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-emerald-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm transition-all group"
      >
        <ArrowLeft size={15} className="text-gray-500 group-hover:text-emerald-600 transition-colors" />
        <span>{label}</span>
      </button>
    </div>
  )
}
