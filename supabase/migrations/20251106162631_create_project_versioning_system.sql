/*
  # Create Project Versioning System

  ## Overview
  This migration creates a comprehensive versioning system for projects that tracks:
  - Material changes (when materials are changed via bulk material change)
  - Price recalculations (when prices are updated to current price list values)
  - Complete project snapshots at each version point

  ## New Tables

  ### `project_versions`
  Main version tracking table that stores:
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key to projects)
  - `version_number` (integer) - Sequential version number for the project
  - `version_name` (text) - User-friendly name for the version
  - `version_type` (text) - Type: 'price_update', 'material_change', 'manual_snapshot'
  - `snapshot_data` (jsonb) - Complete snapshot of project state
  - `total_amount` (numeric) - Project total at this version
  - `change_summary` (jsonb) - Summary of what changed
  - `notes` (text, optional) - User notes about this version
  - `affected_areas` (text[]) - Array of area IDs affected by this change
  - `created_at` (timestamptz)

  ### `project_version_details`
  Detailed change tracking per area:
  - `id` (uuid, primary key)
  - `version_id` (uuid, foreign key to project_versions)
  - `area_id` (uuid, foreign key to project_areas)
  - `area_name` (text) - Area name at time of version
  - `previous_subtotal` (numeric) - Area subtotal before change
  - `new_subtotal` (numeric) - Area subtotal after change
  - `difference` (numeric) - Calculated difference
  - `difference_percentage` (numeric) - Percentage change
  - `cabinets_affected_count` (integer) - Number of cabinets changed
  - `change_type` (text) - Type of change: 'material_change', 'price_update', 'both'
  - `material_changes` (jsonb) - Details of material changes if applicable
  - `price_changes` (jsonb) - Details of price changes if applicable
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Users can only access versions for their projects
  - Authenticated users can create versions
  - Authenticated users can read their own project versions

  ## Indexes
  - Index on project_versions(project_id, created_at) for fast history queries
  - Index on project_version_details(version_id, area_id) for fast detail lookups

  ## Notes
  - Snapshots are stored in JSONB format for efficient storage and querying
  - Version numbers are sequential per project starting from 1
  - The system automatically creates a version before any bulk operation
*/

-- Create ENUM type for version types
DO $$ BEGIN
  CREATE TYPE version_type AS ENUM ('price_update', 'material_change', 'manual_snapshot');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create project_versions table
CREATE TABLE IF NOT EXISTS project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_name text NOT NULL,
  version_type text NOT NULL CHECK (version_type IN ('price_update', 'material_change', 'manual_snapshot')),
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  change_summary jsonb DEFAULT '{}'::jsonb,
  notes text,
  affected_areas text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_project_version_number UNIQUE (project_id, version_number)
);

-- Create project_version_details table
CREATE TABLE IF NOT EXISTS project_version_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  area_id uuid REFERENCES project_areas(id) ON DELETE SET NULL,
  area_name text NOT NULL,
  previous_subtotal numeric(10,2) NOT NULL DEFAULT 0,
  new_subtotal numeric(10,2) NOT NULL DEFAULT 0,
  difference numeric(10,2) NOT NULL DEFAULT 0,
  difference_percentage numeric(10,2) NOT NULL DEFAULT 0,
  cabinets_affected_count integer NOT NULL DEFAULT 0,
  change_type text NOT NULL CHECK (change_type IN ('material_change', 'price_update', 'both')),
  material_changes jsonb DEFAULT '{}'::jsonb,
  price_changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_versions_project_created
  ON project_versions(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_versions_type
  ON project_versions(project_id, version_type);

CREATE INDEX IF NOT EXISTS idx_project_version_details_version
  ON project_version_details(version_id, area_id);

-- Enable Row Level Security
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_version_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_versions
CREATE POLICY "Users can view versions of their projects"
  ON project_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their projects"
  ON project_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their project versions"
  ON project_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create RLS policies for project_version_details
CREATE POLICY "Users can view version details of their projects"
  ON project_version_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_versions
      JOIN projects ON projects.id = project_versions.project_id
      WHERE project_versions.id = project_version_details.version_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create version details for their projects"
  ON project_version_details FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_versions
      JOIN projects ON projects.id = project_versions.project_id
      WHERE project_versions.id = project_version_details.version_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create helper function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_project_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_num
  FROM project_versions
  WHERE project_id = p_project_id;

  RETURN next_num;
END;
$$;

-- Create function to create project snapshot
CREATE OR REPLACE FUNCTION create_project_snapshot(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  snapshot jsonb;
BEGIN
  -- Create a snapshot of the entire project state
  SELECT jsonb_build_object(
    'project', (SELECT to_jsonb(p) FROM projects p WHERE p.id = p_project_id),
    'areas', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'area', to_jsonb(pa),
          'cabinets', (
            SELECT jsonb_agg(to_jsonb(ac))
            FROM area_cabinets ac
            WHERE ac.area_id = pa.id
          ),
          'items', (
            SELECT jsonb_agg(to_jsonb(ai))
            FROM area_items ai
            WHERE ai.area_id = pa.id
          ),
          'countertops', (
            SELECT jsonb_agg(to_jsonb(act))
            FROM area_countertops act
            WHERE act.area_id = pa.id
          )
        )
      )
      FROM project_areas pa
      WHERE pa.project_id = p_project_id
    )
  ) INTO snapshot;

  RETURN snapshot;
END;
$$;

COMMENT ON TABLE project_versions IS 'Stores version history of projects including material changes and price updates';
COMMENT ON TABLE project_version_details IS 'Stores detailed changes per area for each project version';
COMMENT ON FUNCTION get_next_version_number IS 'Returns the next sequential version number for a project';
COMMENT ON FUNCTION create_project_snapshot IS 'Creates a complete JSONB snapshot of project state including all areas and cabinets';
