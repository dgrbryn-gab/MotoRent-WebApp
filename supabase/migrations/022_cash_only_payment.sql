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
