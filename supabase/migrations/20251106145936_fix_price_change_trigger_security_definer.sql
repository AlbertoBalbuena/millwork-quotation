/*
  # Fix Price Change Trigger with SECURITY DEFINER

  1. Problem
    - The trigger function log_price_change() runs with the permissions of the user making the UPDATE
    - When it tries to INSERT into price_change_log, RLS policies are evaluated in user context
    - This causes "new row violates row-level security policy" errors
  
  2. Solution
    - Recreate the function with SECURITY DEFINER
    - This makes the function execute with the permissions of the function owner (postgres)
    - The function will bypass RLS checks when inserting into price_change_log
  
  3. Security
    - This is safe because:
      * The function only runs on price_list UPDATE trigger
      * The function doesn't accept user input
      * It only logs price changes automatically
      * Users still need permission to update price_list
*/

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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
    WITH affected_projects AS (
      -- Check cabinets
      SELECT DISTINCT pa.project_id
      FROM area_cabinets ac
      JOIN project_areas pa ON ac.area_id = pa.id
      WHERE ac.box_material_id = NEW.id
         OR ac.box_edgeband_id = NEW.id
         OR ac.box_interior_finish_id = NEW.id
         OR ac.doors_material_id = NEW.id
         OR ac.doors_edgeband_id = NEW.id
         OR ac.doors_interior_finish_id = NEW.id
         OR EXISTS (
           SELECT 1 FROM jsonb_array_elements(ac.hardware::jsonb) AS hw
           WHERE hw->>'hardware_id' = NEW.id::text
         )
      
      UNION
      
      -- Check items
      SELECT DISTINCT pa.project_id
      FROM area_items ai
      JOIN project_areas pa ON ai.area_id = pa.id
      WHERE ai.price_list_item_id = NEW.id
      
      UNION
      
      -- Check countertops
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

-- Ensure the trigger is properly configured
DROP TRIGGER IF EXISTS trigger_log_price_change ON price_list;
CREATE TRIGGER trigger_log_price_change
  AFTER UPDATE ON price_list
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();
