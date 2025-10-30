/*
  # Sync missing units from price_list to custom_units

  ## Problem
  There are units in the price_list table that don't exist in custom_units table:
  - Pair
  - Slats
  - Yard
  - ftÂ² (should be normalized to "Square Foot")
  - mÂ² (should be normalized to "Square Meter")

  ## Solution
  1. Insert missing units into custom_units
  2. Normalize corrupted unit names in price_list
  3. Ensure all units are properly synchronized

  ## Changes
  1. Add missing units to custom_units
  2. Fix corrupted unit names in price_list (ftÂ² → Square Foot, mÂ² → Square Meter)
  3. Sync any other units from price_list that don't exist in custom_units
*/

-- First, fix corrupted unit names in price_list
UPDATE price_list 
SET unit = 'Square Foot' 
WHERE unit LIKE 'ft%²' OR unit LIKE 'ft%2';

UPDATE price_list 
SET unit = 'Square Meter' 
WHERE unit LIKE 'm%²' OR unit LIKE 'm%2';

-- Insert missing units into custom_units (only if they don't exist)
INSERT INTO custom_units (unit_name)
SELECT DISTINCT unit
FROM price_list
WHERE unit NOT IN (SELECT unit_name FROM custom_units)
ON CONFLICT (unit_name) DO NOTHING;

-- Verify the sync
DO $$
DECLARE
  missing_units_count integer;
BEGIN
  SELECT COUNT(DISTINCT unit)
  INTO missing_units_count
  FROM price_list
  WHERE unit NOT IN (SELECT unit_name FROM custom_units);
  
  IF missing_units_count > 0 THEN
    RAISE WARNING 'Still % units in price_list not in custom_units', missing_units_count;
  ELSE
    RAISE NOTICE 'All units synchronized successfully';
  END IF;
END $$;
