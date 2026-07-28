-- ==============================================================================
-- Migration: Setup Accurate Lending Backend Architecture
-- Description: Creates master tables, relational tables, stage history,
--              indexes, triggers, RLS policies, pipeline registration, and
--              storage bucket for the Accurate Lending portal.
-- Idempotent:  Yes (Uses IF NOT EXISTS, DO blocks, and ON CONFLICT handling).
-- ==============================================================================

DO $$
DECLARE
    v_pipeline_id UUID;
    v_order INT := 1;
    r RECORD;
BEGIN
    -- ==========================================================================
    -- 1. REGISTER ACCURATE LENDING PIPELINE & STAGES
    -- ==========================================================================
    SELECT id INTO v_pipeline_id 
    FROM public.pipelines 
    WHERE name IN ('Accurate Commercial Lending', 'Accurate Lending Pipeline') 
    LIMIT 1;

    IF v_pipeline_id IS NULL THEN
        INSERT INTO public.pipelines (name, category, description, is_renewal)
        VALUES ('Accurate Commercial Lending', 'Lending', '21-Stage Commercial Lending Pipeline', false)
        RETURNING id INTO v_pipeline_id;
    END IF;

    -- Ensure mandatory_fields exists on pipeline_stages if not already present
    BEGIN
        ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS mandatory_fields JSONB DEFAULT '[]'::jsonb;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Register 21 explicit commercial lending stages
    CREATE TEMP TABLE temp_lending_stages (
        stage_name text,
        mand_fields jsonb
    ) ON COMMIT DROP;

    INSERT INTO temp_lending_stages (stage_name, mand_fields) VALUES
    ('1. New Loan', '["borrower_name", "loan_type", "purchase_price"]'::jsonb),
    ('2. Initial Email Sent / Documents Requested', '["client_email"]'::jsonb),
    ('3. Initial Screening', '["estimated_credit_score", "loan_summary"]'::jsonb),
    ('4. Under Review by Lender', '["nature_of_loan"]'::jsonb),
    ('5. Term Sheet Received', '["term_amount", "interest_rate", "term_months"]'::jsonb),
    ('6. Which Lender is Providing Loan?', '["lender_bank"]'::jsonb),
    ('7. Good Faith Deposit Received', '["internal_amount_rec"]'::jsonb),
    ('8. Accutax – Received (Amount)', '["accutax_amount_req"]'::jsonb),
    ('9. Accurate Lending – Received (Amount)', '["accurate_lending_amount_req"]'::jsonb),
    ('10. Lender Bank – Received (Amount)', '["bank_amount_req", "bank_amount_rec"]'::jsonb),
    ('11. UW Document – Requested', '[]'::jsonb),
    ('12. Which Documents were Requested? (Notes)', '[]'::jsonb),
    ('13. UW Document – Received', '[]'::jsonb),
    ('14. UW', '[]'::jsonb),
    ('15. Closing Checklist – Received', '[]'::jsonb),
    ('16. Closing Checklist – In Process', '[]'::jsonb),
    ('17. Closing Checklist – Completed', '[]'::jsonb),
    ('18. Loan Closed', '[]'::jsonb),
    ('19. Documents Saved?', '[]'::jsonb),
    ('20. Check Received from the Bank', '[]'::jsonb),
    ('21. Check Received from Borrower (if applicable)', '[]'::jsonb);

    FOR r IN SELECT * FROM temp_lending_stages LOOP
        PERFORM 1 FROM public.pipeline_stages 
        WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        
        IF FOUND THEN
            UPDATE public.pipeline_stages 
            SET stage_order = v_order, mandatory_fields = r.mand_fields
            WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        ELSE
            INSERT INTO public.pipeline_stages (pipeline_id, stage_name, stage_order, mandatory_fields)
            VALUES (v_pipeline_id, r.stage_name, v_order, r.mand_fields);
        END IF;

        v_order := v_order + 1;
    END LOOP;
END $$;


-- ==============================================================================
-- 2. CREATE CORE TABLES
-- ==============================================================================

-- Table: accurate_lending_loans (Master Commercial Loan Applications)
CREATE TABLE IF NOT EXISTS public.accurate_lending_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id_code TEXT UNIQUE,
    stage INT NOT NULL CHECK (stage >= 1 AND stage <= 21) DEFAULT 1,
    stage_name TEXT NOT NULL DEFAULT '1. New Loan',
    inquiry_date DATE DEFAULT CURRENT_DATE,
    borrower_name TEXT NOT NULL,
    client_legal_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    estimated_credit_score INT,
    loan_type TEXT,
    loan_purpose TEXT,
    nature_of_loan TEXT,
    property_address TEXT,
    loan_summary TEXT,
    purchase_price NUMERIC(15, 2),
    down_payment_percentage NUMERIC(5, 2),
    partners JSONB DEFAULT '[]'::jsonb,
    lead_source TEXT,
    referral_lo_name TEXT,
    accutax_amount_req NUMERIC(15, 2),
    accurate_lending_amount_req NUMERIC(15, 2),
    internal_amount_rec NUMERIC(15, 2),
    bank_amount_req NUMERIC(15, 2),
    bank_amount_rec NUMERIC(15, 2),
    assigned_lending_officer UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lending_bank_assignments (Section E Multi-Bank Management)
