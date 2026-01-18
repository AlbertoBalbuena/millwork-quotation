/*
  # Add Referral Fee Field to Projects

  1. Changes
    - Add `referral_currency_rate` column to `projects` table
      - Type: numeric
      - Default: 0
      - Description: Percentage rate for referral/Romero's fee (e.g., 0.06 for 6%)
  
  2. Purpose
    - Enables calculation of referral fee based on (Price + Install Cost)
    - Part of critical calculation logic fix to match client's Excel requirements
*/

-- Add referral_currency_rate column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS referral_currency_rate numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN projects.referral_currency_rate IS 'Referral fee percentage rate (e.g., 0.06 for 6%) applied to (Price + Install Cost)';
