-- Add new fields to motorcycles table
-- Run this migration to support the refactored Add Motorcycle form

-- Add brand field
ALTER TABLE motorcycles 
ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Add model field
ALTER TABLE motorcycles 
ADD COLUMN IF NOT EXISTS model VARCHAR(100);

-- Add plate_number field
ALTER TABLE motorcycles 
ADD COLUMN IF NOT EXISTS plate_number VARCHAR(20);

-- Add mileage field (optional)
ALTER TABLE motorcycles 
ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_motorcycles_brand ON motorcycles(brand);
CREATE INDEX IF NOT EXISTS idx_motorcycles_model ON motorcycles(model);
CREATE INDEX IF NOT EXISTS idx_motorcycles_plate_number ON motorcycles(plate_number);

-- Update existing motorcycles to split name into brand and model (example)
-- You may need to manually update existing records or write custom logic
-- Example: UPDATE motorcycles SET brand = split_part(name, ' ', 1), model = substring(name from position(' ' in name) + 1) WHERE brand IS NULL;

COMMENT ON COLUMN motorcycles.brand IS 'Motorcycle brand (e.g., Honda, Yamaha)';
COMMENT ON COLUMN motorcycles.model IS 'Motorcycle model (e.g., Click 150i, NMAX)';
COMMENT ON COLUMN motorcycles.plate_number IS 'Vehicle registration plate number';
COMMENT ON COLUMN motorcycles.mileage IS 'Current odometer reading in kilometers (optional)';
