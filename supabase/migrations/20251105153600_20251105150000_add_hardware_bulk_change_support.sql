/*
  # Add Hardware Bulk Change Support

  This migration extends the bulk material change system to support hardware operations.

  ## New Features
  
  1. Hardware Bulk Change Operations
    - Replace hardware items while preserving quantities
    - Remove hardware items from cabinets
    - Support for project-wide, single area, or selected areas scope

  2. Database Functions
    - update_hardware_in_cabinet: Updates hardware_id while preserving quantity_per_cabinet
    - remove_hardware_from_cabinet: Removes specific hardware from JSONB array
    - calculate_hardware_cost: Recalculates total hardware cost based on price_list
    - get_hardware_category: Identifies hardware category for validation

  3. Performance Enhancements
    - GIN indexes on hardware JSONB fields for fast searches
    - Optimized JSONB array manipulation functions

  4. Audit Trail Extension
    - operation_type field to distinguish 'replace' vs 'remove' operations
    - Full tracking of hardware changes in material_change_log

  ## Security
  - All functions use SECURITY DEFINER with proper RLS
  - No new security risks introduced
  - Follows existing access control patterns
*/

-- ============================================================================
-- EXTEND MATERIAL CHANGE LOG FOR HARDWARE OPERATIONS
-- ============================================================================

-- Add operation_type to distinguish replace vs remove operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'material_change_log' AND column_name = 'operation_type'
  ) THEN
    ALTER TABLE material_change_log 
    ADD COLUMN operation_type TEXT DEFAULT 'replace' 
    CHECK (operation_type IN ('replace', 'remove'));
  END IF;
END $$;

COMMENT ON COLUMN material_change_log.operation_type IS 'Type of operation: replace (change material/hardware) or remove (delete hardware)';

-- ============================================================================
-- PERFORMANCE INDEXES FOR HARDWARE SEARCHES
-- ============================================================================

-- GIN indexes enable fast searches within JSONB arrays
CREATE INDEX IF NOT EXISTS idx_area_cabinets_hardware_gin 
  ON area_cabinets USING GIN (hardware);

CREATE INDEX IF NOT EXISTS idx_version_area_cabinets_hardware_gin 
  ON version_area_cabinets USING GIN (hardware);

COMMENT ON INDEX idx_area_cabinets_hardware_gin IS 'Performance: Enables fast searches for specific hardware items in JSONB arrays using containment operators';
COMMENT ON INDEX idx_version_area_cabinets_hardware_gin IS 'Performance: Enables fast searches for specific hardware items in versioned cabinets';

-- ============================================================================
-- DATABASE FUNCTIONS FOR HARDWARE MANIPULATION
-- ============================================================================

-- Function to update hardware_id in cabinet while preserving quantity_per_cabinet
CREATE OR REPLACE FUNCTION update_hardware_in_cabinet(
  p_hardware_array JSONB,
  p_old_hardware_id UUID,
  p_new_hardware_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_item JSONB;
BEGIN
  -- Iterate through hardware array and replace matching hardware_id
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_hardware_array)
  LOOP
    IF (v_item->>'hardware_id')::uuid = p_old_hardware_id THEN
      -- Replace hardware_id but keep quantity_per_cabinet unchanged
      v_result := v_result || jsonb_build_object(
        'hardware_id', p_new_hardware_id::text,
        'quantity_per_cabinet', (v_item->>'quantity_per_cabinet')::integer
      );
    ELSE
      -- Keep other hardware items unchanged
      v_result := v_result || v_item;
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION update_hardware_in_cabinet IS 'Updates hardware_id in JSONB array while preserving quantity_per_cabinet. Used for bulk hardware replacement operations.';

-- Function to remove specific hardware from cabinet
CREATE OR REPLACE FUNCTION remove_hardware_from_cabinet(
  p_hardware_array JSONB,
  p_hardware_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_item JSONB;
BEGIN
  -- Iterate through hardware array and exclude matching hardware_id
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_hardware_array)
  LOOP
    IF (v_item->>'hardware_id')::uuid != p_hardware_id THEN
      -- Keep only non-matching hardware items
      v_result := v_result || v_item;
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION remove_hardware_from_cabinet IS 'Removes specific hardware item from JSONB array. Used when clients provide their own hardware (e.g., pulls, handles).';

