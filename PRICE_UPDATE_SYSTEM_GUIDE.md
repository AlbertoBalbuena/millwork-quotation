# Price Update Notification & Bulk Update System

## Overview

This system solves the problem of outdated prices in existing quotations when materials in the Price List are updated. It provides automatic detection, clear notifications, and powerful bulk update capabilities.

## Root Cause Analysis

### Why Prices Don't Auto-Update

The quotation system uses a **snapshot architecture** for pricing:

1. **At Cabinet Creation**: When a cabinet is added, the system calculates costs using current prices from the `price_list` table
2. **Cost Storage**: These calculated costs are stored as **frozen snapshot values** in columns like:
   - `box_material_cost`
   - `doors_material_cost`
   - `hardware_cost`
   - etc.
3. **Material References**: Cabinets reference materials by ID (`box_material_id`, `doors_material_id`)
4. **No Auto-Sync**: When price_list prices change, existing cabinet costs remain unchanged

### Why This Design?

This is **intentional** for:
- **Audit Trail**: Historical record of what was quoted
- **Quotation Stability**: Customer quotes don't change unexpectedly
- **Legal Compliance**: Binding quotes remain accurate

## Solution Components

### 1. Database Layer

#### New Tables

**`price_change_log`**
- Tracks every price change in price_list
- Records old price, new price, timestamp
- Enables audit trail and analytics

**`project_price_staleness`**
- Caches which projects have outdated prices
- Fast lookup for UI indicators
- Updated automatically via trigger

#### Triggers

**`trigger_log_price_change`**
- Fires on price_list UPDATE
- Logs price changes
- Marks affected projects as stale

### 2. Business Logic Layer

**File**: `/src/lib/priceUpdateSystem.ts`

**Key Functions**:

```typescript
// Analyze price differences for a project
analyzeProjectPriceChanges(projectId: string): Promise<ProjectPriceAnalysis>

// Update cabinet prices
updateCabinetPrices(cabinetIds: string[], onProgress?): Promise<UpdateResult>

// Update entire project or selected areas
updateProjectPrices(projectId: string, areaIds?, onProgress?): Promise<UpdateResult>

// Check if project has stale prices
checkProjectHasStalePrices(projectId: string): Promise<boolean>

// Get all projects with stale prices
getProjectsWithStalePrices(): Promise<string[]>
```

**Price Analysis Structure**:
```typescript
interface ProjectPriceAnalysis {
  projectId: string;
  hasStalePrices: boolean;
  affectedAreas: Array<{
    areaId: string;
    areaName: string;
    affectedCabinets: Array<{
      cabinetId: string;
      materialChanges: Array<{
        materialType: string;
        materialName: string;
        oldCost: number;
        newCost: number;
        difference: number;
        percentageChange: number;
      }>;
    }>;
  }>;
  totalPotentialDifference: number;
  affectedCabinetsCount: number;
}
```

### 3. User Interface Layer

#### A. Projects Page Indicators

**Visual Elements**:
- Yellow warning badge (⚠) on project cards with stale prices
- Appears in both grid and list views
- Tooltip: "Price updates available"

**Implementation**:
- Automatically loads stale project IDs on page load
- Shows indicator based on `project_price_staleness` table

#### B. Project Details Banner

**Visual Elements**:
- Prominent yellow banner at top of project page
- Shows when price updates are available
- Two action buttons:
  - "Review & Update Prices" - Opens bulk update modal
  - "Dismiss" - Hides banner (temporary)

**Behavior**:
- Checks for stale prices on page load
- Re-checks after successful updates
- Banner disappears after updating prices

#### C. Bulk Price Update Modal

**Three-Tab Interface**:

**Tab 1: Preview Impact**
- Summary statistics:
  - Number of affected cabinets
  - Number of materials changed
  - Total price difference (with up/down indicator)
- Expandable area breakdown
- Detailed material-by-material changes
- Color-coded positive/negative differences

**Tab 2: Select Areas**
- Checkbox list of all affected areas
- Shows cabinet count and total difference per area
- "Select All" / "Deselect All" buttons
- Summary panel shows selected totals

**Tab 3: Confirmation/Results**
- Progress indicator during update
- Real-time progress bar
- Success or error summary
- Automatic modal close on success

## User Workflows

### Scenario 1: Price List Update

1. **User updates material price** in Price List
2. **System automatically**:
   - Logs the price change
   - Identifies affected projects
   - Marks projects as having stale prices

### Scenario 2: Viewing Projects

1. **User navigates to Projects page**
2. **System displays**:
   - Yellow warning badges on affected projects
   - Clear visual indication without being intrusive

### Scenario 3: Reviewing & Updating Prices

1. **User opens affected project**
2. **Yellow banner appears** with summary
3. **User clicks "Review & Update Prices"**
4. **Preview tab shows**:
   - Exactly which materials changed
   - Old vs new prices
   - Impact on project total
5. **User selects areas to update** (or keeps all selected)
6. **User confirms update**
7. **System recalculates**:
   - Fetches current prices from price_list
   - Recalculates all cost components
   - Updates stored cabinet costs
   - Recalculates area/project totals