CREATE TABLE IF NOT EXISTS public.lending_bank_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.accurate_lending_loans(id) ON DELETE CASCADE,
    lender_bank TEXT NOT NULL,
    bank_officer_name TEXT,
    bank_underwriter_name TEXT,
    title_agency_name TEXT,
    bank_closing_agent_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_custom_bank BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lending_documents (Stage 5 Term Sheets & Closing Files)
CREATE TABLE IF NOT EXISTS public.lending_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.accurate_lending_loans(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    status TEXT CHECK (status IN ('Received', 'In Review', 'Accepted')) DEFAULT 'Received',
    term_amount TEXT,
    interest_rate TEXT,
    term_months TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lending_stage_history (Audit Trail & Timeline Feed)
CREATE TABLE IF NOT EXISTS public.lending_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.accurate_lending_loans(id) ON DELETE CASCADE,
    previous_stage INT,
    current_stage INT NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    stage_data JSONB DEFAULT '{}'::jsonb,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 3. CREATE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_lending_loans_officer ON public.accurate_lending_loans (assigned_lending_officer);
CREATE INDEX IF NOT EXISTS idx_lending_loans_stage ON public.accurate_lending_loans (stage);
CREATE INDEX IF NOT EXISTS idx_lending_loans_borrower ON public.accurate_lending_loans (borrower_name);
CREATE INDEX IF NOT EXISTS idx_lending_loans_type_stage ON public.accurate_lending_loans (loan_type, stage);
CREATE INDEX IF NOT EXISTS idx_lending_loans_code ON public.accurate_lending_loans (loan_id_code);

CREATE INDEX IF NOT EXISTS idx_lending_bank_assign_loan ON public.lending_bank_assignments (loan_id);
CREATE INDEX IF NOT EXISTS idx_lending_bank_assign_bank ON public.lending_bank_assignments (lender_bank);

CREATE INDEX IF NOT EXISTS idx_lending_docs_loan_bank ON public.lending_documents (loan_id, bank_name);
CREATE INDEX IF NOT EXISTS idx_lending_history_loan ON public.lending_stage_history (loan_id, changed_at DESC);


-- ==============================================================================
-- 4. CREATE UPDATED_AT TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_lending_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_accurate_lending_loans_updated ON public.accurate_lending_loans;
CREATE TRIGGER on_accurate_lending_loans_updated
    BEFORE UPDATE ON public.accurate_lending_loans
    FOR EACH ROW EXECUTE PROCEDURE public.handle_lending_updated_at();

DROP TRIGGER IF EXISTS on_lending_bank_assignments_updated ON public.lending_bank_assignments;
CREATE TRIGGER on_lending_bank_assignments_updated
    BEFORE UPDATE ON public.lending_bank_assignments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_lending_updated_at();


-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS) & DEFINE POLICIES
-- ==============================================================================
ALTER TABLE public.accurate_lending_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_bank_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_stage_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Lending view accurate_lending_loans" ON public.accurate_lending_loans;
DROP POLICY IF EXISTS "Lending modify accurate_lending_loans" ON public.accurate_lending_loans;

DROP POLICY IF EXISTS "Lending view lending_bank_assignments" ON public.lending_bank_assignments;
DROP POLICY IF EXISTS "Lending modify lending_bank_assignments" ON public.lending_bank_assignments;

DROP POLICY IF EXISTS "Lending view lending_documents" ON public.lending_documents;
DROP POLICY IF EXISTS "Lending modify lending_documents" ON public.lending_documents;

DROP POLICY IF EXISTS "Lending view lending_stage_history" ON public.lending_stage_history;
DROP POLICY IF EXISTS "Lending insert lending_stage_history" ON public.lending_stage_history;

-- Helper expression condition: Superadmins, Admins, and authorized Lending Officers
-- Policies for: accurate_lending_loans
CREATE POLICY "Lending view accurate_lending_loans" ON public.accurate_lending_loans
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending modify accurate_lending_loans" ON public.accurate_lending_loans
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

-- Policies for: lending_bank_assignments
CREATE POLICY "Lending view lending_bank_assignments" ON public.lending_bank_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending modify lending_bank_assignments" ON public.lending_bank_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

-- Policies for: lending_documents
CREATE POLICY "Lending view lending_documents" ON public.lending_documents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending modify lending_documents" ON public.lending_documents
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

-- Policies for: lending_stage_history
CREATE POLICY "Lending view lending_stage_history" ON public.lending_stage_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending insert lending_stage_history" ON public.lending_stage_history
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);


-- ==============================================================================
-- 6. CREATE STORAGE BUCKET & STORAGE RLS POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lending-documents',
    'lending-documents',
    false,
    26214400, -- 25 MB
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies for `lending-documents` bucket
DROP POLICY IF EXISTS "Lending officers select lending-documents" ON storage.objects;
DROP POLICY IF EXISTS "Lending officers insert lending-documents" ON storage.objects;
DROP POLICY IF EXISTS "Lending officers delete lending-documents" ON storage.objects;

CREATE POLICY "Lending officers select lending-documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'lending-documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending officers insert lending-documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'lending-documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);

CREATE POLICY "Lending officers delete lending-documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'lending-documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
            OR 'lending' = ANY(portal_access) 
            OR 'accurate_lending' = ANY(portal_access)
        )
    )
);
