/*
  # Add Box and Doors Edgeband Fields to Version Cabinets

  ## Problem
  The table `version_area_cabinets` only stores `total_edgeband` but doesn't separate
  box edgeband from doors edgeband. This makes it impossible to accurately calculate
  material breakdowns that show separate box and doors edgeband rolls.

  ## Solution
  Add `box_edgeband` and `doors_fronts_edgeband` fields to match the products_catalog
  structure and enable accurate material breakdown calculations.

  ## Changes
  - Add `box_edgeband` column (numeric) - meters of edgeband for box
  - Add `doors_fronts_edgeband` column (numeric) - meters of edgeband for doors/fronts

  ## Impact
  - Enables accurate material breakdown by separating box and doors edgeband
  - Maintains consistency with products_catalog structure
  - Required for proper material ordering calculations
*/

-- Add box_edgeband column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'version_area_cabinets' 
      AND column_name = 'box_edgeband'
  ) THEN
    ALTER TABLE version_area_cabinets 
    ADD COLUMN box_edgeband NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add doors_fronts_edgeband column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'version_area_cabinets' 
      AND column_name = 'doors_fronts_edgeband'
  ) THEN
    ALTER TABLE version_area_cabinets 
    ADD COLUMN doors_fronts_edgeband NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Verify columns were added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'version_area_cabinets' 
      AND column_name IN ('box_edgeband', 'doors_fronts_edgeband')
  ) THEN
    RAISE NOTICE 'SUCCESS: Edgeband columns added to version_area_cabinets';
  ELSE
    RAISE EXCEPTION 'FAILURE: Edgeband columns were not created';
  END IF;
END $$;