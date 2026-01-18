# Referral Currency Rate Persistence Fix

## Issue
The `referral_currency_rate` field (Romero's %) was not being persisted in the JSON Export/Import system, which could result in data loss when exporting and re-importing projects.

## Audit Results

### 1. Database Schema
**Status:** CORRECT
- Field exists in the `projects` table (migration: `20260118012312_add_referral_currency_rate_to_projects.sql`)
- Column type: `numeric` with default value of `0`
- Properly documented with a comment

### 2. TypeScript Types (`src/types/index.ts`)
**Status:** CORRECT
- The `Project` type is derived from `Database['public']['Tables']['projects']['Row']`
- The database types file (`src/lib/database.types.ts`) includes `referral_currency_rate` in:
  - Row type (line 136)
  - Insert type (line 158)
  - Update type (line 180)
- No manual type updates needed

### 3. Versioning System (`src/lib/versioningSystem.ts`)
**Status:** CORRECT
- The `create_project_snapshot` database function uses `to_jsonb(p)` which automatically includes ALL fields from the projects table
- The snapshot correctly captures `referral_currency_rate` since it's stored at the database level
- No code changes needed

### 4. Export/Import System (`src/utils/projectExportImport.ts`)
**Status:** FIXED
- **Problem Found:** The `performProjectImport` function was not including `referral_currency_rate` in the project insert statement
- **Fix Applied:** Added `referral_currency_rate: project.referral_currency_rate || 0` to the `projectInsert` object at line 223

## Changes Made

### File: `src/utils/projectExportImport.ts`

**Before:**
```typescript
const projectInsert = {
  name: newProjectName,
  customer: project.customer,
  // ... other fields ...
  install_delivery: project.install_delivery || 0,
  project_brief: project.project_brief,
  // Missing: referral_currency_rate
};
```

**After:**
```typescript
const projectInsert = {
  name: newProjectName,
  customer: project.customer,
  // ... other fields ...
  install_delivery: project.install_delivery || 0,
  referral_currency_rate: project.referral_currency_rate || 0,
  project_brief: project.project_brief,
};
```

## Testing Recommendations

To verify the fix works correctly:

1. **Export Test:**
   - Create a project with a non-zero `referral_currency_rate` (e.g., 0.06)
   - Export the project as JSON
   - Verify the JSON file contains the `referral_currency_rate` field in the project object

2. **Import Test:**
   - Import a project JSON that contains `referral_currency_rate`
   - Verify the imported project has the correct value preserved
   - Check the USD Summary PDF to ensure the referral fee calculations are correct

3. **Version Test:**
   - Create a project with a non-zero `referral_currency_rate`
   - Make changes that trigger a version snapshot
   - Verify the version history shows the correct `referral_currency_rate` value

## Impact

This fix ensures that:
- Project exports include the complete financial configuration
- Imported projects maintain the correct referral fee percentage
- No data loss occurs when transferring projects between systems
- Version snapshots correctly preserve all financial settings

## Related Features

The `referral_currency_rate` field is used in:
- USD Summary PDF generation (`src/utils/printQuotation.ts`)
- Project financial calculations
- Admin view total calculations
- All project-level financial reporting
