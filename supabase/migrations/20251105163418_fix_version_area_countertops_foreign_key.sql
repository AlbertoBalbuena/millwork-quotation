/*
  # Fix Critical Foreign Key Missing in version_area_countertops

  ## Problem
  The table `version_area_countertops` was created without a foreign key constraint 
  to `version_project_areas(id)`, causing Supabase/PostgREST to be unable to 
  establish the relationship for automatic JOINs. This results in error:
  "Could not find a relationship between 'version_project_areas' and 'version_area_countertops'"

  ## Root Cause
  Migration 20251104170534_add_area_countertops_table.sql created the table with
  area_id column but without the foreign key constraint, unlike version_area_cabinets
  and version_area_items which both have proper FK constraints.

  ## Solution
  Add the missing foreign key constraint to enable Supabase to automatically
  resolve the relationship when using .select() with nested queries.

  ## Impact
  - CRITICAL FIX: Restores ability to view areas in projects with active versions
  - No data loss: All existing data remains intact
  - Immediate: Takes effect as soon as migration is applied
  - Safe: Uses IF NOT EXISTS pattern to prevent errors on re-run

  ## Tables Modified
  - `version_area_countertops`: Add FK constraint to area_id column

  ## Verification Query
  After applying, verify with:
  ```sql
  SELECT constraint_name 
  FROM information_schema.table_constraints
  WHERE table_name = 'version_area_countertops' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%area_id%';
  ```
*/

-- Add the missing foreign key constraint
-- This allows Supabase/PostgREST to automatically resolve the relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'version_area_countertops_area_id_fkey'
      AND table_name = 'version_area_countertops'
  ) THEN
    ALTER TABLE version_area_countertops 
    ADD CONSTRAINT version_area_countertops_area_id_fkey 
    FOREIGN KEY (area_id) 
    REFERENCES version_project_areas(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Verify the constraint was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'version_area_countertops_area_id_fkey'
      AND table_name = 'version_area_countertops'
  ) THEN
    RAISE NOTICE 'SUCCESS: Foreign key constraint version_area_countertops_area_id_fkey created successfully';
  ELSE
    RAISE EXCEPTION 'FAILURE: Foreign key constraint was not created';
  END IF;
END $$;