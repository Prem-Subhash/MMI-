/*
  Migration: Setup Commercial Lines Pipeline (Corrected Schema)
  Description: Adds Commercial Lines pipeline (without description/type columns), stages, and necessary columns to temp_leads_basics.
*/

DO $$
DECLARE
    v_pipeline_id UUID;
    v_order INT := 1;
    r RECORD;
BEGIN
    -- 1️⃣ Create or Get Pipeline ID
    SELECT id INTO v_pipeline_id 
    FROM pipelines 
    WHERE name = 'Commercial Lines Pipeline' 
    LIMIT 1;

    IF v_pipeline_id IS NULL THEN
        INSERT INTO pipelines (name, category, is_renewal)
        VALUES ('Commercial Lines Pipeline', 'Commercial Lines', false)
        RETURNING id INTO v_pipeline_id;
    END IF;

    -- 2️⃣ Ensure Schema: Add new mandatory columns for Commercial Lines
    BEGIN
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS business_name TEXT;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS request_type TEXT;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS effective_date DATE;
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS date_received TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE temp_leads_basics ADD COLUMN IF NOT EXISTS referral TEXT;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Column addition check failed - likely already exists';
    END;

    -- 3️⃣ Upsert Commercial Stages
    CREATE TEMP TABLE temp_commercial_stages (
        stage_name text,
        mand_fields jsonb
    );

    INSERT INTO temp_commercial_stages (stage_name, mand_fields) VALUES
    ('Quoting in Progress', '["target_completion_date", "documents_saved_filecenter", "required_documents_received", "notes"]'::jsonb),
    ('Quote Has Been Emailed', '["follow_up_date", "finalized_quote", "carrier_name", "quoted_premium", "agency_fees"]'::jsonb),
    ('Consent Letter Sent', '["follow_up_date", "payment_method", "payment_frequency", "notes"]'::jsonb),
    ('Completed', '["policy_number", "bound_premium", "expected_commission", "agency_fees", "policy_docs_saved", "docs_sent_to_client"]'::jsonb),
    ('Did Not Bind', '["reason_not_bound", "notes"]'::jsonb);

    FOR r IN SELECT * FROM temp_commercial_stages LOOP
        
        PERFORM 1 
        FROM pipeline_stages 
        WHERE pipeline_id = v_pipeline_id 
        AND stage_name = r.stage_name;

        IF FOUND THEN
            -- Update existing logic/fields if redefined (upsert logic)
            UPDATE pipeline_stages 
            SET stage_order = v_order,
                mandatory_fields = r.mand_fields
            WHERE pipeline_id = v_pipeline_id
            AND stage_name = r.stage_name;
        ELSE
            -- Insert new
            INSERT INTO pipeline_stages (pipeline_id, stage_name, stage_order, mandatory_fields)
            VALUES (v_pipeline_id, r.stage_name, v_order, r.mand_fields);
        END IF;

        v_order := v_order + 1;
    END LOOP;

    DROP TABLE temp_commercial_stages;

END $$;