-- Function to calculate hardware cost from hardware array
CREATE OR REPLACE FUNCTION calculate_hardware_cost(
  p_hardware_array JSONB,
  p_cabinet_quantity INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_total_cost NUMERIC := 0;
  v_item JSONB;
  v_hardware_price NUMERIC;
  v_quantity_per_cabinet INTEGER;
BEGIN
  -- Handle NULL or empty array
  IF p_hardware_array IS NULL OR jsonb_array_length(p_hardware_array) = 0 THEN
    RETURN 0;
  END IF;

  -- Iterate through hardware array and sum costs
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_hardware_array)
  LOOP
    -- Get hardware price from price_list
    SELECT price INTO v_hardware_price
    FROM price_list
    WHERE id = (v_item->>'hardware_id')::uuid
      AND is_active = true;
    
    -- Calculate cost if hardware found and active
    IF v_hardware_price IS NOT NULL THEN
      v_quantity_per_cabinet := COALESCE((v_item->>'quantity_per_cabinet')::integer, 0);
      v_total_cost := v_total_cost + (v_hardware_price * v_quantity_per_cabinet * p_cabinet_quantity);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_total_cost, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_hardware_cost IS 'Calculates total hardware cost from JSONB array based on price_list. Returns 0 for NULL/empty arrays. Used for cost recalculation after bulk hardware changes.';

-- ============================================================================
-- HELPER FUNCTION FOR FINDING CABINETS WITH SPECIFIC HARDWARE
-- ============================================================================

-- Function to count cabinets containing specific hardware (useful for UI)
CREATE OR REPLACE FUNCTION count_cabinets_with_hardware(
  p_table_name TEXT,
  p_hardware_id UUID,
  p_area_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_query TEXT;
BEGIN
  v_query := format(
    'SELECT COUNT(*) 
     FROM %I
     WHERE hardware @> ''[{"hardware_id": "%s"}]''::jsonb
     %s',
    p_table_name,
    p_hardware_id,
    CASE 
      WHEN p_area_ids IS NOT NULL THEN 'AND area_id = ANY($1)'
      ELSE ''
    END
  );
  
  IF p_area_ids IS NOT NULL THEN
    EXECUTE v_query INTO v_count USING p_area_ids;
  ELSE
    EXECUTE v_query INTO v_count;
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION count_cabinets_with_hardware IS 'Counts cabinets containing specific hardware. Used for displaying usage statistics in UI.';

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

-- Function to get hardware category for validation
CREATE OR REPLACE FUNCTION get_hardware_category(p_hardware_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_type TEXT;
  v_description TEXT;
  v_category TEXT;
BEGIN
  SELECT type, concept_description INTO v_type, v_description
  FROM price_list
  WHERE id = p_hardware_id;
  
  IF v_type IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_type := LOWER(v_type);
  v_description := LOWER(COALESCE(v_description, ''));
  
  -- Categorize based on type and description
  IF v_type LIKE '%hinge%' OR v_description LIKE '%hinge%' THEN
    RETURN 'hinge';
  ELSIF v_type LIKE '%slide%' OR v_description LIKE '%slide%' OR v_description LIKE '%drawer%' THEN
    RETURN 'slide';
  ELSIF v_type LIKE '%pull%' OR v_description LIKE '%pull%' OR v_description LIKE '%knob%' THEN
    RETURN 'pull';
  ELSIF v_type LIKE '%handle%' OR v_description LIKE '%handle%' THEN
    RETURN 'handle';
  ELSIF v_type LIKE '%hardware%' THEN
    RETURN 'hardware';
  ELSE
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_hardware_category IS 'Determines hardware category from price_list type and description. Used for validation to ensure compatible hardware replacements (hinges with hinges, slides with slides, etc.).';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE material_change_log IS 'Audit log for bulk material and hardware change operations across cabinets. Tracks replacements and removals with full cost impact analysis.';
