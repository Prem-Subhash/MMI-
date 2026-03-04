-- 1. Schema Additions: Unified Effective Date
ALTER TABLE public.temp_leads_basics 
ADD COLUMN IF NOT EXISTS effective_date DATE 
GENERATED ALWAYS AS (COALESCE(renewal_date, created_at::date)) STORED;

-- 2. Enterprise Indexing Strategy
CREATE INDEX IF NOT EXISTS idx_leads_effective_date ON public.temp_leads_basics (effective_date);
CREATE INDEX IF NOT EXISTS idx_leads_policy_flow ON public.temp_leads_basics (policy_flow);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_csr ON public.temp_leads_basics (assigned_csr);
CREATE INDEX IF NOT EXISTS idx_leads_insurance_category ON public.temp_leads_basics (insurence_category);
-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_leads_reporting_composite ON public.temp_leads_basics (effective_date, policy_flow, insurence_category);

-- 3. Row Level Security (RLS) Enforcement
ALTER TABLE public.temp_leads_basics ENABLE ROW LEVEL SECURITY;

-- Drop existing generic policies if any
DROP POLICY IF EXISTS "Leads visibility" ON public.temp_leads_basics;

-- Admin: Can see everything
CREATE POLICY "Admins view all leads" ON public.temp_leads_basics
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Manager: Can see their own leads AND leads belonging to their team
CREATE POLICY "Managers view team leads" ON public.temp_leads_basics
FOR SELECT USING (
  assigned_csr = auth.uid() OR
  assigned_csr IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') -- fallback safety
);

-- Agent: Can only see their own leads
CREATE POLICY "Agents view own leads" ON public.temp_leads_basics
FOR SELECT USING (
  assigned_csr = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
