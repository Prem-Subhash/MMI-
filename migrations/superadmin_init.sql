-- Phase 2: RBAC Validation
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS role_check;

ALTER TABLE profiles
ADD CONSTRAINT role_check
CHECK (role IN ('csr','admin','superadmin','accounting'));

-- Phase 13: System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Phase 15: Audit Logging System
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT,
    entity TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now()
);
