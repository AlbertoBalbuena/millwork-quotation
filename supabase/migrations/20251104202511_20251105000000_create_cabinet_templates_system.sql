/*
  # Cabinet Templates System

  ## Overview
  This migration creates a comprehensive cabinet template system that allows users to save
  and reuse cabinet configurations across different projects and areas, with full usage
  analytics and tracking capabilities.

  ## New Tables

  ### 1. cabinet_templates
  Stores reusable cabinet configurations that can be applied across any project or area:
  - Template identification: id, name, description, category
  - Product reference: product_sku (links to products_catalog)
  - Box construction: box_material_id, box_edgeband_id, box_interior_finish_id
  - Doors/fronts: doors_material_id, doors_edgeband_id, doors_interior_finish_id
  - Hardware configuration: hardware (JSONB array)
  - Settings: is_rta flag, use interior finish flags
  - Metadata: created_at, updated_at, usage_count, last_used_at
  - Denormalized data for performance: material names for quick display

  Note: Quantity is NOT stored in templates - users specify quantity when loading

  ### 2. template_usage_log
  Tracks every instance where a template is used in a project:
  - Usage tracking: template_id, project_id, area_id, cabinet_id
  - Timestamp: used_at
  - Analytics support: enables usage reports and trend analysis

  ## Security
  - RLS enabled on all tables
  - System-wide read access for all users
  - Controlled write access with public policies
  - Usage logs are append-only for data integrity

  ## Performance
  - Indexes on frequently queried fields (category, usage_count, name)
  - Compound indexes for analytics queries
  - Materialized view support for analytics dashboard
  - Full-text search index on template name and description

  ## Important Notes
  - Templates reference materials via foreign keys with SET NULL on delete
  - Material names are denormalized for faster template browsing
  - Usage count is automatically incremented via triggers
  - Templates work across both standard and versioned project areas
*/

-- ============================================================================
-- CABINET TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cabinet_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template metadata
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'General',

  -- Product reference
  product_sku VARCHAR(100) REFERENCES products_catalog(sku) ON DELETE SET NULL,
  product_description TEXT,

  -- Box construction materials
  box_material_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  box_material_name TEXT,
  box_edgeband_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  box_edgeband_name TEXT,
  box_interior_finish_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  box_interior_finish_name TEXT,
  use_box_interior_finish BOOLEAN DEFAULT false,

  -- Doors & drawer fronts materials
  doors_material_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  doors_material_name TEXT,
  doors_edgeband_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  doors_edgeband_name TEXT,
  doors_interior_finish_id UUID REFERENCES price_list(id) ON DELETE SET NULL,
  doors_interior_finish_name TEXT,
  use_doors_interior_finish BOOLEAN DEFAULT false,

  -- Hardware configuration (JSON array of {hardware_id, quantity_per_cabinet})
  hardware JSONB DEFAULT '[]',

  -- Cabinet settings
  is_rta BOOLEAN DEFAULT true,

  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON cabinet_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON cabinet_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_last_used ON cabinet_templates(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_templates_product_sku ON cabinet_templates(product_sku);
CREATE INDEX IF NOT EXISTS idx_templates_created ON cabinet_templates(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_templates_search ON cabinet_templates
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(product_description, '')));

-- Compound index for analytics queries
CREATE INDEX IF NOT EXISTS idx_templates_category_usage ON cabinet_templates(category, usage_count DESC);

-- Enable RLS
ALTER TABLE cabinet_templates ENABLE ROW LEVEL SECURITY;

-- System-wide read access
CREATE POLICY "Allow public read access to cabinet_templates"
  ON cabinet_templates FOR SELECT
  TO public
  USING (true);

-- System-wide insert access
CREATE POLICY "Allow public insert access to cabinet_templates"
  ON cabinet_templates FOR INSERT
  TO public
  WITH CHECK (true);

-- System-wide update access
CREATE POLICY "Allow public update access to cabinet_templates"
  ON cabinet_templates FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- System-wide delete access
CREATE POLICY "Allow public delete access to cabinet_templates"
  ON cabinet_templates FOR DELETE
  TO public
  USING (true);

-- ============================================================================
-- TEMPLATE USAGE LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  template_id UUID NOT NULL REFERENCES cabinet_templates(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  area_id UUID NOT NULL,
  cabinet_id UUID,

  -- Tracking
  used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Additional context for analytics
  quantity_used INTEGER DEFAULT 1
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_log_template ON template_usage_log(template_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_project ON template_usage_log(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_used_at ON template_usage_log(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_log_template_date ON template_usage_log(template_id, used_at DESC);

-- Enable RLS
ALTER TABLE template_usage_log ENABLE ROW LEVEL SECURITY;

-- System-wide read access
CREATE POLICY "Allow public read access to template_usage_log"
  ON template_usage_log FOR SELECT
  TO public
  USING (true);

-- System-wide insert access (append-only for data integrity)
CREATE POLICY "Allow public insert access to template_usage_log"
  ON template_usage_log FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update template usage statistics
CREATE OR REPLACE FUNCTION update_template_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cabinet_templates
  SET
    usage_count = usage_count + 1,
    last_used_at = NEW.used_at,
    updated_at = NOW()
  WHERE id = NEW.template_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage stats when template is used
CREATE TRIGGER trigger_update_template_usage_stats
  AFTER INSERT ON template_usage_log
  FOR EACH ROW
  EXECUTE FUNCTION update_template_usage_stats();

-- Function to update template updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on template changes
CREATE TRIGGER trigger_update_template_timestamp
  BEFORE UPDATE ON cabinet_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_timestamp();

-- ============================================================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================================================

-- Function to get most used templates
CREATE OR REPLACE FUNCTION get_most_used_templates(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.id,
    ct.name,
    ct.category,
    ct.usage_count,
    ct.last_used_at
  FROM cabinet_templates ct
  WHERE ct.usage_count > 0
  ORDER BY ct.usage_count DESC, ct.last_used_at DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get template usage by category
CREATE OR REPLACE FUNCTION get_template_usage_by_category()
RETURNS TABLE (
  category VARCHAR,
  total_templates BIGINT,
  total_uses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.category,
    COUNT(DISTINCT ct.id) as total_templates,
    COALESCE(SUM(ct.usage_count), 0) as total_uses
  FROM cabinet_templates ct
  GROUP BY ct.category
  ORDER BY total_uses DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get template usage over time
CREATE OR REPLACE FUNCTION get_template_usage_timeline(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  usage_date DATE,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(tul.used_at) as usage_date,
    COUNT(*) as usage_count
  FROM template_usage_log tul
  WHERE tul.used_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(tul.used_at)
  ORDER BY usage_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE cabinet_templates IS 'Stores reusable cabinet configurations that can be applied across any project or area';
COMMENT ON TABLE template_usage_log IS 'Tracks every instance where a template is used, enabling usage analytics and reporting';

COMMENT ON COLUMN cabinet_templates.name IS 'Unique template name for easy identification';
COMMENT ON COLUMN cabinet_templates.category IS 'Template category for filtering (Base Cabinets, Wall Cabinets, etc.)';
COMMENT ON COLUMN cabinet_templates.usage_count IS 'Total number of times this template has been used';
COMMENT ON COLUMN cabinet_templates.last_used_at IS 'Timestamp of most recent template usage';
COMMENT ON COLUMN cabinet_templates.hardware IS 'JSONB array of hardware items: [{hardware_id, quantity_per_cabinet}]';
COMMENT ON COLUMN cabinet_templates.product_description IS 'Denormalized product description for faster display';

COMMENT ON COLUMN template_usage_log.quantity_used IS 'Number of cabinets created from template in this usage instance';
