-- Alternative: Only prevent deletion if there are ACTIVE reservations
-- This allows deletion when all reservations are cancelled or completed

-- Drop the existing constraint
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_motorcycle_id_fkey;

-- Add CASCADE constraint (deletes related records)
ALTER TABLE reservations 
ADD CONSTRAINT reservations_motorcycle_id_fkey 
FOREIGN KEY (motorcycle_id) 
REFERENCES motorcycles(id) 
ON DELETE CASCADE;

-- Add a function to prevent deletion if active reservations exist
CREATE OR REPLACE FUNCTION prevent_motorcycle_deletion_with_active_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if motorcycle has any active reservations (pending or confirmed)
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE motorcycle_id = OLD.id 
    AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Cannot delete motorcycle: active reservations exist. Please cancel or complete all reservations first.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_motorcycle_deletion ON motorcycles;
CREATE TRIGGER check_motorcycle_deletion
  BEFORE DELETE ON motorcycles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_motorcycle_deletion_with_active_reservations();

COMMENT ON FUNCTION prevent_motorcycle_deletion_with_active_reservations IS 
'Prevents deletion of motorcycles with pending or confirmed reservations. Allows deletion if only cancelled/completed reservations exist.';
