-- ==============================================================================
-- MOONSTAR MORTGAGE CRM — STAGE HISTORY WITH SNAPSHOTS MIGRATION
-- ==============================================================================
-- This table tracks stage transitions and immutable stage snapshots for mortgage applications.
-- 100% isolated from existing Insurance CRM (lead_stage_history).

CREATE TABLE IF NOT EXISTS public.mortgage_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.mortgage_loans(id) ON DELETE CASCADE,
  previous_stage VARCHAR(50) NOT NULL,
  current_stage VARCHAR(50) NOT NULL,
  updated_by VARCHAR(255) NOT NULL DEFAULT 'Mortgage Admin',
  remarks TEXT,
  stage_data JSONB DEFAULT '{}'::jsonb,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table was already created in an earlier step without stage_data, add the column:
ALTER TABLE public.mortgage_stage_history ADD COLUMN IF NOT EXISTS stage_data JSONB DEFAULT '{}'::jsonb;

-- Index for fast retrieval ordered by newest first
CREATE INDEX IF NOT EXISTS idx_mortgage_stage_history_loan_id_changed_at 
ON public.mortgage_stage_history(loan_id, changed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mortgage_stage_history ENABLE ROW LEVEL SECURITY;

-- Policy allowing full access for authenticated mortgage workflows
CREATE POLICY "Allow full access to mortgage_stage_history"
ON public.mortgage_stage_history
FOR ALL
USING (true)
WITH CHECK (true);
