-- Phase 2: Accurate Lending RBAC & Portal Access Architecture
-- Adds scalable multi-portal/module access model without breaking existing CRM roles

-- 1. Add portal_access array column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS portal_access TEXT[] DEFAULT ARRAY['insurance']::TEXT[];

-- 2. Update existing profiles to default to 'insurance' portal access if null
UPDATE profiles
SET portal_access = ARRAY['insurance']::TEXT[]
WHERE portal_access IS NULL;

-- 3. Allow 'lending' as a valid role in the check constraint if role_check exists
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS role_check;

ALTER TABLE profiles
ADD CONSTRAINT role_check
CHECK (role IN ('csr', 'admin', 'superadmin', 'accounting', 'lending', 'accurate_lending'));

-- 4. Create index for faster array containment queries on portal_access
CREATE INDEX IF NOT EXISTS idx_profiles_portal_access ON profiles USING GIN (portal_access);
