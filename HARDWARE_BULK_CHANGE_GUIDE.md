# Hardware Bulk Change System - User Guide

## Overview

The Hardware Bulk Change system extends the existing bulk material change functionality to support hardware operations across multiple cabinets. This feature enables you to replace or remove hardware items (hinges, slides, pulls, handles) across entire projects, specific areas, or selected areas in seconds.

## Key Benefits

- **Massive Time Savings**: Change hardware in 50+ cabinets in under 1 minute (vs 45-60 minutes manually)
- **Replace or Remove**: Replace hardware with compatible alternatives OR remove hardware entirely
- **Category Safety**: Automatic validation ensures you only replace compatible hardware types
- **Quantity Preservation**: Original quantities per cabinet are maintained during replacements
- **Flexible Scope**: Apply changes to entire projects, single areas, or selected areas
- **Full Preview**: Review cost impact before applying any changes
- **Audit Trail**: All hardware changes are logged for accountability

## Common Use Cases

### 1. Hardware Upgrades/Downgrades
- Upgrade all "Standard Drawer Slides" to "Soft-Close Premium Slides"
- Downgrade hinges to meet budget constraints
- Switch to different manufacturer hardware

### 2. Client-Provided Hardware
- Remove all "Cabinet Pulls" when client will purchase their own
- Remove "Handles" if client has custom hardware
- Eliminate hardware costs for client-supplied items

### 3. Standardization
- Replace mixed hardware with standardized options across project
- Ensure consistent hardware across all areas
- Update legacy hardware selections

## Accessing the Feature

### Project-Wide Changes
Click the **"Change Materials"** button in the main project toolbar (next to "Add Area" and "Print").

### Area-Specific Changes
Click the **refresh icon (⟳)** button in any area's header (next to the calculator icon).

## Step-by-Step Usage

### 1. Select Scope

Choose where to apply the hardware change:

- **Entire Project**: Updates all cabinets in all areas that contain the selected hardware
- **Single Area**: Updates cabinets in one specific area only
- **Selected Areas**: Choose multiple areas with checkboxes

### 2. Select Hardware Type

In the "Material Type to Change" dropdown, select **"Hardware"**.

### 3. Select Current Hardware

**Current Hardware Dropdown**:
- Shows only hardware items currently used in your selected scope
- Displays the number of cabinets using each hardware item
- Example: "Soft-Close Hinge Premium (47 cabinets)"

### 4. Choose Operation: Replace or Remove

#### Option A: Replace Hardware

1. Keep the default "Replace" mode
2. Select the **New Hardware** from the dropdown:
   - Shows ALL active hardware from Price List
   - Filtered to show only compatible hardware (same category)
   - Searchable with autocomplete
   - Displays: "Hardware Name - Dimensions - $Price/Unit"

**Category Validation**: The system ensures you can only replace:
- Hinges with other hinges
- Slides with other slides
- Pulls with other pulls
- Handles with other handles

#### Option B: Remove Hardware

1. Click the **"Remove Instead"** button (with trash icon)
2. The interface changes to show removal confirmation
3. No new hardware selection needed
4. Use this when clients provide their own hardware

### 5. Preview Changes

Click **"Preview Changes"** to see:

**Summary Card**:
- Total cabinets affected
- Cost change (total and percentage)
- Current total vs New total

**Detailed Table**:
- Product SKU for each affected cabinet
- Quantity of cabinets
- Current cost vs New cost
- Cost difference per cabinet
- Hardware quantity per cabinet

**Cost Change Warnings**:
- Changes over 20% increase/decrease trigger confirmation
- Color coding: Green for savings, Red for increases, Gray for minimal change
- Special warning for hardware removal operations

### 6. Apply Changes

If the preview looks correct:

1. Review the summary one final time
2. For removals, confirm you want to proceed with deletion
3. Click **"Apply Changes"**
4. System updates all cabinets in a single atomic transaction
5. Success notification shows:
   - Total cabinets updated
   - Final cost impact
   - Percentage change
6. All displays automatically refresh with new costs

## Hardware Categories and Compatibility

The system automatically categorizes hardware and enforces compatibility rules:

### Hardware Categories

1. **Hinges**
   - European hinges
   - Soft-close hinges
   - Concealed hinges
   - Any item with "hinge" in type or description

2. **Slides**
   - Drawer slides
   - Soft-close slides
   - Under-mount slides
   - Any item with "slide" or "drawer" in type or description

3. **Pulls**
   - Cabinet pulls
   - Knobs
   - Any item with "pull" or "knob" in type or description

