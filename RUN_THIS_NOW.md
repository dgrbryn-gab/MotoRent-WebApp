# ⚡ URGENT: Run This SQL Now to Fix OTP Error

## What to Do (RIGHT NOW - 2 minutes)

### Step 1: Go to Supabase SQL Editor
- Open: https://supabase.com/dashboard
- Select your MotoRent project
- Click **SQL Editor** (left sidebar)
- Click **New Query**

### Step 2: Copy the FIXED Migration
1. Open this file: `supabase/migrations/021_otp_storage_table_FIXED.sql`
2. Copy ALL the code
3. Paste into Supabase SQL Editor
4. Click **RUN** (or Ctrl+Enter)

### Step 3: Check for Success
You should see output like:
```
column_name  | data_type                  | is_nullable | column_default
id           | uuid                       | f           | gen_random_uuid()
email        | text                       | f           | NULL
code         | text                       | f           | NULL
created_at   | timestamp with time zone   | t           | now()
expires_at   | timestamp with time zone   | f           | NULL
```

If you see this table structure, **the fix worked!** ✅

### Step 4: Test Sign Up Again
1. Go back to your app
2. Try signing up with a new email
3. The OTP should now be stored successfully

---

## Why This Fixed It

The original migration had issues with:
- ❌ RLS policies that were too restrictive
- ❌ TIMESTAMP type without timezone info
- ❌ Potential table corruption if it partially existed

The FIXED version:
- ✅ Drops and recreates cleanly
- ✅ Uses permissive policies for signup flow
- ✅ Uses proper TIMESTAMP WITH TIME ZONE
- ✅ Verifies the table structure at the end

---

## If You Still Get an Error

### Error: "Permission denied"
→ You need to be logged in as project admin. Click your profile icon in Supabase and verify you're an admin.

### Error: "Table already exists"
→ Good! Try this simpler SQL instead:
```sql
DROP TABLE IF EXISTS otp_codes CASCADE;
-- Then run the FIXED migration again
```

### Error: Something about policies
→ Run this to reset RLS:
```sql
DROP POLICY IF EXISTS "Public insert OTP" ON otp_codes;
DROP POLICY IF EXISTS "Public read OTP" ON otp_codes;
DROP POLICY IF EXISTS "Public delete OTP" ON otp_codes;

ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Then recreate policies from FIXED migration
```

---

## IMPORTANT: After the Fix

Once the table is created, you need to **RESTART your app** so it sees the new table:

1. Go back to your terminal where the app is running
2. Stop the app (Ctrl+C)
3. Restart it: `npm run dev`
4. Try signing up again

The app caches table info, so restarting ensures it picks up the new table.
