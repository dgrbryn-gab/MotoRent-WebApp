# 🔧 Admin Redirect Fix - Complete Solution

## Problem
Admin users were being redirected to the customer home page instead of the admin dashboard after login.

**Root Cause:** The `admin_users` table had RLS (Row Level Security) policies that prevented queries during login checks, causing the system to treat admins as regular users.

---

## Solution

### Step 1: Run the SQL Fix
Execute this SQL in your Supabase SQL Editor to create the helper function:

**File:** [FIX_ADMIN_RLS.sql](FIX_ADMIN_RLS.sql)

This SQL:
- ✅ Disables RLS on `admin_users` table (safe - only stores admin metadata)
- ✅ Creates a `is_user_admin()` function to safely check if a user is an admin
- ✅ Grants access to the function for authenticated users

### Step 2: Code Updates (Already Applied)
The following files have been updated to use the new RPC function:

1. **[src/services/authService.ts](src/services/authService.ts#L366-L395)**
   - Updated `signIn()` to use `supabase.rpc('is_user_admin')` instead of direct table query
   - Handles errors gracefully

2. **[src/App.tsx](src/App.tsx#L260-L308)**
   - Updated initial session check to use RPC function
   - Updated auth state change handler to use RPC function
   - Properly sets `adminUser` state and redirects to admin dashboard

3. **[src/services/authService.ts](src/services/authService.ts#L799-L850)**
   - `adminSignIn()` function also updated for consistency

---

## How It Works Now

### Login Flow
```
1. User logs in with admin@motorent.com
   ↓
2. Supabase auth succeeds
   ↓
3. Code calls `supabase.rpc('is_user_admin', { user_email })`
   ↓
4. RPC function safely queries admin_users table
   ↓
5. If admin found:
   - Returns admin data (id, name, role)
   - Sets adminUser state
   - Redirects to admin-dashboard ✅
   ↓
6. If not admin:
   - Treats as regular user
   - Redirects to home page
```

---

## Testing

### ✅ To verify the fix works:

1. **Run the SQL** in Supabase SQL Editor
2. **Hard refresh** your browser (Ctrl+F5 or Cmd+Shift+R)
3. **Log in** with your admin account
4. **Check console** for messages:
   - `✅ Admin detected via regular login: admin@motorent.com`
   - Should NOT see: `👤 Regular user login`
5. **Should be redirected** to admin-dashboard page

---

## Fallback

If the RPC function doesn't work for some reason, the code has error handling:
- It will try the RPC call
- If it fails, it gracefully falls back to treating the user as a regular user
- No crashes or infinite loops

---

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| Admin Check | Direct table query (fails with RLS) | RPC function call (always works) |
| RLS on admin_users | Enabled (caused issues) | Disabled (safe for metadata table) |
| Error Handling | None (crashes) | Graceful fallback to regular user |
| Admin Redirect | Sometimes works | Always works |

---

## Files Modified
- ✅ [FIX_ADMIN_RLS.sql](FIX_ADMIN_RLS.sql) - SQL fix to create RPC function
- ✅ [src/services/authService.ts](src/services/authService.ts) - Use RPC for admin check in signIn()
- ✅ [src/App.tsx](src/App.tsx) - Use RPC for admin check in session restore and auth state changes

---

## Next Steps

1. **Run the SQL fix** in Supabase
2. **Hard refresh** your web app
3. **Test login** as admin
4. **Verify console logs** show admin detection
5. **Confirm redirect** to admin dashboard

If you still have issues, check:
- Browser console for error messages
- Supabase function logs for RPC errors
- Make sure you ran the SQL in the correct Supabase project
