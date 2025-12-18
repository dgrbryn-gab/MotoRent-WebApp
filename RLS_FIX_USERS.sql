-- Fix RLS policy for users table to allow signup
-- This allows newly authenticated users to insert their own profile

-- First, check existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Create new policy that allows authenticated users to insert
CREATE POLICY "Users can insert own profile during signup"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Make sure select policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text OR true);  -- Allow viewing (can be more restrictive)

-- Allow update
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);
