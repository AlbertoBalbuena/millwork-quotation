/*
  # Add Accessories Support to Area Cabinets

  1. New Fields
    - `accessories` (jsonb): Array of accessories assigned to each cabinet
      Structure: [{accessory_id: string, quantity_per_cabinet: number}]
      Similar to hardware field but for non-construction items
    - `accessories_cost` (decimal): Total cost of all accessories for the cabinet

  2. Changes to Tables
    - Add accessories field to area_cabinets with default empty array
    - Add accessories_cost field to area_cabinets with default 0
    - Add same fields to version_area_cabinets for version history tracking
    - Add GIN index on accessories field for efficient JSON queries

  3. Accessories vs Hardware
    - Hardware: Hinges, slides, handles, drawer hardware (technical items)
    - Accessories: Glass, fabric, lighting, decorative, countertops, etc. (complementary items)
    - Both contribute to cabinet cost but are tracked separately
    - Accessories do NOT affect shipping calculations or labor costs

  4. Notes
    - Accessories can include any price list item except edgeband and sheet materials
    - Each accessory has a quantity_per_cabinet multiplier
    - Total accessories cost = sum of (accessory_price * quantity_per_cabinet * cabinet_quantity)
    - System maintains separation between hardware and accessories for clarity
*/

-- Add accessories field to area_cabinets
ALTER TABLE area_cabinets
ADD COLUMN IF NOT EXISTS accessories JSONB DEFAULT '[]' NOT NULL;

-- Add accessories_cost field to area_cabinets
ALTER TABLE area_cabinets
ADD COLUMN IF NOT EXISTS accessories_cost DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Add comment to accessories field
COMMENT ON COLUMN area_cabinets.accessories IS 'Array of accessories: [{accessory_id: uuid, quantity_per_cabinet: number}]';

-- Add comment to accessories_cost field
COMMENT ON COLUMN area_cabinets.accessories_cost IS 'Total cost of all accessories for this cabinet (accessory_price * quantity_per_cabinet * cabinet_quantity)';

-- Create GIN index for JSON queries on accessories
CREATE INDEX IF NOT EXISTS idx_area_cabinets_accessories ON area_cabinets USING gin(accessories);

-- Add accessories field to version_area_cabinets (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_area_cabinets'
  ) THEN
    -- Add accessories field
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets'
      AND column_name = 'accessories'
    ) THEN
      ALTER TABLE version_area_cabinets
      ADD COLUMN accessories JSONB DEFAULT '[]' NOT NULL;
    END IF;

    -- Add accessories_cost field
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'version_area_cabinets'
      AND column_name = 'accessories_cost'
    ) THEN
      ALTER TABLE version_area_cabinets
      ADD COLUMN accessories_cost DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;

    -- Add comments
    COMMENT ON COLUMN version_area_cabinets.accessories IS 'Snapshot of accessories: [{accessory_id: uuid, quantity_per_cabinet: number}]';
    COMMENT ON COLUMN version_area_cabinets.accessories_cost IS 'Snapshot of total accessories cost';

    -- Create GIN index
    CREATE INDEX IF NOT EXISTS idx_version_area_cabinets_accessories ON version_area_cabinets USING gin(accessories);
  END IF;
END $$;
