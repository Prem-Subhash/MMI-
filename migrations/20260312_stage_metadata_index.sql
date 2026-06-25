-- Performance Index Migration for JSONB Querying

CREATE INDEX IF NOT EXISTS idx_stage_metadata
ON temp_leads_basics
USING GIN (stage_metadata);
