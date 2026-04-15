'use client'

import { motion } from 'framer-motion'

interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Spinner({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <motion.div
      className={`border-2 border-current border-t-transparent rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export default function Loading({ message = 'Loading...', fullScreen = false }: LoadingProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center py-20 w-full"

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Simple Loading Circle */}
        <motion.div
          className="w-12 h-12 border-4 border-slate-200 border-t-[#10B889] rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <p className="mt-4 text-slate-500 font-medium tracking-wide text-sm">
        {message}
      </p>
    </div>
  )
}
