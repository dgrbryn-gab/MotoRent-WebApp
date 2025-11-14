-- Enable Email OTP for user verification
-- This migration enables OTP-based email verification instead of confirmation links

-- Note: The following settings need to be configured in the Supabase Dashboard:
-- Auth -> Settings -> Email Auth
-- 1. Enable email confirmations: true
-- 2. Enable email OTP: true  
-- 3. Disable secure email change: false (can remain enabled)

-- SQL configurations that can be set programmatically
-- (These are backup configurations if dashboard settings don't persist)

-- This migration creates functions to help manage OTP flow
-- Since auth configuration is primarily done via dashboard

CREATE OR REPLACE FUNCTION is_valid_email_otp(
  email_input text,
  token_input text
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- This function will be used to verify OTP tokens
  -- Implementation depends on Supabase's internal OTP verification
  -- For now, this is a placeholder that always returns false
  -- The actual verification will be done via supabase.auth.verifyOtp()
  SELECT false;
$$;

-- Create a helper function to check if user email is verified
CREATE OR REPLACE FUNCTION is_email_verified(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  );
$$;

-- Comments for manual configuration in Supabase Dashboard:
-- 1. Go to Authentication -> Settings in your Supabase dashboard
-- 2. Under "Auth Providers" -> Email, enable "Enable email confirmations"
-- 3. Under "Security and Validation" -> "Email OTP", enable it
-- 4. Under "Email Templates" -> "Confirm signup", modify the template to show OTP code:
--    Template should include: {{ .Token }} instead of {{ .ConfirmationURL }}
-- 5. Set "Enable custom SMTP" if you want branded emails

COMMENT ON FUNCTION is_valid_email_otp IS 'Helper function for OTP verification - actual verification done via Supabase Auth';
COMMENT ON FUNCTION is_email_verified IS 'Check if user email is verified';