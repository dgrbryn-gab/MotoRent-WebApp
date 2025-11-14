-- Fix notifications table RLS policies to allow inserts from authenticated users and service role

-- Drop existing policy that might be too restrictive
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Create new policy that allows authenticated users to create notifications
CREATE POLICY "Allow authenticated users to create notifications" ON notifications
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Also allow service role to create notifications (for backend operations)
CREATE POLICY "Allow service role to create notifications" ON notifications
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Ensure users can still view their own notifications (keep existing policy)
-- The existing "Users can view own notifications" policy should remain

-- Ensure users can update their own notifications (for marking as read)
-- The existing "Users can update own notifications" policy should remain
