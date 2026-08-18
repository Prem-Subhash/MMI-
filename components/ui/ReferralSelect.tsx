"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown } from "lucide-react";

type Referral = {
  id: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (id: string, name: string) => void;
};

export function ReferralSelect({ value, onChange }: Props) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferrals() {
      const { data } = await supabase
        .from("referrals")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setReferrals(data || []);
      setLoading(false);
    }
    fetchReferrals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedName = referrals.find(r => r.id === selectedId)?.name || "";
    onChange(selectedId, selectedName);
  };

  return (
    <div className="relative w-full">
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition text-gray-800 disabled:opacity-50"
      >
        <option value="">{loading ? "Loading Referrals..." : "Select Referral (Optional)"}</option>
        {referrals.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
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
