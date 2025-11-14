-- Add username field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comment
COMMENT ON COLUMN users.username IS 'Unique username for login (optional)';
