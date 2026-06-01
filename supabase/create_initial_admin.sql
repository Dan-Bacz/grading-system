-- First create the admin Auth user in Supabase Auth with email `admin@test.com`
-- and password `admin123`. This SQL only creates the corresponding profile row.
BEGIN;

-- Ensure admins helper table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY
);

-- Find the auth user for the configured admin email
WITH admin_auth AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'admin@test.com'
)
-- Insert or update the profile row for that user
INSERT INTO public.profiles (user_id, email, full_name, role, status, created_at)
SELECT
  id,
  email,
  'FGBI Admin',
  'admin',
  'active',
  now()
FROM admin_auth
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Mark the user as admin in the helper table
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- Note: This file does not set the Auth password. Create the Auth user and password first
-- in Supabase Auth or using the Supabase Admin API, then run this SQL to link the profile.
