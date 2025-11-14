-- Fix motorcycle deletion issue
-- Change foreign key constraint to allow deletion of motorcycles with cancelled reservations

-- Drop the existing constraint
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_motorcycle_id_fkey;

-- Add new constraint with SET NULL
-- This allows deletion but keeps reservation history
ALTER TABLE reservations 
ADD CONSTRAINT reservations_motorcycle_id_fkey 
FOREIGN KEY (motorcycle_id) 
REFERENCES motorcycles(id) 
ON DELETE SET NULL;

-- Make motorcycle_id nullable to support SET NULL
ALTER TABLE reservations 
ALTER COLUMN motorcycle_id DROP NOT NULL;

COMMENT ON COLUMN reservations.motorcycle_id IS 'Motorcycle ID - can be NULL if motorcycle was deleted';
