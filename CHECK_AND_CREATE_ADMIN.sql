-- ========================================
-- CHECK AND CREATE ADMIN ACCOUNTS
-- ========================================
-- This script checks if admin accounts exist and creates them if needed

-- Step 1: Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) as admin_table_exists;

-- Step 2: Check existing admin accounts
SELECT * FROM admin_users;

-- Step 3: Insert admin accounts if they don't exist
-- (This will fail silently if they already exist due to unique email constraint)

-- Insert Regular Admin
INSERT INTO admin_users (name, email, role)
VALUES ('Regular Admin', 'admin@motorent.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Step 4: Verify admin accounts were created
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  last_login
FROM admin_users
ORDER BY created_at;

-- ========================================
-- NEXT STEPS:
-- ========================================
-- After running this script:
-- 1. You need to create the authentication accounts in Supabase Auth
-- 2. Go to Supabase Dashboard > Authentication > Users
-- 3. Click "Add User" and create:
--    - Email: admin@motorent.com, Password: admin123
--    - Email: superadmin@motorent.com, Password: super123
-- 4. The emails should match the ones in admin_users table
-- ========================================
