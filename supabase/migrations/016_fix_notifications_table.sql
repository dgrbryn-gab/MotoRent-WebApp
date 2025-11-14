-- Fix notifications table to support document notifications
-- Make reservation_id, motorcycle_name optional and add title field
-- Expand type to support more notification types

-- Drop the old constraint on type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Make reservation_id optional (allow NULL for document notifications)
ALTER TABLE notifications ALTER COLUMN reservation_id DROP NOT NULL;

-- Make motorcycle_name optional (not needed for document notifications)
ALTER TABLE notifications ALTER COLUMN motorcycle_name DROP NOT NULL;

-- Add title column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;

-- Add new type constraint with more options
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'error', 'confirmed', 'rejected'));

-- Update existing confirmed notifications to success type
UPDATE notifications SET type = 'success' WHERE type = 'confirmed';

-- Update existing rejected notifications to error type  
UPDATE notifications SET type = 'error' WHERE type = 'rejected';

-- Add comment
COMMENT ON TABLE notifications IS 'Stores user notifications for reservations and documents';
COMMENT ON COLUMN notifications.reservation_id IS 'Optional - only for reservation-related notifications';
COMMENT ON COLUMN notifications.motorcycle_name IS 'Optional - only for reservation-related notifications';
COMMENT ON COLUMN notifications.title IS 'Notification title/subject';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error, confirmed, rejected';
