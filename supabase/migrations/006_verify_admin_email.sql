-- Verify admin email addresses
-- This allows admins to log in without email verification

-- Update admin user to mark email as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'admin@motorent.com';

-- Also verify super admin if exists
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'superadmin@motorent.com';

-- =====================================================
-- COMPLETED
-- =====================================================
-- Admin emails are now verified
-- Admin login should work without email verification
