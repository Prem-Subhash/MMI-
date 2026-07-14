-- ============================================================================
-- MORTGAGE USERS & PROFILES SETUP MIGRATION
-- ============================================================================

-- 1. Create mortgage_users table if it does not exist
CREATE TABLE IF NOT EXISTS mortgage_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE mortgage_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mortgage_users_policy ON mortgage_users;
CREATE POLICY mortgage_users_policy ON mortgage_users
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. Seed mortgageadmin@moonstar.com into mortgage_users
INSERT INTO mortgage_users (auth_id, email, full_name, role)
VALUES ('f1aabd21-5727-485a-beb6-756841b4f275', 'mortgageadmin@moonstar.com', 'Mortgage Admin', 'admin')
ON CONFLICT (email) DO UPDATE
SET auth_id = EXCLUDED.auth_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 3. Ensure profiles entry exists with portal_access = ['mortgage']
INSERT INTO profiles (id, email, role, full_name, portal_access)
VALUES ('f1aabd21-5727-485a-beb6-756841b4f275', 'mortgageadmin@moonstar.com', 'mortgage', 'Mortgage Admin', ARRAY['mortgage'])
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    portal_access = EXCLUDED.portal_access;
