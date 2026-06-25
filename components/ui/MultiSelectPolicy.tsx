'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectPolicyProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: boolean | string;
}

export function MultiSelectPolicy({
  options,
  selectedValues,
  onChange,
  placeholder = "Search and select policies...",
  error
}: MultiSelectPolicyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Select Policy Coverages *</label>
      
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full min-h-[48px] p-1.5 bg-white border rounded-xl cursor-text transition-all flex flex-wrap items-center gap-1.5 relative ${
          error ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-200' : 'border-gray-300 focus-within:ring-2 focus-within:ring-gray-200'
        }`}
      >
        {selectedValues.map(val => {
          const opt = options.find(o => o.value === val);
          if (!opt) return null;
          return (
            <span key={val} className="flex items-center gap-1 bg-gray-800 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-sm">
              {opt.label}
              <button 
                type="button"
                onClick={(e) => removeOption(e, val)}
                className="hover:bg-gray-600 rounded-full p-0.5 transition-colors ml-1"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          );
        })}
        
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm p-2 text-gray-700"
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>

      {error && (
        <span className="text-red-500 text-[11px] font-medium ml-1 mt-1">
          {error}
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto p-2">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No policies found matching "{searchTerm}"</div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <div 
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {opt.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
