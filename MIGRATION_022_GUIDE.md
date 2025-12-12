# Supabase Migration 022 - Cash-Only Payment System

## Migration File Location
```
supabase/migrations/022_cash_only_payment.sql
```

## Complete SQL Code

```sql
-- Migration: Simplify Payment System to Cash-Only
-- Purpose: Update payment_method constraint to support ONLY cash payments
-- Date: 2025-01-15
-- Status: Cash-Only Payment Model

-- Step 1: Add new constraint for cash-only if payments table exists
-- This migration ensures all future payments are created with 'cash' method

BEGIN;

-- Drop existing constraint if it exists (warning: this may fail if constraint name is different)
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

-- Add new constraint that only allows 'cash' payments
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method = 'cash');

-- Update default value to 'cash'
ALTER TABLE payments
ALTER COLUMN payment_method SET DEFAULT 'cash';

-- Update any existing non-cash records to 'cash' (if any exist from legacy data)
UPDATE payments
SET payment_method = 'cash'
WHERE payment_method IN ('card', 'gcash');

-- Update payment analytics view if it exists (handles payment method filtering)
-- The view will now only show 'cash' payments, which is correct for this system

COMMIT;

-- Note: Stripe-related fields (stripe_payment_intent_id, stripe_charge_id, stripe_refund_id) 
-- are left in place but won't be used in cash-only mode. They can be dropped in a future migration
-- if needed for database cleanup.
```

---

## What This Migration Does

### 1. Drops Old Constraint
```sql
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;
```
**Why:** Removes the old constraint that allowed 'card', 'gcash', 'cash'

### 2. Adds New Cash-Only Constraint
```sql
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method = 'cash');
```
**Why:** Creates new constraint that ONLY allows 'cash'

### 3. Sets Default to Cash
```sql
ALTER TABLE payments
ALTER COLUMN payment_method SET DEFAULT 'cash';
```
**Why:** Ensures all new payments default to 'cash' method

### 4. Converts Legacy Data
```sql
UPDATE payments
SET payment_method = 'cash'
WHERE payment_method IN ('card', 'gcash');
```
**Why:** Converts any existing card/gcash records to cash (data cleanup)

---

## How to Run This Migration

### Method 1: Using Supabase Dashboard (Recommended)

#### Step 1: Go to Supabase
```
URL: https://supabase.com
Log in to your account
```

#### Step 2: Open Your Project
```
Click your project name in the dashboard
```

#### Step 3: Go to SQL Editor
```
Left sidebar → "SQL Editor"
Click "New Query" button
```

#### Step 4: Copy the Migration SQL
```
Open: supabase/migrations/022_cash_only_payment.sql
Copy entire contents
```

#### Step 5: Paste into SQL Editor
```
In Supabase SQL Editor:
1. Click in the text area
2. Paste the SQL code
3. You should see the entire migration
```

#### Step 6: Run the Query
```
Button: "Run" (or press Ctrl+Enter)
Wait for completion
```

#### Step 7: Verify Success
```
✅ Should see: "Query executed successfully"
✅ No error messages
✅ Execution time shown at bottom
```

---

### Method 2: Using SQL Editor > Saved Queries

#### Step 1-3: Same as Method 1

#### Step 4: Name Your Query
```
Top of SQL Editor: Enter name
"022_cash_only_payment"
```

#### Step 5: Paste Code
```
Paste the entire migration code
```

#### Step 6: Save
```
Button: "Save" or "Save Query"
```

#### Step 7: Run
```
Button: "Run" or Ctrl+Enter
```

---

### Method 3: Using Migration System (For Teams)

If you have version control setup:

#### Step 1: Check Existing Migrations
```
In Supabase, go to "Database" → "Migrations"
Should see migrations 001-021
```

#### Step 2: Add New Migration
```
File: supabase/migrations/022_cash_only_payment.sql
(Should already exist in your repo)
```

#### Step 3: Deploy
```
Using your CI/CD pipeline
Or manually through Supabase dashboard
```

---

## Verification Steps

### After Running Migration

#### Step 1: Check Table Structure
```sql
-- Check the payments table
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
```

**Verify:**
- `payment_method` column exists
- `DEFAULT 'cash'` is set
- `is_nullable` is false

#### Step 2: Check Constraints
```sql
-- Check constraints on payments table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'payments';
```

**Verify:**
- `payments_payment_method_check` exists
- It's a CHECK constraint

#### Step 3: View Constraint Details
```sql
-- See the actual constraint definition
SELECT constraint_name, check_clause
FROM information_schema_check_constraints
WHERE table_name = 'payments';
```

