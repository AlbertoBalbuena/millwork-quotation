/*
  # Fix Price List Delete with Trigger Issue

  1. Problem
    - When updating price_list to set is_active = false (soft delete), the log_price_change trigger runs
    - The trigger tries to insert into price_change_log even when only is_active changed
    - This causes RLS violations and prevents soft deletes

  2. Solution
    - Update the log_price_change function to only execute when price actually changes
    - Add a condition to check if only is_active is being changed
    - Skip price logging when it's just a soft delete operation

  3. Changes
    - Modified log_price_change() to skip execution when only is_active changes
*/

-- Update the trigger function to handle soft deletes properly
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if the price actually changed AND it's not just a soft delete
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