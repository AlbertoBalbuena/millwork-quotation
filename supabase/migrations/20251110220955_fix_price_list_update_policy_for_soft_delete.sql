/*
  # Fix Price List Update Policy for Soft Delete

  1. Problem
    - When updating price_list to set is_active = false (soft delete), the operation fails
    - The UPDATE policy has WITH CHECK (true) which is fine
    - But when .select() is called after UPDATE, it tries to return the updated row
    - The SELECT policy only allows rows where is_active = true
    - The newly updated row has is_active = false, so it violates the SELECT policy
    - This causes "new row violates row-level security policy" error

  2. Solution
    - Update the SELECT policy to allow viewing all rows (both active and inactive)
    - This allows the UPDATE operation to return the updated row
    - The frontend already filters to only show is_active = true items
    - This is safe because users should be able to see items they're managing

  3. Changes
    - Modified SELECT policy to use true instead of (is_active = true)
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Allow public read access to price_list" ON price_list;

-- Create new SELECT policy that allows viewing all items
CREATE POLICY "Allow public read access to price_list"
  ON price_list FOR SELECT
  TO public
  USING (true);