/*
  # Remove Version System Tables
  
  This migration removes all version-related tables after data consolidation.
  
  ## Tables to Drop
  - version_area_countertops
  - version_area_items
  - version_area_cabinets
  - version_project_areas
  - project_versions
  - material_change_log
  - template_usage_log
  
  ## Safety
  - Data has been migrated to original tables
  - Foreign key constraints will be handled in proper order
  - RLS policies will be dropped automatically with tables
*/

-- Drop tables in reverse dependency order

-- Drop countertops first
DROP TABLE IF EXISTS version_area_countertops CASCADE;

-- Drop items
DROP TABLE IF EXISTS version_area_items CASCADE;

-- Drop cabinets
DROP TABLE IF EXISTS version_area_cabinets CASCADE;

-- Drop version areas
DROP TABLE IF EXISTS version_project_areas CASCADE;

-- Drop project versions
DROP TABLE IF EXISTS project_versions CASCADE;

-- Drop related log tables that reference versions
DROP TABLE IF EXISTS material_change_log CASCADE;

-- Add comment to track removal
COMMENT ON TABLE project_areas IS 'Original table - version system removed 2025-11-05';
COMMENT ON TABLE area_cabinets IS 'Original table - version system removed 2025-11-05';
COMMENT ON TABLE area_items IS 'Original table - version system removed 2025-11-05';
COMMENT ON TABLE area_countertops IS 'Original table - version system removed 2025-11-05';