4. **Handles**
   - Cabinet handles
   - Bar pulls classified as handles
   - Any item with "handle" in type or description

5. **Other Hardware**
   - Generic hardware items
   - Specialty hardware

### Compatibility Rules

- **Same Category Only**: You can ONLY replace hardware with items from the same category
- **Validation Before Preview**: System checks compatibility before generating preview
- **Clear Error Messages**: If incompatible, you'll see: "Cannot replace [type] with [type]. Hardware must be of the same category."

## Quantity Preservation

**Critical Feature**: When replacing hardware, the system ALWAYS preserves the original `quantity_per_cabinet`:

- If a cabinet had 4 hinges, it will still have 4 hinges after replacement
- If a cabinet had 2 slides, it will still have 2 slides after replacement
- Quantities are NEVER changed during bulk operations
- This ensures cabinet configurations remain functionally correct

## Cost Recalculation

The system automatically recalculates:

1. **Hardware Cost per Cabinet**: Based on new hardware price × quantity per cabinet × cabinet quantity
2. **Cabinet Subtotal**: Sum of all component costs (materials + hardware + labor)
3. **Area Subtotal**: Sum of all cabinets in the area
4. **Project Total**: Complete project cost with new hardware

For removals, the removed hardware cost is subtracted from totals.

## Real-World Examples

### Example 1: Upgrade to Soft-Close Slides

**Scenario**: Upgrade all drawer slides from standard to soft-close in entire project

**Traditional Method** (50 cabinets with slides):
1. Open each cabinet individually (50 times)
2. Find hardware section (50 times)
3. Remove standard slide (50 times)
4. Search for soft-close slide (50 times)
5. Add soft-close slide with correct quantity (50 times)
6. Save changes (50 times)
7. **Total time: 50-75 minutes**

**With Hardware Bulk Change**:
1. Click "Change Materials" button
2. Select "Hardware" as type
3. Select "Entire Project" scope
4. Choose "Standard Drawer Slide" as current
5. Choose "Soft-Close Premium Slide" as new
6. Preview → Apply
7. **Total time: 45 seconds**

**Result**: All 50 cabinets updated, quantities preserved, costs recalculated automatically.

---

### Example 2: Client Providing Their Own Pulls

**Scenario**: Client wants to purchase and install their own cabinet pulls

**Traditional Method** (80 cabinets with pulls):
1. Open each cabinet form (80 times)
2. Find hardware section (80 times)
3. Locate the pull item (80 times)
4. Delete the pull (80 times)
5. Save changes (80 times)
6. **Total time: 60-90 minutes**

**With Hardware Bulk Change**:
1. Click "Change Materials" button
2. Select "Hardware" as type
3. Select "Entire Project" scope
4. Choose "Cabinet Pull Satin Nickel" as current
5. Click "Remove Instead" button
6. Preview → Confirm removal → Apply
7. **Total time: 30 seconds**

**Result**: All pulls removed from 80 cabinets, hardware costs reduced by exact pull costs.

---

### Example 3: Replace Hinges in Kitchen Area Only

**Scenario**: Replace hinges in Kitchen area with premium soft-close version

**Steps**:
1. Click refresh icon (⟳) on Kitchen area header
2. Select "Hardware" as type
3. Scope automatically set to "Single Area: Kitchen"
4. Choose "Standard Hinge" as current (shows "32 cabinets")
5. Choose "Soft-Close Hinge Premium" as new
6. Preview shows +$256 cost increase (+18%)
7. Apply changes
8. **Time: 40 seconds**

**Result**: Only Kitchen cabinets updated, other areas unchanged.

## Safety Features

### Validation Checks

1. **Hardware Exists**: Verifies hardware exists in price list
2. **Hardware Active**: Ensures replacement hardware is active (not discontinued)
3. **Category Match**: Validates hardware categories are compatible
4. **Cabinet Count**: Confirms at least one cabinet has the hardware

### Confirmations

1. **Cost Change Warning**: Alerts when cost changes exceed 20%
2. **Removal Confirmation**: Special confirmation for hardware deletion
3. **Preview Required**: Cannot execute without viewing preview first

### Transaction Safety

- **Atomic Operations**: All changes succeed or all fail (no partial updates)
- **Audit Logging**: Every change recorded with full details
- **Rollback Support**: Failed operations don't leave cabinets in bad state

## Technical Details

### Database Functions

The system uses PostgreSQL functions for efficiency:

