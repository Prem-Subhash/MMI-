-- Add reminder_sent column to temp_leads_basics
ALTER TABLE temp_leads_basics 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
