import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  wrapperClassName?: string;
}

export function Select({ className, wrapperClassName, children, ...props }: SelectProps) {
  return (
    <div className={`relative w-full ${wrapperClassName || ''}`}>
      <select
        className={`appearance-none w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10B889] focus:bg-white transition-all cursor-pointer peer ${className || ''}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none peer-focus:rotate-180 transition-transform duration-300 flex items-center justify-center">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}
