export interface PolicyTypeOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// PERSONAL LINES MASTER LIST (6 Official Client Approved Policies)
// ---------------------------------------------------------------------------
export const PERSONAL_POLICY_TYPES: PolicyTypeOption[] = [
  { value: 'home', label: 'Home' },
  { value: 'condo', label: 'Condo' },
  { value: 'landlord_home', label: 'Landlord Home' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'umbrella', label: 'Umbrella' },
  { value: 'auto', label: 'Auto' }
];

// ---------------------------------------------------------------------------
// COMMERCIAL LINES MASTER LIST (16 Official Client Approved Policies)
// ---------------------------------------------------------------------------
export const COMMERCIAL_POLICY_TYPES: PolicyTypeOption[] = [
  { value: 'bop', label: 'Business Owners Policy (BOP)' },
  { value: 'commercial_auto', label: 'Commercial Auto' },
  { value: 'commercial_package', label: 'Commercial Package' },
  { value: 'umbrella', label: 'Umbrella (Excess Liability)' },
  { value: 'general_liability', label: 'General Liability' },
  { value: 'flood', label: 'Flood' },
  { value: 'builders_risk', label: 'Builders Risk' },
  { value: 'lessor_risk', label: 'Lessor Risk' },
  { value: 'surety_bond', label: 'Surety Bond' },
  { value: 'inland_marine', label: 'Inland Marine' },
  { value: 'employment_practices_liability', label: 'Employment Practices Liability' },
  { value: 'cyber_liability', label: 'Cyber Liability' },
  { value: 'professional_liability', label: 'Errors & Omissions / Professional Liability' },
  { value: 'liquor_liability', label: 'Liquor Liability' },
  { value: 'crime_fidelity_bond', label: 'Crime Fidelity Bond' },
  { value: 'commercial_property', label: 'Commercial Property' },
  { value: 'workers_comp', label: 'Workers Comp Policy' }
];

// Combined list for global selectors & lookup mapping
export const ALL_POLICY_TYPES: PolicyTypeOption[] = [
  ...PERSONAL_POLICY_TYPES,
  ...COMMERCIAL_POLICY_TYPES
];

// Lookup Map for clean O(1) label formatting
export const POLICY_LABEL_MAP: Record<string, string> = ALL_POLICY_TYPES.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>
);
