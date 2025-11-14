-- Fix RLS policies for admin_users table
-- Allows authentication queries to check if user is an admin

-- Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Admin users can be queried during login" ON admin_users;
DROP POLICY IF EXISTS "Allow admin login verification" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;

-- Create simple policy to allow SELECT for everyone
-- This is safe because:
-- 1. No passwords are stored in admin_users (they're in auth.users)
-- 2. Only contains email, name, role - public admin info
-- 3. Authentication is still required to actually log in
CREATE POLICY "Allow reading admin_users for login verification" ON admin_users
  FOR SELECT 
  USING (true);

-- Allow authenticated admins to update their own last_login
CREATE POLICY "Allow admins to update their own record" ON admin_users
  FOR UPDATE 
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- =====================================================
-- COMPLETED
-- =====================================================
-- RLS policies fixed for admin_users table
-- Removed recursive policy that was causing infinite recursion
-- Admin login should now work properly
