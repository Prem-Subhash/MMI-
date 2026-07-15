-- ============================================================================
-- MOONSTAR MORTGAGE MODULE — CLEAN 100% EXCEL-MATCHED SUPABASE SQL MIGRATION
-- ============================================================================
-- Namespace: mortgage_* (100% Isolated from Insurance CRM)
-- Philosophy: Strictly implements ONLY what is specified in the client Excel:
--             1. Lookup values for Excel dropdowns (mortgage_lookup_values)
--             2. Master loan/pre-approval table with exact Excel columns (mortgage_loans)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. LOOKUP VALUES TABLE FOR EXCEL DROPDOWNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mortgage_lookup_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL CHECK (category IN ('TRANSACTION_TYPE', 'LOAN_TYPE', 'LOAN_TERM', 'WHOLESALE_LENDER', 'LOAN_OFFICER', 'PROCESSOR')),
    code VARCHAR(100) NOT NULL,
    display_label VARCHAR(150) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mortgage_lookup_category_code UNIQUE (category, code)
);

-- ============================================================================
-- 2. MASTER LOAN & PRE-APPROVAL TABLE (100% EXCEL COLUMNS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mortgage_loans (
    -- Primary Identifier & Pipeline Classification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_type VARCHAR(50) NOT NULL CHECK (pipeline_type IN ('NEW_LOAN', 'PRE_APPROVAL')),
    stage VARCHAR(50) NOT NULL CHECK (
        stage IN (
            'NEW_LOAN',
            'SUBMIT_TO_UW',
            'INITIAL_COMPLIANCE',
            'FINAL_COMPLIANCE',
            'CLOSING',
            'AUDIT',
            'PREAPPROVAL_LOAN',
            'MANUAL_UW'
        )
    ),

    -- Summary / Master Grid Columns (Columns A - U from Excel)
    client_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT, -- Not mandatory per Excel
    state VARCHAR(100) NOT NULL,
    application_received VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (application_received IN ('Y', 'N')),
    application_received_date DATE,
    inquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(100) NOT NULL,
    loan_type VARCHAR(100) NOT NULL,
    estimated_property_value NUMERIC(14, 2),
    estimated_credit_score INTEGER,
    loan_term VARCHAR(50) NOT NULL,
    target_closing_date DATE,
    loan_officer_name VARCHAR(150) NOT NULL,
    processor_name VARCHAR(150),
    all_documents_received VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (all_documents_received IN ('Y', 'N')),
    missing_documents_list TEXT, -- Textbox if N per Excel
    follow_up_date DATE,
    expected_commission NUMERIC(14, 2),
    additional_notes TEXT, -- Box for multiple lines of text per Excel

    -- Pre-Approval Specific Columns (Stage 2: MANUAL UW)
    uw_completed VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (uw_completed IN ('Y', 'N')),
    val_requested VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (val_requested IN ('Y', 'N')),
    preapproval_amount NUMERIC(14, 2),
    down_payment_request NUMERIC(14, 2),
    preapproval_sent_to_client VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (preapproval_sent_to_client IN ('Y', 'N')),
    preapproval_sent_date DATE,

    -- New Loan Pipeline Stage 2: SUBMIT TO UW
    lender_name VARCHAR(150),
    submission_date DATE,
    loan_amount NUMERIC(14, 2),
    moonstar_disclosure_sent VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (moonstar_disclosure_sent IN ('Y', 'N')),
    lender_disclosure_sent VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (lender_disclosure_sent IN ('Y', 'N')),
    received_all_uw_documents VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (received_all_uw_documents IN ('Y', 'N')),
    rate_locked VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (rate_locked IN ('Y', 'N')),
    interest_rate NUMERIC(6, 3),
    lock_expire_date DATE,

    -- New Loan Pipeline Stage 3: INITIAL COMPLIANCE
    moonstar_disclosure_signed_3day VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (moonstar_disclosure_signed_3day IN ('Y', 'N')),
    moonstar_disclosure_signed_date DATE,
    lender_disclosure_signed_3day VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (lender_disclosure_signed_3day IN ('Y', 'N')),
    lender_disclosure_signed_date DATE,
    anti_predatory_completed VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (anti_predatory_completed IN ('Y', 'N', 'NA')),
    anti_predatory_completed_date DATE,
    conditionally_approved VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (conditionally_approved IN ('Y', 'N')),
    pending_conditions_text TEXT,
    appraisal_ordered VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (appraisal_ordered IN ('Y', 'N', 'NA')),
    title_ordered VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (title_ordered IN ('Y', 'N')),
    condo_questionnaire_requested VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (condo_questionnaire_requested IN ('Y', 'N', 'NA')),
    hoi_requested VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (hoi_requested IN ('Y', 'N', 'NA')),

    -- New Loan Pipeline Stage 4: FINAL COMPLIANCE
    moonstar_disclosure_2_signed VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (moonstar_disclosure_2_signed IN ('Y', 'N')),
    moonstar_disclosure_2_signed_date DATE,
    appraisal_sent_to_client VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (appraisal_sent_to_client IN ('Y', 'N', 'NA')),
    appraisal_sent_date DATE,
    cd_requested VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (cd_requested IN ('Y', 'N')),
    appraised_value_amount NUMERIC(14, 2),
    ctc_status VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (ctc_status IN ('Y', 'N')),
    cd_acknowledged VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (cd_acknowledged IN ('Y', 'N')),
    closing_confirmation_received VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (closing_confirmation_received IN ('Y', 'N')),
    voe_cleared VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (voe_cleared IN ('Y', 'N')),

    -- New Loan Pipeline Stage 5: CLOSING
    credit_report_invoice_submitted VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (credit_report_invoice_submitted IN ('Y', 'N')),
    condo_invoice_submitted VARCHAR(10) NOT NULL DEFAULT 'NA' CHECK (condo_invoice_submitted IN ('Y', 'N', 'NA')),
    final_interest_rate NUMERIC(6, 3),
    final_loan_amount NUMERIC(14, 2),
    final_cd_received VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (final_cd_received IN ('Y', 'N')),
    closing_schedule VARCHAR(255),

    -- New Loan Pipeline Stage 6: AUDIT
    closing_docs_downloaded VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (closing_docs_downloaded IN ('Y', 'N')),
    appraisal_downloaded VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (appraisal_downloaded IN ('Y', 'N')),
    title_report_downloaded VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (title_report_downloaded IN ('Y', 'N')),
    moonstar_audit_completed VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (moonstar_audit_completed IN ('Y', 'N')),
    title_check_received VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (title_check_received IN ('Y', 'N')),
    check_wire_amount_received NUMERIC(14, 2),
    client_refund_amount NUMERIC(14, 2),
    loan_log_updated VARCHAR(10) NOT NULL DEFAULT 'N' CHECK (loan_log_updated IN ('Y', 'N')),

    -- Standard Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mortgage_loans_pipeline_stage ON mortgage_loans(pipeline_type, stage);
CREATE INDEX IF NOT EXISTS idx_mortgage_loans_officer ON mortgage_loans(loan_officer_name);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE mortgage_lookup_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgage_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mortgage_lookup_values_policy ON mortgage_lookup_values;
CREATE POLICY mortgage_lookup_values_policy ON mortgage_lookup_values
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS mortgage_loans_policy ON mortgage_loans;
CREATE POLICY mortgage_loans_policy ON mortgage_loans
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 5. SEED EXCEL LOOKUP DROPDOWN VALUES (EXACT VALUES FROM EXCEL)
-- ============================================================================

-- A. Transaction Types
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('TRANSACTION_TYPE', 'PURCHASE', 'Purchase', 1),
    ('TRANSACTION_TYPE', 'REFINANCE', 'Refinance', 2),
    ('TRANSACTION_TYPE', 'CASHOUT_REFINANCE', 'Cashout Refinance', 3),
    ('TRANSACTION_TYPE', 'HELOC', 'HELOC', 4),
    ('TRANSACTION_TYPE', 'PRE_APPROVAL', 'Pre-approval', 5),
    ('TRANSACTION_TYPE', 'DSCR', 'DSCR', 6)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- B. Loan Types
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('LOAN_TYPE', 'CONVENTIONAL', 'Conventional', 1),
    ('LOAN_TYPE', 'FHA', 'FHA', 2),
    ('LOAN_TYPE', 'JUMBO', 'Jumbo', 3),
    ('LOAN_TYPE', 'VA', 'VA', 4),
    ('LOAN_TYPE', 'NON_QM', 'Non QM', 5),
    ('LOAN_TYPE', 'USDA', 'USDA', 6)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- C. Loan Terms
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('LOAN_TERM', '30_YRS', '30 YRS', 1),
    ('LOAN_TERM', '25_YRS', '25 YRS', 2),
    ('LOAN_TERM', '20_YRS', '20 YRS', 3),
    ('LOAN_TERM', '15_YRS', '15 YRS', 4),
    ('LOAN_TERM', '10_YRS', '10 YRS', 5),
    ('LOAN_TERM', '5_YRS_ARM', '5 YRS ARM', 6),
    ('LOAN_TERM', '7_YRS_ARM', '7 YRS ARM', 7),
    ('LOAN_TERM', 'OTHER', 'Other (Manual Input)', 8)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- D. Wholesale Lenders
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('WHOLESALE_LENDER', 'ROCKET_MORTGAGE', 'Rocket Mortgage', 1),
    ('WHOLESALE_LENDER', 'PENNYMAC', 'Pennymac', 2),
    ('WHOLESALE_LENDER', 'KIND', 'Kind', 3),
    ('WHOLESALE_LENDER', 'RCN', 'RCN', 4),
    ('WHOLESALE_LENDER', 'TOWNE', 'Towne', 5),
    ('WHOLESALE_LENDER', 'OTHER', 'Other (Manual Input)', 6)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- E. Loan Officers
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('LOAN_OFFICER', 'KUNAL_MAJMUNDAR', 'Kunal Majmundar', 1),
    ('LOAN_OFFICER', 'HEMANT_SHAH', 'Hemant Shah', 2),
    ('LOAN_OFFICER', 'SUNNY_THAKKAR', 'Sunny Thakkar', 3),
    ('LOAN_OFFICER', 'DHARMESH_JADHAV', 'Dharmesh Jadhav', 4),
    ('LOAN_OFFICER', 'MANISH_KA_PATEL', 'Manish Ka Patel', 5),
    ('LOAN_OFFICER', 'NIRAV_SHAH', 'Nirav Shah', 6),
    ('LOAN_OFFICER', 'RAJ_GOVIND', 'Raj Govind', 7),
    ('LOAN_OFFICER', 'NISHITA_DALAL', 'Nishita Dalal', 8),
    ('LOAN_OFFICER', 'CHIRAG_DANGARWALA', 'Chirag Dangarwala', 9),
    ('LOAN_OFFICER', 'OTHER', 'Other (Manual Input)', 10)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- F. Processors
INSERT INTO mortgage_lookup_values (category, code, display_label, display_order)
VALUES
    ('PROCESSOR', 'JASON', 'Jason', 1),
    ('PROCESSOR', 'VANDANA', 'Vandana', 2),
    ('PROCESSOR', 'OTHER', 'Other (Manual Input)', 3)
ON CONFLICT (category, code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order;

-- ============================================================================
-- END OF CLEAN 100% EXCEL-MATCHED MORTGAGE SCHEMA
-- ============================================================================