- `update_hardware_in_cabinet()`: Replaces hardware_id while preserving quantity
- `remove_hardware_from_cabinet()`: Removes specific hardware from JSONB array
- `calculate_hardware_cost()`: Recalculates total hardware cost
- `get_hardware_category()`: Determines hardware category for validation

### Performance

- **GIN Indexes**: Fast searches within JSONB hardware arrays
- **Batch Updates**: All cabinets updated in parallel
- **Optimized Queries**: Uses containment operators for JSONB searches

### Audit Trail

Every hardware change is logged to `material_change_log` table with:

- `operation_type`: 'replace' or 'remove'
- `change_type`: 'hardware'
- `old_material_id`: Hardware being replaced/removed
- `new_material_id`: Replacement hardware (null if removing)
- `affected_cabinets_count`: Number of cabinets changed
- `cost_before`, `cost_after`, `cost_difference`: Financial impact
- `scope` and `scope_details`: Where changes were applied

### Version Compatibility

The hardware bulk change system works with:
- **Regular projects**: Updates `area_cabinets` table
- **Versioned projects**: Updates `version_area_cabinets` table
- **All changes respect the current version context**

## Best Practices

1. **Always Preview First**: Never skip the preview step
   - Verify cabinet count is correct
   - Check cost impact is reasonable
   - Ensure you selected the right hardware

2. **Use Appropriate Scope**:
   - **Entire Project**: For standardization across all areas
   - **Single Area**: For room-specific changes
   - **Selected Areas**: For selective updates (e.g., Kitchen + Dining)

3. **Verify Hardware Categories**:
   - Ensure replacement hardware is truly equivalent
   - Check hardware specifications match requirements
   - Confirm new hardware is compatible with cabinet types

4. **Document Removals**:
   - Add project notes when removing hardware for client-provided items
   - Document which hardware client will provide
   - Update project status to reflect pending client hardware

5. **Check Price List First**:
   - Ensure new hardware is in price list before bulk change
   - Verify prices are current
   - Confirm hardware is marked as active

6. **Test on Small Scope First**:
   - For large projects, test on single area first
   - Verify results before applying project-wide
   - Helps catch any issues early

## Troubleshooting

### "No cabinets found with the selected hardware"

**Cause**: The selected hardware isn't used in any cabinets within your chosen scope

**Solutions**:
- Try expanding scope (area → project)
- Verify correct hardware selected
- Check if hardware was already changed in a previous operation

---

### "Cannot replace [type] with [type]. Hardware must be of the same category."

**Cause**: Attempting to replace hardware with incompatible category

**Solutions**:
- Select replacement hardware from the same category
- Example: Replace hinges with hinges, not slides
- Check hardware categorization in price list if unclear

---

### "New hardware is not active"

**Cause**: Replacement hardware has been deactivated in price list

**Solutions**:
- Reactivate hardware in price list
- Select different active hardware
- Check with admin if hardware should be active

---

### Cost calculations seem incorrect

**Causes & Solutions**:
- **Wrong Price**: Verify hardware price in price list
- **Wrong Quantity**: Check quantity_per_cabinet in cabinet configuration
- **Missing Hardware**: Verify hardware exists in all affected cabinets
- **Inactive Hardware**: Inactive hardware excluded from cost calculations

---

### Hardware not being replaced in some cabinets

**Cause**: Those cabinets may have different hardware or none at all

**Solutions**:
- Check preview to see which cabinets are affected
- Verify all cabinets actually have the hardware
- Review cabinet configurations individually if needed

---

### Changes applied but costs not updated

**Cause**: Possible cache issue or display not refreshed

**Solutions**:
- Refresh the page
- Close and reopen the project
- Verify database directly if issue persists

## Limitations

### What You CAN Do

- Replace hardware with compatible hardware from same category
- Remove hardware entirely from cabinets
- Change hardware across entire projects or specific areas
- Preserve original quantities per cabinet
- Preview cost impact before applying

### What You CANNOT Do

- **Change Quantities**: Quantity per cabinet is always preserved
- **Change Categories**: Cannot replace hinges with slides, etc.
- **Mix Operations**: Cannot replace AND remove in single operation
- **Partial Cabinet Updates**: All hardware instances in a cabinet are updated
- **Undo After Apply**: No undo button (must manually reverse if needed)

## Support

For issues or questions about the hardware bulk change system:

1. Review this guide thoroughly
2. Check the preview before applying changes
3. Review audit log in `material_change_log` table
4. Contact system administrator if problems persist

---

**Last Updated**: November 2025
**Version**: 1.0
**Feature Status**: Production Ready
