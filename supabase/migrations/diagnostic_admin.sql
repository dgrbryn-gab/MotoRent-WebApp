-- Diagnostic queries to check admin_users setup

-- 1. Check if admin_users table exists and has data
SELECT * FROM admin_users;

-- 2. Check RLS policies on admin_users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- 3. Check if the auth user exists
-- (Run this in Supabase Dashboard -> Authentication -> Users)

-- 4. Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users';

-- 5. Try to insert admin user if it doesn't exist
INSERT INTO admin_users (name, email, role) 
VALUES ('Admin User', 'admin@motorent.com', 'admin')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, role = EXCLUDED.role
RETURNING *;