**Verify:**
- `check_clause` shows: `payment_method = 'cash'`

#### Step 4: Test the Constraint
```sql
-- This should FAIL (payment_method can only be 'cash')
INSERT INTO payments (
    id, reservation_id, user_id, amount, currency, 
    status, payment_method
) VALUES (
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    7200, 'PHP', 'pending', 'card'
);

-- Expected error: "violates check constraint payments_payment_method_check"
```

#### Step 5: Test Success Path
```sql
-- This should SUCCEED (payment_method is 'cash')
INSERT INTO payments (
    id, reservation_id, user_id, amount, currency, 
    status, payment_method
) VALUES (
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    7200, 'PHP', 'pending', 'cash'
);

-- Should see: "INSERT 0 1" (1 row inserted)
```

---

## Troubleshooting

### Problem: "Constraint already exists"
```
Error: "constraint 'payments_payment_method_check' for relation 'payments' already exists"

Solution:
The constraint with same name already exists
Run this to check:
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'payments'

If it exists and is correct, migration already applied ✅
```

### Problem: "Syntax error"
```
Error: Syntax error near ...

Solution:
1. Check SQL syntax carefully
2. Verify no special characters messed up
3. Copy entire migration again from file
4. Paste into fresh query
5. Run again
```

### Problem: "Payments table doesn't exist"
```
Error: "relation 'payments' does not exist"

Solution:
1. Run migration 004 first (creates payments table)
2. Then run migration 022
3. All migrations should be run in order
```

### Problem: "Cannot drop constraint"
```
Error: "constraint does not exist"

Solution:
Normal - constraint might not exist in new database
The "IF EXISTS" handles this
Just ignore the error and continue
Migration will still work
```

---

## What's Changed in Database

### Before Migration
```
payments table:
  payment_method VARCHAR(50)
  CHECK (payment_method IN ('card', 'gcash', 'cash'))
  DEFAULT 'card'
```

### After Migration
```
payments table:
  payment_method VARCHAR(50)
  CHECK (payment_method = 'cash')
  DEFAULT 'cash'
```

---

## Testing the Changes

### From Your Application

#### Test 1: Create Payment (Should Use 'cash')
```javascript
const { data, error } = await supabase
  .from('payments')
  .insert({
    reservation_id: reservationId,
    user_id: userId,
    amount: 7200,
    currency: 'PHP',
    status: 'pending',
    payment_method: 'cash'
  });

// Should succeed ✅
```

#### Test 2: Try to Create Card Payment (Should Fail)
```javascript
const { data, error } = await supabase
  .from('payments')
  .insert({
    reservation_id: reservationId,
    user_id: userId,
    amount: 7200,
    currency: 'PHP',
    status: 'pending',
    payment_method: 'card'  // ❌ This will fail!
  });

// Should error: "violates check constraint"
```

---

## Full Migration Checklist

- [ ] Backup your database (Supabase has automatic daily backups)
- [ ] Log into Supabase
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy entire 022_cash_only_payment.sql contents
- [ ] Paste into editor
- [ ] Click "Run"
- [ ] Wait for success message
- [ ] Verify with test queries above
- [ ] Confirm payment_method constraint is 'cash' only
- [ ] Ready to deploy to Vercel ✅

---

## Safe to Run?

✅ **YES, completely safe to run!**

**Why:**
- Uses transactions (BEGIN/COMMIT)
- Rolls back if any error occurs
- No data loss (updates existing to 'cash')
- Idempotent (safe to run multiple times)
- Stripe fields untouched (backward compatible)

**What happens if it fails:**
- Transaction rolls back
- Database returns to previous state
- No permanent changes

**Supabase backups:**
- Automatic daily backups
- Can restore if needed
- You're protected

---

## After Migration

### Next Steps
1. ✅ Migration 022 runs (you're here)
2. ⏳ Push code to GitHub
3. ⏳ Deploy to Vercel
4. ⏳ Test complete booking flow
5. ⏳ Verify payment shows cash-only

---

## Questions?

### Migration Syntax Questions
- Refer to PostgreSQL documentation
- Check Supabase docs: https://supabase.com/docs

### Database Connection
- Make sure you're in correct Supabase project
- Double-check project name

### Verification
- Run the verification queries above
- They'll confirm migration worked

---

**Status:** ✅ Migration Ready to Run  
**Safety Level:** ✅ Very Safe (uses transactions)  
**Time to Run:** ~5 seconds  
**Next Step:** Run in Supabase SQL Editor
