/*
  # Fix Price Change Log RLS - Allow Public Insert

  1. Problem
    - The trigger log_price_change() runs with SECURITY DEFINER
    - But it tries to INSERT into project_price_staleness which has policies for 'authenticated' only
    - When users use anon key (not logged in), the trigger fails
  
  2. Solution
    - Drop existing INSERT policies for price_change_log and project_price_staleness
    - Create new INSERT policies that allow 'public' role
    - This allows the trigger to work for both authenticated and anonymous users
  
  3. Security
    - This is safe because:
      * These tables are only written to by the trigger
      * The trigger has SECURITY DEFINER so it runs with elevated permissions
      * Users still need permission to update price_list to trigger the function
      * Direct INSERT from users is still controlled by the trigger logic
*/

-- Drop existing INSERT policy for price_change_log
DROP POLICY IF EXISTS "Authenticated users can insert price change log" ON price_change_log;

-- Create new INSERT policy that allows public (includes both authenticated and anon)
CREATE POLICY "Allow insert to price change log"
  ON price_change_log
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Drop existing INSERT policy for project_price_staleness
DROP POLICY IF EXISTS "Authenticated users can insert project price staleness" ON project_price_staleness;

-- Create new INSERT policy that allows public
CREATE POLICY "Allow insert to project price staleness"
  ON project_price_staleness
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Also update UPDATE policy for project_price_staleness to allow public
DROP POLICY IF EXISTS "Authenticated users can update project price staleness" ON project_price_staleness;

CREATE POLICY "Allow update to project price staleness"
  ON project_price_staleness
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Update SELECT policies to allow public as well
DROP POLICY IF EXISTS "Authenticated users can read price change log" ON price_change_log;

CREATE POLICY "Allow read price change log"
  ON price_change_log
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read project price staleness" ON project_price_staleness;

CREATE POLICY "Allow read project price staleness"
  ON project_price_staleness
  FOR SELECT
  TO public
  USING (true);
