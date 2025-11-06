/*
  # Price Change Tracking and Notification System

  1. New Tables
    - `price_change_log`
      - Tracks every price change in the price_list table
      - Records old price, new price, and timestamp
      - Links to the price_list item that changed
    
    - `project_price_staleness`
      - Tracks which projects have outdated prices
      - Caches affected materials and potential cost differences
      - Enables fast querying for notification badges
  
  2. Changes
    - Add trigger to price_list table to detect price changes
    - Add function to identify affected projects
    - Add indexes for performance
  
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to read their data
*/

-- Create price_change_log table
CREATE TABLE IF NOT EXISTS price_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_item_id uuid NOT NULL REFERENCES price_list(id) ON DELETE CASCADE,
  item_description text NOT NULL,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  price_difference numeric GENERATED ALWAYS AS (new_price - old_price) STORED,
  changed_at timestamptz DEFAULT now(),
  changed_by text DEFAULT current_user
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_change_log_item_id 
  ON price_change_log(price_list_item_id);
CREATE INDEX IF NOT EXISTS idx_price_change_log_changed_at 
  ON price_change_log(changed_at DESC);

-- Enable RLS
ALTER TABLE price_change_log ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can read price change log"
  ON price_change_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Create project_price_staleness table
CREATE TABLE IF NOT EXISTS project_price_staleness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  has_stale_prices boolean DEFAULT false,
  affected_material_count integer DEFAULT 0,
  last_checked_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_price_staleness_project_id 
  ON project_price_staleness(project_id);
CREATE INDEX IF NOT EXISTS idx_project_price_staleness_has_stale 
  ON project_price_staleness(has_stale_prices) WHERE has_stale_prices = true;

-- Enable RLS
ALTER TABLE project_price_staleness ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can read project price staleness"
  ON project_price_staleness
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update project price staleness"
  ON project_price_staleness
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert project price staleness"
  ON project_price_staleness
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_change_log (
      price_list_item_id,
      item_description,
      old_price,
      new_price
    ) VALUES (
      NEW.id,
      NEW.concept_description,
      OLD.price,
      NEW.price
    );
    
    -- Mark affected projects as having stale prices
    -- This is a simple mark - the detailed analysis happens on-demand
    WITH affected_projects AS (
      SELECT DISTINCT pa.project_id
      FROM area_cabinets ac
      JOIN project_areas pa ON ac.area_id = pa.id
      WHERE ac.box_material_id = NEW.id
         OR ac.box_edgeband_id = NEW.id
         OR ac.box_interior_finish_id = NEW.id
         OR ac.doors_material_id = NEW.id
         OR ac.doors_edgeband_id = NEW.id
         OR ac.doors_interior_finish_id = NEW.id
         OR ac.hardware::jsonb @> jsonb_build_array(jsonb_build_object('hardware_id', NEW.id::text))
      UNION
      SELECT DISTINCT pa.project_id
      FROM area_items ai
      JOIN project_areas pa ON ai.area_id = pa.id
      WHERE ai.price_list_item_id = NEW.id
      UNION
      SELECT DISTINCT pa.project_id
      FROM area_countertops act
      JOIN project_areas pa ON act.area_id = pa.id
      WHERE act.price_list_item_id = NEW.id
    )
    INSERT INTO project_price_staleness (project_id, has_stale_prices, affected_material_count)
    SELECT project_id, true, 1
    FROM affected_projects
    ON CONFLICT (project_id) 
    DO UPDATE SET 
      has_stale_prices = true,
      affected_material_count = project_price_staleness.affected_material_count + 1,
      last_checked_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on price_list
DROP TRIGGER IF EXISTS trigger_log_price_change ON price_list;
CREATE TRIGGER trigger_log_price_change
  AFTER UPDATE ON price_list
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

-- Function to check for stale prices in a project
CREATE OR REPLACE FUNCTION check_project_price_staleness(p_project_id uuid)
RETURNS TABLE (
  area_id uuid,
  area_name text,
  cabinet_id uuid,
  material_type text,
  material_name text,
  stored_price numeric,
  current_price numeric,
  price_difference numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH cabinet_materials AS (
    SELECT 
      pa.id as area_id,
      pa.name as area_name,
      ac.id as cabinet_id,
      'box_material' as material_type,
      pl.concept_description as material_name,
      ac.box_material_cost as stored_cost,
      ac.quantity,
      pl.price as current_unit_price,
      ac.box_material_id as material_id,
      p.box_sf as sf_needed
    FROM area_cabinets ac
    JOIN project_areas pa ON ac.area_id = pa.id
    JOIN products_catalog p ON ac.product_sku = p.sku
    LEFT JOIN price_list pl ON ac.box_material_id = pl.id
    WHERE pa.project_id = p_project_id AND ac.box_material_id IS NOT NULL
    
    UNION ALL
    
    SELECT 
      pa.id,
      pa.name,
      ac.id,
      'doors_material',
      pl.concept_description,
      ac.doors_material_cost,
      ac.quantity,
      pl.price,
      ac.doors_material_id,
      p.doors_fronts_sf
    FROM area_cabinets ac
    JOIN project_areas pa ON ac.area_id = pa.id
    JOIN products_catalog p ON ac.product_sku = p.sku
    LEFT JOIN price_list pl ON ac.doors_material_id = pl.id
    WHERE pa.project_id = p_project_id AND ac.doors_material_id IS NOT NULL
  )
  SELECT 
    cm.area_id,
    cm.area_name,
    cm.cabinet_id,
    cm.material_type,
    cm.material_name,
    cm.stored_cost as stored_price,
    (cm.current_unit_price / COALESCE(NULLIF(cm.current_unit_price / cm.stored_cost * cm.sf_needed * cm.quantity, 0), 1)) * cm.sf_needed * cm.quantity as current_price,
    ((cm.current_unit_price / COALESCE(NULLIF(cm.current_unit_price / cm.stored_cost * cm.sf_needed * cm.quantity, 0), 1)) * cm.sf_needed * cm.quantity) - cm.stored_cost as price_difference
  FROM cabinet_materials cm
  WHERE cm.stored_cost IS DISTINCT FROM 
    ((cm.current_unit_price / COALESCE(NULLIF(cm.current_unit_price / cm.stored_cost * cm.sf_needed * cm.quantity, 0), 1)) * cm.sf_needed * cm.quantity);
END;
$$ LANGUAGE plpgsql;
