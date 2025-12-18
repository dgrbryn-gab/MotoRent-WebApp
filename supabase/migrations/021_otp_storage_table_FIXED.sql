-- OTP Codes Table - COMPLETE SETUP
-- This migration creates the otp_codes table for storing one-time passwords

-- Step 1: Drop existing table if corrupted (safe - uses IF EXISTS)
DROP TABLE IF EXISTS otp_codes CASCADE;

-- Step 2: Create fresh table
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(email)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- Step 4: Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Public insert OTP" ON otp_codes;
DROP POLICY IF EXISTS "Public read OTP" ON otp_codes;
DROP POLICY IF EXISTS "Public delete OTP" ON otp_codes;
DROP POLICY IF EXISTS "Users can insert OTP for their own email" ON otp_codes;
DROP POLICY IF EXISTS "Users can read OTP for their own email" ON otp_codes;
DROP POLICY IF EXISTS "Users can delete OTP after verification" ON otp_codes;

-- Step 6: Create permissive policies (allowing public access for signup flow)
CREATE POLICY "Public insert OTP"
  ON otp_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read OTP"
  ON otp_codes FOR SELECT
  USING (true);

CREATE POLICY "Public delete OTP"
  ON otp_codes FOR DELETE
  USING (true);

-- Step 7: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'otp_codes'
ORDER BY ordinal_position;
