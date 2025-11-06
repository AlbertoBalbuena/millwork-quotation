/*
  # Add Original Price Fields to Cabinet Templates

  1. Changes
    - Add fields to store original unit prices for template materials
    - This ensures templates capture the price at the time of template creation
    - When a template is applied, these prices serve as the initial original prices
  
  2. New Fields
    - `original_box_material_price` - Original unit price for box material
    - `original_box_edgeband_price` - Original unit price for box edgeband
    - `original_box_interior_finish_price` - Original unit price for box interior finish
    - `original_doors_material_price` - Original unit price for doors material
    - `original_doors_edgeband_price` - Original unit price for doors edgeband
    - `original_doors_interior_finish_price` - Original unit price for doors interior finish
  
  3. Notes
    - All fields are nullable
    - These prices are captured when the template is saved
    - When a template is applied to create a new cabinet, these become the cabinet's original prices
*/

-- Add original price fields to cabinet_templates
DO $$
BEGIN
  -- Box material original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_box_material_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_box_material_price numeric;
  END IF;

  -- Box edgeband original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_box_edgeband_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_box_edgeband_price numeric;
  END IF;

  -- Box interior finish original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_box_interior_finish_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_box_interior_finish_price numeric;
  END IF;

  -- Doors material original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_doors_material_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_doors_material_price numeric;
  END IF;

  -- Doors edgeband original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_doors_edgeband_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_doors_edgeband_price numeric;
  END IF;

  -- Doors interior finish original price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_doors_interior_finish_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_doors_interior_finish_price numeric;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN cabinet_templates.original_box_material_price IS 'Original unit price from price_list at time of template creation';
COMMENT ON COLUMN cabinet_templates.original_box_edgeband_price IS 'Original unit price from price_list at time of template creation';
COMMENT ON COLUMN cabinet_templates.original_box_interior_finish_price IS 'Original unit price from price_list at time of template creation';
COMMENT ON COLUMN cabinet_templates.original_doors_material_price IS 'Original unit price from price_list at time of template creation';
COMMENT ON COLUMN cabinet_templates.original_doors_edgeband_price IS 'Original unit price from price_list at time of template creation';
COMMENT ON COLUMN cabinet_templates.original_doors_interior_finish_price IS 'Original unit price from price_list at time of template creation';
