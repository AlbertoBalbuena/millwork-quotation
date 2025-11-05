/*
  # Add Tariff Percentage to Projects

  1. Changes
    - Add `tariff_percentage` column to `projects` table
      - Type: numeric (to support decimal percentages)
      - Default: 0
      - Allows storing tariff as a percentage (e.g., 5.5 for 5.5%)
  
  2. Purpose
    - Enable projects to include tariff costs as a percentage of the subtotal
    - Tariff will be calculated as: (cabinets + items + countertops + other_expenses + install_delivery) * (tariff_percentage / 100)
    - This tariff amount is then added to the project total before taxes
*/

-- Add tariff_percentage column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'tariff_percentage'
  ) THEN
    ALTER TABLE projects ADD COLUMN tariff_percentage numeric DEFAULT 0;
  END IF;
END $$;
