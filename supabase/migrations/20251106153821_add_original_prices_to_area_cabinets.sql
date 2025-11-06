/*
  # Add Original Price Fields to Area Cabinets

  1. Changes
    - Add fields to store original unit prices from price_list at the time of cabinet creation
    - These fields will allow proper price change detection by comparing original vs current unit prices
    - This separates the concept of "unit price" from "calculated cost with roll/sheet adjustments"
  
  2. New Fields
    - `original_box_material_price` - Original unit price per sheet for box material
    - `original_box_edgeband_price` - Original unit price per roll for box edgeband
    - `original_box_interior_finish_price` - Original unit price per sheet for box interior finish
    - `original_doors_material_price` - Original unit price per sheet for doors material
    - `original_doors_edgeband_price` - Original unit price per roll for doors edgeband
    - `original_doors_interior_finish_price` - Original unit price per sheet for doors interior finish
  
  3. Notes
    - All fields are nullable to support existing cabinets
    - Existing cabinets will be backfilled in a separate migration step
    - New cabinets should always populate these fields
*/

-- Add original price fields to area_cabinets
DO $$
BEGIN
  -- Box material original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_box_material_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_box_material_price numeric;
  END IF;

  -- Box edgeband original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_box_edgeband_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_box_edgeband_price numeric;
  END IF;

  -- Box interior finish original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_box_interior_finish_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_box_interior_finish_price numeric;
  END IF;

  -- Doors material original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_doors_material_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_doors_material_price numeric;
  END IF;

  -- Doors edgeband original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_doors_edgeband_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_doors_edgeband_price numeric;
  END IF;

  -- Doors interior finish original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_doors_interior_finish_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_doors_interior_finish_price numeric;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN area_cabinets.original_box_material_price IS 'Original unit price from price_list at time of cabinet creation';
COMMENT ON COLUMN area_cabinets.original_box_edgeband_price IS 'Original unit price from price_list at time of cabinet creation';
COMMENT ON COLUMN area_cabinets.original_box_interior_finish_price IS 'Original unit price from price_list at time of cabinet creation';
COMMENT ON COLUMN area_cabinets.original_doors_material_price IS 'Original unit price from price_list at time of cabinet creation';
COMMENT ON COLUMN area_cabinets.original_doors_edgeband_price IS 'Original unit price from price_list at time of cabinet creation';
COMMENT ON COLUMN area_cabinets.original_doors_interior_finish_price IS 'Original unit price from price_list at time of cabinet creation';
