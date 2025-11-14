-- Add UPDATE policy for transactions table
-- This allows authenticated users (especially admins) to update transaction status

CREATE POLICY "Authenticated users can update transactions" ON transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can update transactions" ON transactions IS 
  'Allows authenticated users (admins) to update transaction status when approving/rejecting reservations';
