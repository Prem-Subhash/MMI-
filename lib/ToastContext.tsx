'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { toastEmitter, ToastEvent, ToastType, toast as _toast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Backward-compatible hook ────────────────────────────────────────────────
export function useToast() {
  return {
    showToast: (message: string, type: ToastType = 'info', duration?: number) => {
      _toast(message, type, duration)
    },
  }
}

export type { ToastType }

// ─── Toast UI ─────────────────────────────────────────────────────────────────
function ToastItem({ toast, onClose }: { toast: ToastEvent; onClose: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const duration = toast.duration ?? 4000

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), duration)
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - 100 / (duration / 50)))
    }, 50)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [toast.id, duration, onClose])


  // ── Per-type visual config ─────────────────────────────────────────────────
  const config = {
    success: {
      bg: '#f0fdf4',          // very light green
      border: '#bbf7d0',      // green-200
      iconBg: '#16a34a',      // green-600
      bar: '#16a34a',
      text: '#14532d',        // green-900
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      iconBg: '#dc2626',
      bar: '#dc2626',
      text: '#7f1d1d',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      iconBg: '#d97706',
      bar: '#d97706',
      text: '#78350f',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      iconBg: '#2563eb',
      bar: '#2563eb',
      text: '#1e3a5f',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 8h.01M12 12v4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  }[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '12px',
        padding: '12px 40px 14px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '380px',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'all',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      {/* Circle icon */}
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        backgroundColor: config.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {config.icon}
      </div>

      {/* Message */}
      <p style={{
        fontSize: '14px',
        fontWeight: 600,
        color: config.text,
        lineHeight: '1.4',
        flex: 1,
        margin: 0,
      }}>
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onClose(toast.id)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: config.iconBg,
          opacity: 0.5,
          padding: '2px',
          lineHeight: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Progress bar at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        width: `${progress}%`,
        backgroundColor: config.iconBg,
        opacity: 0.4,
        borderRadius: '0 0 12px 12px',
        transition: 'width 50ms linear',
      }} />
    </motion.div>
  )
}

// ─── Toast Container — mount this ONCE at the root ───────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEvent[]>([])

  useEffect(() => {
    const unsub = toastEmitter.subscribe((event) => {
      setToasts((prev) => [...prev, event])
    })
    return unsub
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <>
      {children}

      {/* Portal-like fixed container — always renders at the top of the DOM stack */}
      <div
        style={{
          position: 'fixed',
          top: '90px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
