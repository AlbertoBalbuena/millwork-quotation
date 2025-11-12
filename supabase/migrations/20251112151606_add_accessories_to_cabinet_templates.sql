/*
  # Add Accessories Support to Cabinet Templates

  1. Changes
    - Add accessories field to cabinet_templates table
    - Field structure: JSONB array matching area_cabinets accessories
    - Default to empty array for existing templates

  2. Notes
    - Allows templates to capture accessory configurations
    - Accessories will be applied when template is loaded
    - Maintains consistency with cabinet accessories system
*/

-- Add accessories field to cabinet_templates
ALTER TABLE cabinet_templates
ADD COLUMN IF NOT EXISTS accessories JSONB DEFAULT '[]' NOT NULL;

-- Add comment
COMMENT ON COLUMN cabinet_templates.accessories IS 'Array of accessories: [{accessory_id: uuid, quantity_per_cabinet: number}]';

-- Create GIN index for JSON queries
CREATE INDEX IF NOT EXISTS idx_cabinet_templates_accessories ON cabinet_templates USING gin(accessories);
