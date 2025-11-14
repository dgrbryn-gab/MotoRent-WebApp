-- Add DELETE policy for transactions table
-- This allows authenticated admins to delete transactions

CREATE POLICY "Authenticated users can delete transactions" ON transactions
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can delete transactions" ON transactions IS 
  'Allows authenticated admin users to delete transactions from the admin panel';