8. **Banner disappears**, indicator removed

## Data Flow

### Price Change Detection

```
Price List Update
    ↓
Trigger: trigger_log_price_change
    ↓
Insert into price_change_log
    ↓
Find affected projects (via FK relationships)
    ↓
Update project_price_staleness
    ↓
UI reflects changes on next load
```

### Price Update Process

```
User initiates update
    ↓
Analyze: analyzeProjectPriceChanges()
    ↓
Display preview in modal
    ↓
User selects areas
    ↓
updateProjectPrices()
    ↓
For each cabinet:
  - Fetch current prices
  - Recalculate all costs
  - Update database
    ↓
Recalculate area subtotals
    ↓
Update project total
    ↓
Clear staleness flag
    ↓
UI updates automatically
```

## Technical Details

### Recalculation Logic

The system uses the **same calculation functions** as cabinet creation:
- `calculateBoxMaterialCost()`
- `calculateDoorsMaterialCost()`
- `calculateHardwareCost()`
- etc.

This ensures consistency between:
- New cabinet creation
- Bulk price updates
- Manual cabinet edits

### Performance Considerations

1. **Lazy Loading**: Analysis runs on-demand, not automatically
2. **Cached Staleness**: `project_price_staleness` table provides O(1) lookup
3. **Batch Updates**: Processes multiple cabinets efficiently
4. **Progress Tracking**: Real-time feedback for long operations

### Data Integrity

1. **No Data Loss**: Original prices preserved in price_change_log
2. **Audit Trail**: Complete history of all price changes
3. **User Control**: Explicit opt-in for updates (no auto-updates)
4. **Selective Updates**: Can update specific areas, not entire project

## Security Considerations

### Row Level Security (RLS)

All new tables have RLS enabled:
```sql
-- Read access for authenticated users
CREATE POLICY "Authenticated users can read price change log"
  ON price_change_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read project price staleness"
  ON project_price_staleness FOR SELECT TO authenticated USING (true);
```

### Data Validation

- Price calculations use validated product and material data
- Foreign key constraints ensure data integrity
- Transaction-based updates for consistency

## Testing Recommendations

### Manual Testing Scenarios

1. **Price Change Detection**:
   - Update a material price in Price List
   - Verify affected projects show warning badge
   - Confirm banner appears in project details

2. **Price Analysis**:
   - Open bulk update modal
   - Verify accurate material change detection
   - Check calculations match expected differences

3. **Selective Updates**:
   - Deselect some areas
   - Confirm only selected areas update
   - Verify unselected areas retain old prices

4. **Edge Cases**:
   - Project with no stale prices (should show "All Up to Date")
   - Multiple price changes affecting same cabinet
   - Hardware price changes

### Automated Testing

Recommended test coverage:
- Price calculation functions
- Cabinet cost recalculation logic
- Staleness detection queries
- Bulk update transactions

## Maintenance & Monitoring

### Database Maintenance

**Cleanup old price change logs**:
```sql
-- Archive logs older than 1 year
DELETE FROM price_change_log
WHERE changed_at < NOW() - INTERVAL '1 year';
```

**Monitor staleness table size**:
```sql
SELECT COUNT(*) as stale_projects
FROM project_price_staleness
WHERE has_stale_prices = true;
```

### Performance Monitoring

Watch for:
- Slow bulk updates (> 30 seconds)
- Large price_change_log table
- Many projects with stale prices

## Future Enhancements

### Potential Features

1. **Email Notifications**: Alert users when prices change affecting their projects
2. **Scheduled Updates**: Automatically update prices on schedule
3. **Price Change Reports**: Analytics on price trends
4. **Approval Workflow**: Require manager approval for bulk updates
5. **Partial Updates**: Update only specific materials, not all
6. **Price History**: View historical prices for any material

### Database Optimizations

1. **Indexes**: Add indexes for common queries
2. **Partitioning**: Partition price_change_log by date
3. **Archival**: Move old changes to archive table

## Troubleshooting

### Issue: Prices not updating

**Check**:
1. Trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_price_change';`
2. RLS policies allow read/write
3. Price actually changed (not just edited without change)

### Issue: Wrong price calculations

**Check**:
1. Product catalog data is accurate
2. Material references are valid (not deleted materials)
3. Calculation settings match (waste percentages, etc.)

### Issue: Slow bulk updates

**Optimize**:
1. Update in smaller batches
2. Add indexes on frequently queried columns
3. Consider async processing for very large projects

## Support & Documentation

For questions or issues:
1. Check this guide first
2. Review database schema in `/supabase/migrations/`
3. Examine code in `/src/lib/priceUpdateSystem.ts`
4. Review UI components in `/src/components/BulkPriceUpdateModal.tsx`

## Conclusion

This system provides a robust, user-friendly solution for managing price updates in quotations while maintaining data integrity and audit compliance. The combination of automatic detection, clear notifications, and powerful bulk update capabilities gives users full control over their pricing data.
