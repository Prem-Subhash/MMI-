"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, Check, Plus, X } from "lucide-react";

type InsuranceCompany = {
  id: string;
  name: string;
  commission_percent?: number | null;
};

type Props = {
  value: string;
  onChange: (id: string | null, name: string, commissionPercent?: number | null) => void;
  category?: string;
  placeholder?: string;
};

export function InsuranceCompanySelect({
  value,
  onChange,
  category,
  placeholder = "Select or type insurance company..."
}: Props) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchCompanies() {
      if (!category || (category !== "personal" && category !== "commercial")) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("insurance_companies")
        .select("id, name, commission_percent")
        .eq("is_active", true)
        .eq("category", category)
        .order("name");
      setCompanies(data || []);
      setLoading(false);
    }
    fetchCompanies();
  }, [category]);

  // Update position for portal dropdown
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top = rect.bottom + 6;
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
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedContainer = containerRef.current && containerRef.current.contains(target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedContainer && !clickedDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current display label based on value or search term
  const selectedCompany = companies.find((c) => c.id === value);
  const displayLabel = selectedCompany ? selectedCompany.name : (value || "");

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExactMatch = companies.some(
    (c) => c.name.toLowerCase().trim() === searchTerm.toLowerCase().trim()
  );

  const handleSelectExisting = (company: InsuranceCompany) => {
    onChange(company.id, company.name, company.commission_percent);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleSelectCustom = (customName: string) => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    onChange(null, trimmed, null);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, "", null);
    setSearchTerm("");
  };

  const dropdownContent = isOpen && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[260px] overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Existing filtered list */}
      {filteredCompanies.map((c) => {
        const isSelected = value === c.id || displayLabel === c.name;
        return (
          <div
            key={c.id}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelectExisting(c);
            }}
            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
              isSelected ? "bg-emerald-50 text-emerald-900 font-semibold" : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span className="text-sm">{c.name}</span>
            {isSelected && <Check size={14} className="text-emerald-600" />}
          </div>
        );
      })}

      {/* Manual Custom Option if user typed something not matching exactly */}
      {searchTerm.trim().length > 0 && !isExactMatch && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSelectCustom(searchTerm);
          }}
          className="flex items-center gap-2 p-2.5 mt-1 border-t border-gray-100 rounded-lg cursor-pointer bg-blue-50/60 hover:bg-blue-50 text-blue-700 font-semibold transition-colors"
        >
          <Plus size={15} className="shrink-0 text-blue-600" />
          <span className="text-sm">
            Use custom: <span className="underline font-bold">"{searchTerm.trim()}"</span>
          </span>
        </div>
      )}

      {filteredCompanies.length === 0 && searchTerm.trim().length === 0 && (
        <div className="p-3 text-center text-xs text-gray-500">No insurance companies available</div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => {
          updatePosition();
          setIsOpen((prev) => {
            if (!prev) {
              setSearchTerm("");
            }
            return !prev;
          });
        }}
        className="w-full min-h-[46px] px-3.5 py-2 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition flex items-center justify-between gap-2 cursor-pointer shadow-sm"
      >
        <div className="flex-1 flex items-center min-w-0">
          {isOpen ? (
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              placeholder={displayLabel || placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updatePosition();
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (searchTerm.trim().length > 0) {
                    const exact = companies.find(
                      (c) => c.name.toLowerCase() === searchTerm.toLowerCase().trim()
                    );
                    if (exact) {
                      handleSelectExisting(exact);
                    } else {
                      handleSelectCustom(searchTerm);
                    }
                  } else if (filteredCompanies.length > 0) {
                    handleSelectExisting(filteredCompanies[0]);
                  }
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
          ) : (
            <span
              className={`text-sm truncate select-none ${
                displayLabel ? "text-gray-900 font-medium" : "text-gray-400"
              }`}
            >
              {loading ? "Loading..." : displayLabel || placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {displayLabel && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </div>

      {mounted && typeof document !== "undefined" ? createPortal(dropdownContent, document.body) : null}
    </div>
  );
}


