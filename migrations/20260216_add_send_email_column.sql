/*
  Migration: Add send_email_to_client to temp_leads_basics
  Description: Adds a boolean column to track if a document request email should be sent.
*/

DO $$
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'temp_leads_basics' 
        AND column_name = 'send_email_to_client'
    ) THEN
        ALTER TABLE temp_leads_basics 
        ADD COLUMN send_email_to_client BOOLEAN DEFAULT false;
    END IF;

    -- Ensure it's nullable or has default (already handled by DEFAULT false, but explicit check good practice)
    -- This is safe for existing rows, they will get 'false'.
END $$;
