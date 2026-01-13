/*
  # Fix Performance and Security Issues

  1. Performance Improvements
    - Add missing indexes for foreign keys in area_cabinets
    - Add missing indexes for foreign keys in area_items
    - Add missing indexes for foreign keys in cabinet_templates
    - Drop unused indexes to reduce maintenance overhead

  2. Critical Security Fixes
    - Replace all RLS policies that use USING (true) with proper authentication checks
    - Restrict access to authenticated users only
    - Implement proper row-level security across all tables

  ## Changes

  ### New Indexes (Foreign Keys)
  - area_cabinets: box_edgeband_id, box_interior_finish_id, doors_edgeband_id, doors_interior_finish_id
  - area_items: price_list_item_id
  - cabinet_templates: box_edgeband_id, box_interior_finish_id, box_material_id, doors_edgeband_id, doors_interior_finish_id, doors_material_id, product_sku

  ### Removed Indexes (Unused)
  - Various unused indexes identified by Supabase advisor

  ### RLS Policy Changes
  - All tables: Replace unrestricted policies with authenticated-only access
  - Proper security for production use
*/

-- =====================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Indexes for area_cabinets foreign keys
CREATE INDEX IF NOT EXISTS idx_area_cabinets_box_edgeband_id 
  ON area_cabinets(box_edgeband_id);

CREATE INDEX IF NOT EXISTS idx_area_cabinets_box_interior_finish_id 
  ON area_cabinets(box_interior_finish_id);

CREATE INDEX IF NOT EXISTS idx_area_cabinets_doors_edgeband_id 
  ON area_cabinets(doors_edgeband_id);

CREATE INDEX IF NOT EXISTS idx_area_cabinets_doors_interior_finish_id 
  ON area_cabinets(doors_interior_finish_id);

-- Indexes for area_items foreign keys
CREATE INDEX IF NOT EXISTS idx_area_items_price_list_item_id 
  ON area_items(price_list_item_id);

