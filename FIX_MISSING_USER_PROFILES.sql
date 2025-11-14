-- Fix Missing User Profiles
-- This script helps identify and fix users who have auth accounts but no database profile

-- STEP 1: Check which auth users are missing profiles
-- Run this in Supabase SQL Editor to see if there are any orphaned auth users

SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Profile Exists'
  END as status
FROM 
  auth.users au
LEFT JOIN 
  public.users u ON au.id = u.id
ORDER BY 
  au.created_at DESC;


-- STEP 2: Create missing profiles for authenticated users
-- This will create profiles for any auth users that don't have one

INSERT INTO public.users (id, name, email, phone, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1), 'User') as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone', 'N/A') as phone,
  au.created_at,
  NOW() as updated_at
FROM 
  auth.users au
LEFT JOIN 
  public.users u ON au.id = u.id
WHERE 
  u.id IS NULL  -- Only insert if profile doesn't exist
  AND au.email_confirmed_at IS NOT NULL;  -- Only for verified users

-- STEP 3: Verify all users now have profiles

SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles,
  COUNT(*) - COUNT(u.id) as missing_profiles
FROM 
  auth.users au
LEFT JOIN 
  public.users u ON au.id = u.id
WHERE 
  au.email_confirmed_at IS NOT NULL;
