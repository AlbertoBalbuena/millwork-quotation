/*
  # Fix Price Change Log RLS Policy

  1. Changes
    - Add INSERT policy for price_change_log table
    - The trigger log_price_change() needs to insert rows when prices are updated
    - Without INSERT policy, the trigger fails with RLS violation
  
  2. Security
    - Allow authenticated users to insert price change log entries
    - This is safe because the trigger only runs on price_list updates
    - The trigger is executed with the user's permissions
*/

-- Add INSERT policy for price_change_log
-- This allows the trigger to insert log entries when prices are updated
CREATE POLICY "Authenticated users can insert price change log"
  ON price_change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
