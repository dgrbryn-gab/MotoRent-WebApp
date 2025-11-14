-- Add birthday, address, and driver's license fields to users table
-- Migration: 019_add_user_profile_fields

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS driver_license_url TEXT,
ADD COLUMN IF NOT EXISTS license_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_driver_license ON users(driver_license_url) WHERE driver_license_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_license_number ON users(license_number) WHERE license_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.birthday IS 'User date of birth';
COMMENT ON COLUMN users.address IS 'Complete address of the user';
COMMENT ON COLUMN users.driver_license_url IS 'URL to uploaded driver license document in storage';
COMMENT ON COLUMN users.license_number IS 'Driver license number';
COMMENT ON COLUMN users.profile_picture_url IS 'URL to profile picture in storage';
