-- Migration: Setup Personal Lines Renewal Pipeline
-- Description: Creates the pipeline and its stages with defined mandatory fields (JSONB format).

DO $$
DECLARE
    v_pipeline_id UUID;
    v_order INT := 1;
    r RECORD;
BEGIN
    -- 1. Create or Get Pipeline ID
    -- We allow either 'Personal Lines Renewal' or 'Personal Line Renewal' to be safe
    SELECT id INTO v_pipeline_id FROM pipelines WHERE name IN ('Personal Lines Renewal', 'Personal Line Renewal') LIMIT 1;

    IF v_pipeline_id IS NULL THEN
        INSERT INTO pipelines (name, description, category, type)
        VALUES ('Personal Lines Renewal', 'Pipeline for existing policy renewals', 'Personal Lines', 'Renewal')
        RETURNING id INTO v_pipeline_id;
    END IF;

    -- 2. Ensure Schema: Add mandatory_fields column if missing
    -- User schema shows mandatory_fields is jsonb
    BEGIN
        ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS mandatory_fields JSONB DEFAULT '[]'::jsonb;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Column mandatory_fields already exists or could not be added';
    END;

    -- 3. Upsert Stages
    -- Using a TEMP TABLE to define our desired stages
    CREATE TEMP TABLE temp_input_stages (
        stage_name text,
        mand_fields jsonb
    );

    INSERT INTO temp_input_stages (stage_name, mand_fields) VALUES
    ('Quoting in Progress', '["ezlynx_updated"]'::jsonb),
    ('Same Declaration Emailed', '["quoted_multiple_carriers", "autopay_setup"]'::jsonb),
    ('Completed (Same)', '["paid_for_renewal"]'::jsonb),
    ('Quote Has been Emailed', '["follow_up_date", "quote_finalized", "carrier_quote_sent", "quoted_premium", "savings_amount"]'::jsonb),
    ('Consent Letter Sent', '["follow_up_date", "payment_method", "payment_frequency"]'::jsonb),
    ('Completed (Switch)', '["policy_number", "bound_premium", "expected_commission", "docs_saved_ezlynx", "docs_sent_to_client", "cancelled_prev_carrier"]'::jsonb),
    ('Cancelled', '["cancellation_reason"]'::jsonb);

    FOR r IN SELECT * FROM temp_input_stages LOOP
        -- Check if stage exists
        PERFORM 1 FROM pipeline_stages WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        
        IF FOUND THEN
            -- Update existing
            UPDATE pipeline_stages 
            SET stage_order = v_order, mandatory_fields = r.mand_fields
            WHERE pipeline_id = v_pipeline_id AND stage_name = r.stage_name;
        ELSE
            -- Insert new
            INSERT INTO pipeline_stages (pipeline_id, stage_name, stage_order, mandatory_fields)
            VALUES (v_pipeline_id, r.stage_name, v_order, r.mand_fields);
        END IF;

        v_order := v_order + 1;
    END LOOP;

    DROP TABLE temp_input_stages;
    
END $$;
