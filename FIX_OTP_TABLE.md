# 🔧 Fix: OTP Storage Table Missing

## Problem
The error `Failed to store OTP: Could not find the 'code' column of 'otp_codes' in the schema cache` occurs because the `otp_codes` table hasn't been created in your Supabase database yet.

## Solution
You need to run the migration `021_otp_storage_table.sql` in Supabase.

### Steps to Fix (5 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your MotoRent project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration SQL**
   - Open this file: `supabase/migrations/021_otp_storage_table.sql`
   - Copy ALL the SQL code from the file

4. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor
   - Click the "Run" button (or press Ctrl+Enter)
   - Wait for it to complete successfully

5. **Verify the Table Created**
   - Go to "Table Editor" in Supabase
   - Look for `otp_codes` table in the list
   - You should see these columns:
     - `id` (UUID)
     - `email` (TEXT)
     - `code` (TEXT)
     - `created_at` (TIMESTAMP)
     - `expires_at` (TIMESTAMP)

6. **Test the Sign Up Flow Again**
   - Go back to your app
   - Try signing up with a new email
   - The OTP should now be stored successfully

## What the Migration Does
- Creates the `otp_codes` table to store one-time passwords
- Sets up proper indexes for performance
- Enables Row Level Security (RLS)
- Creates policies allowing OTP management

## If You Get an Error
- **Error: "Table already exists"** → That's fine, it means the table was already created
- **Error: "Permission denied"** → Make sure you're using a service role or have admin privileges
- **Other errors** → Check the error message and ensure you copied the entire SQL file

## Next Steps
After fixing this:
1. ✅ Test sign up flow with a new email
2. ✅ Verify OTP is sent and can be verified
3. ✅ Check for any other migration-related errors

---

**Still having issues?** Check the application logs to see if there are any other schema-related errors.
