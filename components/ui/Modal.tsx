'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    subtitle?: React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
    maxWidth?: string
    icon?: React.ReactNode
    isHidden?: boolean
    hideHeader?: boolean
}

export function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = 'max-w-2xl', icon, isHidden, hideHeader }: ModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose()
            }
            window.addEventListener('keydown', handleKeyDown)
            
            return () => {
                document.body.style.overflow = ''
                window.removeEventListener('keydown', handleKeyDown)
            }
        } else {
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!mounted || !isOpen) return null

    const modalContent = (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isHidden ? 'hidden' : ''}`}
            role="dialog"
            aria-modal="true"
            style={{ display: isHidden ? 'none' : undefined }}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div 
                className={`relative bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col w-full ${maxWidth} max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
            >
                {/* Header */}
                {!hideHeader && title && (
                    <div className="shrink-0 bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-6 py-5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            {icon && (
                                <div className="p-2 bg-white/20 text-white rounded-lg backdrop-blur-sm shadow-sm flex items-center justify-center">
                                    {icon}
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-white/80 text-sm mt-0.5 font-medium">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -mr-2 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white min-h-0">
                    {children}
                </div>

                {/* Footer (Optional) */}
                {footer && (
                    <div className="shrink-0 px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 z-10">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
