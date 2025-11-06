/*
  # Backfill Original Prices for Existing Cabinets

  1. Purpose
    - Populate the new original_*_price fields for existing cabinets
    - Uses reverse calculation to infer the original unit price from the stored cost
    - This ensures the price change detection system works for all cabinets, not just new ones
  
  2. Logic
    - For sheet materials (box_material, doors_material, interior finishes):
      * Stored cost = (price_per_sheet / 32) * sqft_used
      * Therefore: price_per_sheet = (stored_cost * 32) / sqft_used
    - For edgeband materials (box_edgeband, doors_edgeband):
      * Stored cost = price_per_roll * (meters_used / 100)
      * Therefore: price_per_roll = (stored_cost * 100) / meters_used
  
  3. Notes
    - Only updates cabinets where original price is NULL
    - Skips cabinets where calculation would result in division by zero
    - This is a one-time backfill operation
*/

-- Function to backfill original prices
CREATE OR REPLACE FUNCTION backfill_cabinet_original_prices()
RETURNS void AS $$
DECLARE
  cabinet_record RECORD;
  product_record RECORD;
  usage_amount numeric;
  inferred_price numeric;
BEGIN
  -- Loop through all cabinets that need backfilling
  FOR cabinet_record IN 
    SELECT * FROM area_cabinets
    WHERE original_box_material_price IS NULL
       OR original_box_edgeband_price IS NULL
       OR original_box_interior_finish_price IS NULL
       OR original_doors_material_price IS NULL
       OR original_doors_edgeband_price IS NULL
       OR original_doors_interior_finish_price IS NULL
  LOOP
    -- Get product details
    SELECT * INTO product_record
    FROM products_catalog
    WHERE sku = cabinet_record.product_sku;
    
    IF product_record.sku IS NULL THEN
      CONTINUE;
    END IF;

    -- Backfill box_material original price
    IF cabinet_record.box_material_id IS NOT NULL 
       AND cabinet_record.box_material_cost IS NOT NULL 
       AND cabinet_record.original_box_material_price IS NULL THEN
      usage_amount := product_record.box_sf * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.box_material_cost * 32.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_box_material_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;

    -- Backfill box_edgeband original price
    IF cabinet_record.box_edgeband_id IS NOT NULL 
       AND cabinet_record.box_edgeband_cost IS NOT NULL 
       AND cabinet_record.original_box_edgeband_price IS NULL THEN
      usage_amount := product_record.total_edgeband * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.box_edgeband_cost * 100.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_box_edgeband_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;

    -- Backfill box_interior_finish original price
    IF cabinet_record.box_interior_finish_id IS NOT NULL 
       AND cabinet_record.box_interior_finish_cost IS NOT NULL 
       AND cabinet_record.original_box_interior_finish_price IS NULL THEN
      usage_amount := product_record.box_sf * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.box_interior_finish_cost * 32.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_box_interior_finish_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;

    -- Backfill doors_material original price
    IF cabinet_record.doors_material_id IS NOT NULL 
       AND cabinet_record.doors_material_cost IS NOT NULL 
       AND cabinet_record.original_doors_material_price IS NULL THEN
      usage_amount := product_record.doors_fronts_sf * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.doors_material_cost * 32.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_doors_material_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;

    -- Backfill doors_edgeband original price
    IF cabinet_record.doors_edgeband_id IS NOT NULL 
       AND cabinet_record.doors_edgeband_cost IS NOT NULL 
       AND cabinet_record.original_doors_edgeband_price IS NULL THEN
      usage_amount := COALESCE(product_record.doors_fronts_edgeband, 0) * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.doors_edgeband_cost * 100.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_doors_edgeband_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;

    -- Backfill doors_interior_finish original price
    IF cabinet_record.doors_interior_finish_id IS NOT NULL 
       AND cabinet_record.doors_interior_finish_cost IS NOT NULL 
       AND cabinet_record.original_doors_interior_finish_price IS NULL THEN
      usage_amount := product_record.doors_fronts_sf * cabinet_record.quantity;
      IF usage_amount > 0 THEN
        inferred_price := (cabinet_record.doors_interior_finish_cost * 32.0) / usage_amount;
        UPDATE area_cabinets 
        SET original_doors_interior_finish_price = inferred_price
        WHERE id = cabinet_record.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the backfill function
SELECT backfill_cabinet_original_prices();

-- Drop the function as it's only needed once
DROP FUNCTION IF EXISTS backfill_cabinet_original_prices();
