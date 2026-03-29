'use client'

import React from 'react'
import { type LucideIcon, ChevronDown } from 'lucide-react'

/* ================= TYPES ================= */

interface FormHeaderProps {
  title: string
  subtitle?: string
  logoSrc: string
}

interface FormContainerProps {
  children: React.ReactNode
}

interface SectionCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
  isLast?: boolean
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: LucideIcon
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  icon?: LucideIcon
  options: { label: string; value: string }[] | string[]
  placeholder?: string
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

interface FieldGridProps {
  columns?: number
  gap?: number
  children: React.ReactNode
}

/* ================= 1. FORM HEADER ================= */

export const FormHeader: React.FC<FormHeaderProps> = ({ title, subtitle, logoSrc }) => (
  <header className="relative w-full min-h-[320px] overflow-hidden bg-gradient-to-br from-red-600 via-rose-700 to-rose-900 py-20">
    <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-400 rounded-full blur-[120px] mix-blend-multiply opacity-60 animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-rose-500 rounded-full blur-[140px] mix-blend-multiply opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
    </div>

    <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center">
      <div className="bg-white/90 backdrop-blur-2xl px-12 py-6 rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.12)] border border-white/20 mb-10 transition-transform hover:scale-105 duration-500">
        <img src={logoSrc} alt="Logo" className="h-10 w-auto object-contain" />
      </div>
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-white text-5xl font-bold tracking-tight mb-4 leading-tight">{title}</h1>
        {subtitle && <p className="text-white/70 text-lg font-medium tracking-tight leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  </header>
)

/* ================= 2. FORM CONTAINER ================= */

export const FormContainer: React.FC<FormContainerProps> = ({ children }) => (
  <main className="relative z-20 max-w-4xl mx-auto px-6 -mt-20 pb-32 w-full">
    <div className="bg-white shadow-[0_48px_128px_rgba(0,0,0,0.08)] rounded-[48px] p-8 md:p-16 border border-gray-100/50">
      {children}
    </div>
  </main>
)

/* ================= 3. SECTION CARD ================= */

export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, subtitle, children, isLast }) => (
  <section className={`pt-12 first:pt-0 ${!isLast ? 'pb-12 border-b border-gray-100/80 mb-12' : ''}`}>
    <div className="flex items-center gap-5 mb-10">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner group transition-all">
        <div className="transition-transform group-hover:scale-110 duration-300">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">{title}</h3>
        <p className="text-gray-500 font-medium text-base tracking-tight">{subtitle}</p>
      </div>
    </div>
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {children}
    </div>
  </section>
)

/* ================= 4. INPUT ================= */

export const Input: React.FC<InputProps> = ({ label, icon: Icon, className = '', id, ...props }) => (
  <div className="space-y-2.5 w-full group">
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 ml-1 transition-colors group-hover:text-gray-900">
      {label}
    </label>
    <div className="relative isolate">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none group-focus-within:text-red-500 transition-colors">
          <Icon size={20} strokeWidth={2.5} />
        </div>
      )}
      <input
        id={id}
        className={`
          w-full bg-white border border-gray-200 rounded-2xl py-4 pr-5 outline-none transition-all
          ${Icon ? 'pl-12' : 'pl-5'}
          focus:border-red-300 focus:ring-4 focus:ring-red-50 focus:shadow-[0_0_20px_rgba(220,38,38,0.05)]
          placeholder:text-gray-400 font-semibold text-gray-900 text-lg
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </div>
  </div>
)

/* ================= 5. SELECT ================= */

export const Select: React.FC<SelectProps> = ({ label, icon: Icon, options, className = '', id, placeholder, ...props }) => {
  // Remove placeholder from select element props as it is not a valid HTML attribute
  const { placeholder: _ignored, ...selectProps } = props as any

  return (
    <div className="space-y-2.5 w-full group">
      <label htmlFor={id} className="block text-sm font-bold text-gray-700 ml-1 transition-colors group-hover:text-gray-900">
        {label}
      </label>
      <div className="relative isolate">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none group-focus-within:text-red-500 transition-colors">
            <Icon size={20} strokeWidth={2.5} />
          </div>
        )}
        <select
          id={id}
          className={`
            w-full bg-white border border-gray-200 rounded-2xl py-4 pr-12 appearance-none outline-none transition-all
            ${Icon ? 'pl-12' : 'pl-5'}
            focus:border-red-300 focus:ring-4 focus:ring-red-50 focus:shadow-[0_0_20px_rgba(220,38,38,0.05)]
            font-semibold text-gray-900 text-lg cursor-pointer
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...selectProps}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value
            const lab = typeof opt === 'string' ? opt : opt.label
            return <option key={val} value={val}>{lab}</option>
          })}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-all duration-300 group-focus-within:rotate-180">
          <ChevronDown size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}

/* ================= 6. BUTTON ================= */

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-black tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative group shadow-sm hover:shadow-xl"
  
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-red-200",
    secondary: "bg-white border border-gray-200 text-gray-900 shadow-gray-100 hover:border-gray-300 hover:bg-gray-50/50"
  }

  const sizes = {
    sm: "px-6 py-3 text-sm",
    md: "px-10 py-5 text-xl",
    lg: "px-12 py-6 text-2xl"
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      <span className="relative z-10">{props.children}</span>
      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </button>
  )
}

/* ================= 7. FIELD GRID ================= */

export const FieldGrid: React.FC<FieldGridProps> = ({ columns = 2, gap = 8, children }) => {
  // Tailwind doesn't support dynamic class generation via template literals for grid columns
  const columnMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  }

  const gapMap: Record<number, string> = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12'
  }

  const gridColsClass = columnMap[columns] || 'md:grid-cols-2'
  const gapClass = gapMap[gap] || 'gap-8'

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} ${gapClass}`}>
      {children}
    </div>
  )
}
