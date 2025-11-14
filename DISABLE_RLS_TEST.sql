-- SIMPLE FIX: Just disable RLS on notifications temporarily to test
-- Run this in Supabase SQL Editor

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
-- Should show rowsecurity = false
