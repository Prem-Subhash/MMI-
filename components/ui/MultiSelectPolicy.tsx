'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // fixed max height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Default position is below the input container
      let top = rect.bottom + 6;

      // If there is not enough space below and more space above, open upwards
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = Math.max(8, rect.top - Math.min(dropdownHeight, spaceAbove - 16) - 6);
      }

      setCoords({
        top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // capture: true to handle modal/container scrolling

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close dropdown on click outside of both the input box and the floating portal dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedContainer = containerRef.current && containerRef.current.contains(target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedContainer && !clickedDropdown) {
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

  const dropdownContent = isOpen && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[280px] overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-150"
    >
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
                isSelected ? 'bg-emerald-50/70' : 'hover:bg-gray-50'
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
  ) : null;

  return (
    <div className="flex flex-col w-full relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Select Policy Coverages *</label>
      
      <div 
        onClick={() => {
          updatePosition();
          setIsOpen(true);
        }}
        className={`w-full min-h-[48px] p-1.5 bg-white border rounded-xl cursor-text transition-all flex flex-wrap items-center gap-1.5 relative ${
          error ? 'border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-200' : 'border-gray-300 focus-within:ring-2 focus-within:ring-gray-200'
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
            updatePosition();
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            updatePosition();
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Tab') {
              setIsOpen(false);
            }
          }}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>

      {error && (
        <span className="text-yellow-600 text-[11px] font-medium ml-1 mt-1">
          {error}
        </span>
      )}

      {/* Render Dropdown Menu via Portal */}
      {mounted && typeof document !== 'undefined' ? createPortal(dropdownContent, document.body) : null}
    </div>
  );
}
