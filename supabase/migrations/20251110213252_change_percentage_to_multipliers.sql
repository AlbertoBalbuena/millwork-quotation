/*
  # Change percentage columns to multipliers

  1. Changes
    - Rename tariff_percentage to tariff_multiplier
    - Rename profit_percentage to profit_multiplier
    - Rename taxes_percentage to tax_multiplier
    - Update default values to 0
    - Add comments explaining the new behavior

  2. Notes
    - Multipliers are decimal values (e.g., 0.11 for 11%, 0.5 for 50%)
    - This changes the calculation logic from percentage to direct multiplication
*/

-- Rename columns to reflect they are now multipliers, not percentages
ALTER TABLE projects 
  RENAME COLUMN tariff_percentage TO tariff_multiplier;

ALTER TABLE projects 
  RENAME COLUMN profit_percentage TO profit_multiplier;

ALTER TABLE projects 
  RENAME COLUMN taxes_percentage TO tax_multiplier;

-- Update the default values to 0 (no multiplier effect by default)
ALTER TABLE projects 
  ALTER COLUMN tariff_multiplier SET DEFAULT 0;

ALTER TABLE projects 
  ALTER COLUMN profit_multiplier SET DEFAULT 0;

ALTER TABLE projects 
  ALTER COLUMN tax_multiplier SET DEFAULT 0;

-- Add comments to clarify the new behavior
COMMENT ON COLUMN projects.tariff_multiplier IS 'Multiplier for tariff calculation (e.g., 0.11 for 11%)';
COMMENT ON COLUMN projects.profit_multiplier IS 'Multiplier for profit calculation (e.g., 0.5 for 50%)';
COMMENT ON COLUMN projects.tax_multiplier IS 'Multiplier for tax calculation (e.g., 0.0825 for 8.25%)';