/*
  # Consolidate Version Data to Original Tables
  
  This migration consolidates all data from version tables back to original tables.
  
  ## Strategy
  1. For each project, identify the current version
  2. Migrate data from current version to original tables
  3. Clear original tables first to avoid duplicates
  4. Preserve data integrity with proper foreign key handling
  
  ## Tables Affected
  - version_project_areas → project_areas
  - version_area_cabinets → area_cabinets  
  - version_area_items → area_items
  - version_area_countertops → area_countertops
  
  ## Safety
  - Uses transactions for atomicity
  - Preserves all data relationships
  - Maps version data to original structure
*/

-- First, let's create a temporary function to do the migration safely
CREATE OR REPLACE FUNCTION migrate_version_data_to_original()
RETURNS void AS $$
DECLARE
  project_record RECORD;
  version_record RECORD;
  area_record RECORD;
  new_area_id UUID;
  area_id_map JSONB := '{}'::JSONB;
BEGIN
  -- Loop through each project
  FOR project_record IN 
    SELECT DISTINCT p.id as project_id, p.name
    FROM projects p
    WHERE EXISTS (
      SELECT 1 FROM project_versions pv 
      WHERE pv.project_id = p.id AND pv.is_current = true
    )
  LOOP
    RAISE NOTICE 'Processing project: %', project_record.name;
    
    -- Get the current version for this project
    SELECT * INTO version_record
    FROM project_versions
    WHERE project_id = project_record.project_id 
      AND is_current = true
    LIMIT 1;
    
    IF version_record.id IS NOT NULL THEN
      -- Clear existing data in original tables for this project
      DELETE FROM area_cabinets 
      WHERE area_id IN (
        SELECT id FROM project_areas WHERE project_id = project_record.project_id
      );
      
      DELETE FROM area_items
      WHERE area_id IN (
        SELECT id FROM project_areas WHERE project_id = project_record.project_id
      );
      
      DELETE FROM area_countertops
      WHERE area_id IN (
        SELECT id FROM project_areas WHERE project_id = project_record.project_id
      );
      
      DELETE FROM project_areas 
      WHERE project_id = project_record.project_id;
      
      -- Reset the area_id_map for this project
      area_id_map := '{}'::JSONB;
      
      -- Migrate areas from version to original
      FOR area_record IN
        SELECT * FROM version_project_areas
        WHERE version_id = version_record.id
        ORDER BY display_order
      LOOP
        -- Insert area and get new ID
        INSERT INTO project_areas (
          project_id,
          name,
          display_order,
          subtotal
        ) VALUES (
          project_record.project_id,
          area_record.name,
          area_record.display_order,
          area_record.subtotal
        ) RETURNING id INTO new_area_id;
        
        -- Store mapping of old area_id to new area_id
        area_id_map := jsonb_set(
          area_id_map,
          ARRAY[area_record.id::text],
          to_jsonb(new_area_id::text)
        );
        
        -- Migrate cabinets for this area
        INSERT INTO area_cabinets (
          area_id,
          product_sku,
          quantity,
          box_material_id,
          box_edgeband_id,
          box_interior_finish_id,
          doors_material_id,
          doors_edgeband_id,
          doors_interior_finish_id,
          hardware,
          box_material_cost,
          box_edgeband_cost,
          box_interior_finish_cost,
          doors_material_cost,
          doors_edgeband_cost,
          doors_interior_finish_cost,
          hardware_cost,
          labor_cost,
          subtotal,
          is_rta
        )
        SELECT
          new_area_id,
          product_sku,
          quantity,
          box_material_id,
          box_edgeband_id,
          box_interior_finish_id,
          doors_material_id,
          doors_edgeband_id,
          doors_interior_finish_id,
          hardware,
          box_material_cost,
          box_edgeband_cost,
          box_interior_finish_cost,
          doors_material_cost,
          doors_edgeband_cost,
          doors_interior_finish_cost,
          hardware_cost,
          labor_cost,
          subtotal,
          is_rta
        FROM version_area_cabinets
        WHERE area_id = area_record.id;
        
        -- Migrate items for this area
        INSERT INTO area_items (
          area_id,
          price_list_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal,
          notes
        )
        SELECT
          new_area_id,
          price_list_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal,
          notes
        FROM version_area_items
        WHERE area_id = area_record.id;
        
        -- Migrate countertops for this area
        INSERT INTO area_countertops (
          area_id,
          price_list_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal,
          notes
        )
        SELECT
          new_area_id,
          price_list_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal,
          notes
        FROM version_area_countertops
        WHERE area_id = area_record.id;
        
      END LOOP;
      
      -- Update project total from version
      UPDATE projects
      SET total_amount = version_record.total_amount
      WHERE id = project_record.project_id;
      
      RAISE NOTICE 'Completed migration for project: %', project_record.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_version_data_to_original();

-- Drop the temporary function
DROP FUNCTION IF EXISTS migrate_version_data_to_original();

-- Add a comment to track this migration
COMMENT ON TABLE project_areas IS 'Consolidated from version_project_areas on 2025-11-05';
