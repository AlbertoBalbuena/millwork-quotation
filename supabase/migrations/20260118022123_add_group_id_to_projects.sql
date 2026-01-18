/*
  # Add Project Grouping System

  1. Changes
    - Add `group_id` column to projects table to link related project versions
    - The group_id is a UUID that multiple projects can share to indicate they belong to the same group
    - This enables version management and visual grouping in the UI

  2. Notes
    - The group_id field is nullable to maintain backward compatibility
    - Existing projects will have NULL group_id and will be treated as standalone projects
    - New projects will automatically get a group_id assigned
    - When duplicating or importing projects as versions, the group_id will be copied/matched
    - Index is added for efficient grouping queries

  3. Security
    - No changes to RLS policies needed - group_id is just an organizational field
*/

-- Add group_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS group_id UUID;

-- Add index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON projects(group_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.group_id IS 'UUID linking related project versions together for grouping and organization';
