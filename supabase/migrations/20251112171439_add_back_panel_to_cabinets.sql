/*
  # Add Back Panel Material System to Cabinets

  1. New Columns Added
    - `use_back_panel_material` (boolean) - Flag to enable different back panel material
    - `back_panel_material_id` (uuid) - Reference to price_list for back panel material
    - `back_panel_width_inches` (decimal) - Width of back panel in inches
    - `back_panel_height_inches` (decimal) - Height of back panel in inches
    - `back_panel_sf` (decimal) - Calculated square feet of back panel
    - `back_panel_material_cost` (decimal) - Cost of back panel material
    - `original_back_panel_material_price` (decimal) - Original price for versioning

  2. Tables Modified
    - `area_cabinets` - Main cabinet table
    - `version_area_cabinets` - Versioning table (if exists)
    - `cabinet_templates` - Template system table

  3. Security
    - Uses existing RLS policies (public access)
    - Maintains referential integrity with price_list

  4. Notes
    - Back panel area is subtracted from box material calculations
    - No edgeband calculation for back panel (inset installation)
    - Exact calculation without waste percentage
*/

-- Add back panel fields to area_cabinets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'use_back_panel_material'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN use_back_panel_material boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'back_panel_material_id'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN back_panel_material_id uuid REFERENCES price_list(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'back_panel_width_inches'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN back_panel_width_inches decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'back_panel_height_inches'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN back_panel_height_inches decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'back_panel_sf'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN back_panel_sf decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'back_panel_material_cost'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN back_panel_material_cost decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_cabinets' AND column_name = 'original_back_panel_material_price'
  ) THEN
    ALTER TABLE area_cabinets ADD COLUMN original_back_panel_material_price decimal(10,2);
  END IF;
END $$;

-- Add back panel fields to version_area_cabinets (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'version_area_cabinets'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'use_back_panel_material'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN use_back_panel_material boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'back_panel_material_id'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN back_panel_material_id uuid;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'back_panel_width_inches'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN back_panel_width_inches decimal(10,2);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'back_panel_height_inches'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN back_panel_height_inches decimal(10,2);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'back_panel_sf'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN back_panel_sf decimal(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'back_panel_material_cost'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN back_panel_material_cost decimal(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets' AND column_name = 'original_back_panel_material_price'
    ) THEN
      ALTER TABLE version_area_cabinets ADD COLUMN original_back_panel_material_price decimal(10,2);
    END IF;
  END IF;
END $$;

-- Add back panel fields to cabinet_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'use_back_panel_material'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN use_back_panel_material boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'back_panel_material_id'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN back_panel_material_id uuid REFERENCES price_list(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'back_panel_material_name'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN back_panel_material_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'back_panel_width_inches'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN back_panel_width_inches decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'back_panel_height_inches'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN back_panel_height_inches decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_templates' AND column_name = 'original_back_panel_material_price'
  ) THEN
    ALTER TABLE cabinet_templates ADD COLUMN original_back_panel_material_price decimal(10,2);
  END IF;
END $$;

-- Create index for back_panel_material_id for better query performance
CREATE INDEX IF NOT EXISTS idx_area_cabinets_back_panel_material
  ON area_cabinets(back_panel_material_id)
  WHERE back_panel_material_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_back_panel_material
  ON cabinet_templates(back_panel_material_id)
  WHERE back_panel_material_id IS NOT NULL;
