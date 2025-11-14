-- Update notifications table to support new notification structure
-- This allows for more flexible notifications with title and different types

-- Drop the old type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Make reservation_id and motorcycle_name nullable (not all notifications are about reservations)
ALTER TABLE notifications ALTER COLUMN reservation_id DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN motorcycle_name DROP NOT NULL;

-- Add title column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Update type to support more notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'error', 'confirmed', 'rejected'));

-- Migrate existing data: populate title from type for old notifications
UPDATE notifications 
SET title = CASE 
  WHEN type = 'confirmed' THEN '✅ Reservation Approved'
  WHEN type = 'rejected' THEN '❌ Reservation Rejected'
  ELSE 'Notification'
END
WHERE title IS NULL;

-- Make title required after migration
ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;

-- Add comment
COMMENT ON TABLE notifications IS 'User notifications with flexible types and optional reservation references';
