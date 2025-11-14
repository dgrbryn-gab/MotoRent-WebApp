-- ==============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================
-- This fixes the notifications table to allow creating notifications
-- ==============================================================

-- Step 1: Drop ALL existing policies on notifications
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON notifications;
DROP POLICY IF EXISTS "Allow service role to create notifications" ON notifications;

-- Step 2: Create new policies that allow all authenticated operations

-- Allow anyone authenticated to create notifications FOR ANY USER
-- This is needed because admins create notifications for customers
CREATE POLICY "Anyone authenticated can create notifications" ON notifications
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);  -- No restriction on who can create notifications

-- Allow users to view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);

-- Allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their notifications" ON notifications
  FOR DELETE
  TO authenticated, anon
  USING (auth.uid() = user_id);

-- Step 3: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
