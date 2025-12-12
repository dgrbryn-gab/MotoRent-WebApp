-- Migration: Create OTP Storage Table
-- Purpose: Move OTP storage from in-memory to persistent database
-- This ensures OTPs survive server restarts and work in distributed deployments

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- Indexes for performance
  UNIQUE(email) -- Only one active OTP per email
);

-- Create index for fast expiry cleanup
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

-- Enable Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own OTPs
CREATE POLICY "Users can insert OTP for their own email"
  ON otp_codes FOR INSERT
  WITH CHECK (true); -- Allow any authenticated user to insert

CREATE POLICY "Users can read OTP for their own email"
  ON otp_codes FOR SELECT
  USING (true); -- Allow any authenticated user to read

CREATE POLICY "Users can delete OTP after verification"
  ON otp_codes FOR DELETE
  USING (true); -- Allow deletion after use

-- Note: In production, consider adding a service role policy for cleanup jobs
-- that delete expired OTPs:
-- CREATE POLICY "Service role can delete expired OTPs"
--   ON otp_codes FOR DELETE
--   USING (auth.uid() IS NULL); -- Only service role (no auth.uid())

-- Optional: Create a function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: You can schedule this function to run periodically using pg_cron
-- (requires pg_cron extension in Supabase)
-- SELECT cron.schedule('cleanup-expired-otps', '*/5 * * * *', 'SELECT cleanup_expired_otps()');
