-- ==============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================
-- This adds username field to the users table
-- ==============================================================

-- Step 1: Add username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Step 2: Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Step 3: Add comment
COMMENT ON COLUMN users.username IS 'Unique username for login (optional)';

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
