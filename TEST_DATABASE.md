# Database Connection Test

## Quick Test in Browser Console

Open your browser console (F12) and run these commands to test the database:

### 1. Test Connection
```javascript
// Test if Supabase is connected
const { data, error } = await window.supabase.from('motorcycles').select('count');
console.log('Connection test:', { data, error });
```

### 2. Test User Creation
```javascript
// Try to create a test user
const { data, error } = await window.supabase
  .from('users')
  .insert({
    name: 'Test User',
    email: 'test' + Date.now() + '@example.com',
    phone: '09123456789'
  })
  .select()
  .single();

console.log('User creation:', { data, error });
```

### 3. Check Existing Users
```javascript
// List all users
const { data, error } = await window.supabase
  .from('users')
  .select('*');

console.log('All users:', { data, error });
```

## Common Errors

### "relation does not exist"
- **Problem:** Table not created
- **Solution:** Run the migration SQL in Supabase SQL Editor

### "duplicate key value violates unique constraint"
- **Problem:** Email already exists
- **Solution:** Use a different email or login with existing email

### "permission denied"
- **Problem:** Row Level Security (RLS) blocking access
- **Solution:** Check RLS policies in Supabase

### "null value in column violates not-null constraint"
- **Problem:** Missing required fields
- **Solution:** Make sure all required fields are provided

## Check Tables in Supabase

1. Go to: https://supabase.com/dashboard/project/hceylmoutuzldbywawtm/editor
2. Check if these tables exist:
   - ✅ users
   - ✅ motorcycles
   - ✅ reservations
   - ✅ transactions
   - ✅ notifications
   - ✅ document_verifications
   - ✅ gps_tracking
   - ✅ admin_users

## Manual User Creation (Workaround)

If signup fails, you can manually create a user:

1. Go to Supabase Table Editor → `users` table
2. Click "Insert row"
3. Fill in:
   - name: `Test User`
   - email: `test@example.com`
   - phone: `09123456789`
4. Click "Save"
5. Then login with `test@example.com`