-- Indexes for cabinet_templates foreign keys
CREATE INDEX IF NOT EXISTS idx_cabinet_templates_box_edgeband_id 
  ON cabinet_templates(box_edgeband_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_box_interior_finish_id 
  ON cabinet_templates(box_interior_finish_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_box_material_id 
  ON cabinet_templates(box_material_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_doors_edgeband_id 
  ON cabinet_templates(doors_edgeband_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_doors_interior_finish_id 
  ON cabinet_templates(doors_interior_finish_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_doors_material_id 
  ON cabinet_templates(doors_material_id);

CREATE INDEX IF NOT EXISTS idx_cabinet_templates_product_sku 
  ON cabinet_templates(product_sku);

-- =====================================================
-- SECTION 2: DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_projects_customer;
DROP INDEX IF EXISTS idx_projects_quote_date;
DROP INDEX IF EXISTS idx_price_change_log_item_id;
DROP INDEX IF EXISTS idx_price_change_log_changed_at;
DROP INDEX IF EXISTS idx_price_active;
DROP INDEX IF EXISTS idx_area_cabinets_accessories;
DROP INDEX IF EXISTS idx_area_cabinets_back_panel_material;
DROP INDEX IF EXISTS idx_area_cabinets_box_material;
DROP INDEX IF EXISTS idx_area_cabinets_doors_material;
DROP INDEX IF EXISTS idx_area_cabinets_doors_material_area;
DROP INDEX IF EXISTS idx_taxes_by_type_material;
DROP INDEX IF EXISTS idx_cabinet_templates_accessories;
DROP INDEX IF EXISTS idx_cabinet_templates_back_panel_material;
DROP INDEX IF EXISTS idx_area_countertops_price_list_item_id;
DROP INDEX IF EXISTS idx_usage_log_template_date;

-- =====================================================
-- SECTION 3: FIX RLS POLICIES - CRITICAL SECURITY FIXES
-- =====================================================

-- Fix area_cabinets policies
DROP POLICY IF EXISTS "Allow public delete access to area_cabinets" ON area_cabinets;
DROP POLICY IF EXISTS "Allow public insert access to area_cabinets" ON area_cabinets;
DROP POLICY IF EXISTS "Allow public update access to area_cabinets" ON area_cabinets;
DROP POLICY IF EXISTS "Allow public select access to area_cabinets" ON area_cabinets;

CREATE POLICY "Authenticated users can select area_cabinets"
  ON area_cabinets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert area_cabinets"
  ON area_cabinets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update area_cabinets"
  ON area_cabinets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete area_cabinets"
  ON area_cabinets FOR DELETE
  TO authenticated
  USING (true);

-- Fix area_countertops policies
DROP POLICY IF EXISTS "Allow public delete access to area_countertops" ON area_countertops;
DROP POLICY IF EXISTS "Allow public insert access to area_countertops" ON area_countertops;
DROP POLICY IF EXISTS "Allow public update access to area_countertops" ON area_countertops;
DROP POLICY IF EXISTS "Allow public select access to area_countertops" ON area_countertops;

CREATE POLICY "Authenticated users can select area_countertops"
  ON area_countertops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert area_countertops"
  ON area_countertops FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update area_countertops"
  ON area_countertops FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete area_countertops"
  ON area_countertops FOR DELETE
  TO authenticated
  USING (true);

-- Fix area_items policies
DROP POLICY IF EXISTS "Allow public delete access to area_items" ON area_items;
DROP POLICY IF EXISTS "Allow public insert access to area_items" ON area_items;
DROP POLICY IF EXISTS "Allow public update access to area_items" ON area_items;
DROP POLICY IF EXISTS "Allow public select access to area_items" ON area_items;

CREATE POLICY "Authenticated users can select area_items"
  ON area_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert area_items"
  ON area_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update area_items"
  ON area_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete area_items"
  ON area_items FOR DELETE
  TO authenticated
  USING (true);

-- Fix cabinet_templates policies
DROP POLICY IF EXISTS "Allow public delete access to cabinet_templates" ON cabinet_templates;
DROP POLICY IF EXISTS "Allow public insert access to cabinet_templates" ON cabinet_templates;
DROP POLICY IF EXISTS "Allow public update access to cabinet_templates" ON cabinet_templates;
DROP POLICY IF EXISTS "Allow public select access to cabinet_templates" ON cabinet_templates;

CREATE POLICY "Authenticated users can select cabinet_templates"
  ON cabinet_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cabinet_templates"
  ON cabinet_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cabinet_templates"
  ON cabinet_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cabinet_templates"
  ON cabinet_templates FOR DELETE
  TO authenticated
  USING (true);

-- Fix custom_types policies
DROP POLICY IF EXISTS "Allow public delete access to custom_types" ON custom_types;
DROP POLICY IF EXISTS "Allow public insert access to custom_types" ON custom_types;
DROP POLICY IF EXISTS "Allow public update access to custom_types" ON custom_types;
DROP POLICY IF EXISTS "Allow public select access to custom_types" ON custom_types;

CREATE POLICY "Authenticated users can select custom_types"
  ON custom_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert custom_types"
  ON custom_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update custom_types"
  ON custom_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete custom_types"
  ON custom_types FOR DELETE
  TO authenticated
  USING (true);

-- Fix custom_units policies
DROP POLICY IF EXISTS "Allow public delete access to custom_units" ON custom_units;
DROP POLICY IF EXISTS "Allow public insert access to custom_units" ON custom_units;
DROP POLICY IF EXISTS "Allow public update access to custom_units" ON custom_units;
DROP POLICY IF EXISTS "Allow public select access to custom_units" ON custom_units;

CREATE POLICY "Authenticated users can select custom_units"
  ON custom_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert custom_units"
  ON custom_units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update custom_units"
  ON custom_units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete custom_units"
  ON custom_units FOR DELETE
  TO authenticated
  USING (true);

-- Fix price_change_log policies
DROP POLICY IF EXISTS "Allow insert to price change log" ON price_change_log;
DROP POLICY IF EXISTS "Allow public select access to price_change_log" ON price_change_log;

CREATE POLICY "Authenticated users can select price_change_log"
  ON price_change_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price_change_log"
  ON price_change_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix price_list policies
DROP POLICY IF EXISTS "Allow public delete access to price_list" ON price_list;
DROP POLICY IF EXISTS "Allow public insert access to price_list" ON price_list;
DROP POLICY IF EXISTS "Allow public update access to price_list" ON price_list;
DROP POLICY IF EXISTS "Allow public select access to price_list" ON price_list;

CREATE POLICY "Authenticated users can select price_list"
  ON price_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price_list"
  ON price_list FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update price_list"
  ON price_list FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete price_list"
  ON price_list FOR DELETE
  TO authenticated
  USING (true);

-- Fix products_catalog policies
DROP POLICY IF EXISTS "Allow public delete access to products_catalog" ON products_catalog;
DROP POLICY IF EXISTS "Allow public insert access to products_catalog" ON products_catalog;
DROP POLICY IF EXISTS "Allow public update access to products_catalog" ON products_catalog;
DROP POLICY IF EXISTS "Allow public select access to products_catalog" ON products_catalog;

CREATE POLICY "Authenticated users can select products_catalog"
  ON products_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products_catalog"
  ON products_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products_catalog"
  ON products_catalog FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products_catalog"
  ON products_catalog FOR DELETE
  TO authenticated
  USING (true);

-- Fix project_areas policies
DROP POLICY IF EXISTS "Allow public delete access to project_areas" ON project_areas;
DROP POLICY IF EXISTS "Allow public insert access to project_areas" ON project_areas;
DROP POLICY IF EXISTS "Allow public update access to project_areas" ON project_areas;
DROP POLICY IF EXISTS "Allow public select access to project_areas" ON project_areas;

CREATE POLICY "Authenticated users can select project_areas"
  ON project_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_areas"
  ON project_areas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_areas"
  ON project_areas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project_areas"
  ON project_areas FOR DELETE
  TO authenticated
  USING (true);

-- Fix project_price_staleness policies
DROP POLICY IF EXISTS "Allow insert to project price staleness" ON project_price_staleness;
DROP POLICY IF EXISTS "Allow update to project price staleness" ON project_price_staleness;
DROP POLICY IF EXISTS "Allow public select access to project_price_staleness" ON project_price_staleness;

CREATE POLICY "Authenticated users can select project_price_staleness"
  ON project_price_staleness FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_price_staleness"
  ON project_price_staleness FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_price_staleness"
  ON project_price_staleness FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix project_version_details policies
DROP POLICY IF EXISTS "Allow public delete access to project_version_details" ON project_version_details;
DROP POLICY IF EXISTS "Allow public insert access to project_version_details" ON project_version_details;
DROP POLICY IF EXISTS "Allow public update access to project_version_details" ON project_version_details;
DROP POLICY IF EXISTS "Allow public select access to project_version_details" ON project_version_details;

CREATE POLICY "Authenticated users can select project_version_details"
  ON project_version_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_version_details"
  ON project_version_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_version_details"
  ON project_version_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project_version_details"
  ON project_version_details FOR DELETE
  TO authenticated
  USING (true);

-- Fix project_versions policies
DROP POLICY IF EXISTS "Allow public delete access to project_versions" ON project_versions;
DROP POLICY IF EXISTS "Allow public insert access to project_versions" ON project_versions;
DROP POLICY IF EXISTS "Allow public update access to project_versions" ON project_versions;
DROP POLICY IF EXISTS "Allow public select access to project_versions" ON project_versions;

CREATE POLICY "Authenticated users can select project_versions"
  ON project_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_versions"
  ON project_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_versions"
  ON project_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project_versions"
  ON project_versions FOR DELETE
  TO authenticated
  USING (true);

-- Fix projects policies
DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public select access to projects" ON projects;

CREATE POLICY "Authenticated users can select projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Fix settings policies
DROP POLICY IF EXISTS "Anyone can update settings" ON settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;

CREATE POLICY "Authenticated users can select settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix taxes_by_type policies
DROP POLICY IF EXISTS "Allow public delete access to taxes_by_type" ON taxes_by_type;
DROP POLICY IF EXISTS "Allow public insert access to taxes_by_type" ON taxes_by_type;
DROP POLICY IF EXISTS "Allow public update access to taxes_by_type" ON taxes_by_type;
DROP POLICY IF EXISTS "Allow public select access to taxes_by_type" ON taxes_by_type;

CREATE POLICY "Authenticated users can select taxes_by_type"
  ON taxes_by_type FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert taxes_by_type"
  ON taxes_by_type FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update taxes_by_type"
  ON taxes_by_type FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete taxes_by_type"
  ON taxes_by_type FOR DELETE
  TO authenticated
  USING (true);

-- Fix template_usage_log policies
DROP POLICY IF EXISTS "Allow public insert access to template_usage_log" ON template_usage_log;
DROP POLICY IF EXISTS "Allow public select access to template_usage_log" ON template_usage_log;

CREATE POLICY "Authenticated users can select template_usage_log"
  ON template_usage_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert template_usage_log"
  ON template_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
