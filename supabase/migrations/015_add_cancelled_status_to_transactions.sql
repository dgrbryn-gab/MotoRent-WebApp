-- Add 'cancelled' status to transactions table
-- This allows transactions to be marked as cancelled when reservations are rejected

-- Drop the old constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add new constraint with 'cancelled' status
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('completed', 'pending', 'failed', 'cancelled'));

COMMENT ON CONSTRAINT transactions_status_check ON transactions IS 
  'Allowed transaction statuses: completed, pending, failed, cancelled';
