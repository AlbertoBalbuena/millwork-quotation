/*
  # Rename status 'Disqualified' to 'Discarded'

  Updates the projects_status_check constraint on both the quotations and projects
  tables to replace 'Disqualified' with 'Discarded', and migrates any existing rows.
*/

-- Migrate existing data first
UPDATE quotations SET status = 'Discarded' WHERE status = 'Disqualified';
UPDATE projects   SET status = 'Discarded' WHERE status = 'Disqualified';

-- Update constraint on quotations table
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE quotations
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('Pending', 'Estimating', 'Sent', 'Lost', 'Awarded', 'Discarded', 'Cancelled'));

-- Update constraint on projects table
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('Pending', 'Estimating', 'Sent', 'Lost', 'Awarded', 'Discarded', 'Cancelled'));
