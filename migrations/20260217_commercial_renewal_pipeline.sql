/*
  Migration: Setup Commercial Lines Renewal Pipeline
  Description: Adds Commercial Lines Renewal pipeline, stages, and ensures necessary columns exist in temp_leads_basics.
*/

DO $$
DECLARE
    v_pipeline_id UUID;
    v_order INT := 1;
    r RECORD;
BEGIN
    -- 1. Create Commercial Renewal Pipeline
    SELECT id INTO v_pipeline_id FROM pipelines WHERE name = 'Commercial Lines Renewal Pipeline' LIMIT 1;

    IF v_pipeline_id IS NULL THEN
        INSERT INTO pipelines (name, category, is_renewal)
        VALUES ('Commercial Lines Renewal Pipeline', 'Commercial Lines', true)
        RETURNING id INTO v_pipeline_id;
    END IF;

    -- 2. Ensure Schema: Add Missing Columns
    -- policy_flow and insurence_category already exist.
    -- Checking strictly for required fields.
    BEGIN
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS business_name TEXT;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS policy_type TEXT; -- Likely exists
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS renewal_date DATE;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS carrier TEXT;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS policy_number TEXT; -- Likely exists
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS total_premium NUMERIC; -- User requested 'total_premium'
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS renewal_premium NUMERIC;
        -- referral already exists
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Column addition check failed - likely already exists';
    END;

    -- 3. Upsert Stages
    CREATE TEMP TABLE temp_comm_renewal_stages (
        stage_name text,
        mand_fields jsonb
    );

    INSERT INTO temp_comm_renewal_stages (stage_name, mand_fields) VALUES
    ('Quoting in Progress', '["business_profile_updated_ezlynx", "notes"]'::jsonb),
    ('Same Declaration Emailed', '["quoted_multiple_carriers", "autopay_enabled", "agency_fee", "notes"]'::jsonb),
    ('Completed (Same)', '["policy_paid", "notes"]'::jsonb),
    ('Quote Has Been Emailed', '["follow_up_date", "finalized_quote", "carrier_name", "quoted_premium", "agency_fee", "savings_amount", "notes"]'::jsonb),
    ('Consent Letter Sent', '["follow_up_date", "payment_method", "payment_frequency", "notes"]'::jsonb),
    ('Completed (Switch)', '["policy_number", "bound_premium", "expected_commission", "policy_docs_saved", "docs_sent_to_client", "cancelled_previous_carrier", "notes"]'::jsonb),
    ('Cancelled', '["notes"]'::jsonb);

    FOR r IN SELECT * FROM temp_comm_renewal_stages LOOP
        PERFORM 1 FROM pipeline_stages WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        
        IF FOUND THEN
            UPDATE pipeline_stages 
            SET stage_order = v_order, mandatory_fields = r.mand_fields
            WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        ELSE
            INSERT INTO pipeline_stages (pipeline_id, stage_name, stage_order, mandatory_fields)
            VALUES (v_pipeline_id, r.stage_name, v_order, r.mand_fields);
        END IF;

        v_order := v_order + 1;
    END LOOP;

    DROP TABLE temp_comm_renewal_stages;
END $$;
