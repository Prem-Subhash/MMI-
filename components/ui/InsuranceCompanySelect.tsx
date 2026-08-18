"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown } from "lucide-react";

type InsuranceCompany = {
  id: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (id: string, name: string) => void;
  category?: string;
};

export function InsuranceCompanySelect({ value, onChange, category }: Props) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("id, name")
        .eq("is_active", true)
        .eq("category", category)
        .order("name");
      setCompanies(data || []);
      setLoading(false);
    }
    fetchCompanies();
  }, [category]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedName = companies.find(c => c.id === selectedId)?.name || "";
    onChange(selectedId, selectedName);
  };

  return (
    <div className="relative w-full">
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-gray-800 disabled:opacity-50"
      >
        <option value="">{loading ? "Loading..." : "Select Insurance Company"}</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        size={16}
      />
    </div>
  );
}
