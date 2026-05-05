-- =====================================================
-- FIX: Restore admin_users Table Schema
-- =====================================================
-- The admin_users table is missing critical columns
-- This will add them back

-- Add missing columns if they don't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;
