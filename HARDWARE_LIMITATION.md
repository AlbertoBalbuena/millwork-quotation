# Hardware Bulk Change Limitation

## Status: Not Supported (By Design)

## Overview

The Bulk Material Change feature does not support changing hardware items. This is an intentional design decision due to the complexity of hardware management in the system.

## Why Hardware Is Not Supported

### 1. **Complex Data Structure**

Hardware in cabinets is stored as a JSON array, not a simple material ID:

```json
{
  "hardware": [
    {
      "hardware_id": "abc-123",
      "quantity_per_cabinet": 2
    },
    {
      "hardware_id": "def-456",
      "quantity_per_cabinet": 4
    }
  ]
}
```

Each cabinet can have **multiple hardware items** with different quantities. A simple "find and replace" approach doesn't work.

### 2. **Variable Quantities**

Unlike materials (which apply uniformly to all surfaces), hardware quantities vary:
- Wall cabinets might have 2 hinges
- Base cabinets might have 4 hinges + 2 drawer slides
- Different cabinet types require different hardware configurations

### 3. **Multiple Hardware Items Per Cabinet**

A single cabinet can include:
- Hinges (various quantities)
- Drawer slides (if applicable)
- Handles/knobs (various quantities)
- Soft-close mechanisms
- Other specialized hardware

Changing "one hardware for another" doesn't have a clear meaning when each cabinet has multiple hardware types.

### 4. **Cost Calculation Complexity**

Hardware costs are calculated based on:
```typescript
hardwareCost = Σ (hardware_item.price × hardware_item.quantity_per_cabinet) × cabinet.quantity
```

Bulk changing a single hardware ID would require:
- Identifying which hardware in the array to replace
- Maintaining all other hardware items
- Recalculating costs for each cabinet
- Handling cases where hardware doesn't exist in some cabinets

## Current Supported Bulk Changes

The system supports bulk changes for:

✅ **Box Construction Material** - Single material ID per cabinet
✅ **Box Edgeband** - Single edgeband ID per cabinet
✅ **Doors & Drawer Fronts Material** - Single material ID per cabinet
✅ **Doors Edgeband** - Single edgeband ID per cabinet
✅ **Box Interior Finish** - Single material ID per cabinet
✅ **Doors Interior Finish** - Single material ID per cabinet

All of these are **simple field replacements** - one ID for another.

## Recommended Workflow for Hardware Changes

### Option 1: Manual Per-Cabinet Change (Current)

1. Navigate to the area containing the cabinets
2. Click edit on each cabinet
3. Modify hardware selections
4. Save changes

**Best for:**
- Small number of cabinets (< 10)
- Different hardware changes per cabinet type
- Selective hardware updates

### Option 2: Use Templates (Recommended)

1. Create a cabinet template with desired hardware
2. When adding new cabinets, select the template
3. Hardware configuration applied automatically

**Best for:**
- New projects
- Standardized hardware configurations
- Repeating cabinet configurations

### Option 3: Database Script (Advanced)

For very large projects requiring identical hardware changes across many cabinets, a database script can be written. This requires SQL knowledge and database access.

## Future Enhancement Considerations

If hardware bulk change becomes necessary, it would require:

### Implementation Requirements:

1. **Hardware Selection Interface**
   - Dropdown to select which hardware type (hinges, slides, handles)
   - Filter by hardware category/type
   - Show current hardware configuration per cabinet

2. **Replacement Logic**
   - Identify matching hardware items in the array
   - Replace specific hardware while preserving others
   - Handle quantity differences

3. **Validation**
   - Ensure new hardware is compatible with cabinet types
   - Verify quantity makes sense for cabinet configuration
   - Warn about cost impacts

4. **Preview Complexity**
   - Show which cabinets will be affected
   - Display each cabinet's current vs new hardware
   - Calculate cost changes per hardware item type

### Estimated Development Effort:
- **Time**: 16-24 hours
- **Complexity**: High
- **Testing Required**: Extensive (multiple hardware scenarios)
- **Risk**: Medium (complex data manipulation)

## Workarounds

### Workaround 1: Filter and Edit by Area

If changing hardware in a specific area:
1. Go to the area
2. Edit cabinets one by one
3. Usually areas have similar cabinet types, making this manageable

### Workaround 2: Use Cabinet Filters

Once implemented, cabinet filtering could help:
1. Filter cabinets by type (e.g., "all base cabinets")
2. Edit filtered results
3. Apply hardware changes to filtered subset

### Workaround 3: Export/Import with CSV

For extreme cases:
1. Export project to CSV
2. Modify hardware IDs in spreadsheet
3. Re-import (would require import feature)

## Technical Details

### Database Schema
```sql
CREATE TABLE area_cabinets (
  ...
  hardware JSONB,  -- Array of {hardware_id, quantity_per_cabinet}
  hardware_cost NUMERIC,
  ...
);
```

### Hardware Calculation Function
```typescript
function calculateHardwareCost(
  hardware: HardwareItem[],
  quantity: number,
  priceList: PriceListItem[]
): number {
  return hardware.reduce((total, hw) => {
    const item = priceList.find(p => p.id === hw.hardware_id);
    if (!item) return total;
    return total + (item.price * hw.quantity_per_cabinet * quantity);
  }, 0);
}
```

## User Communication

When users ask about bulk hardware changes:

1. **Acknowledge the limitation**
   - "Hardware bulk changes are not currently supported"

2. **Explain why**
   - "Unlike materials, hardware is a complex array structure"
   - "Each cabinet can have multiple different hardware items"

3. **Provide alternatives**
   - Manual editing (for small changes)
   - Templates (for new cabinets)
   - Consider if it's worth the development effort

4. **Ask for details**
   - How many cabinets need changes?
   - Is it the same hardware change across all?
   - What hardware types (hinges, slides, etc.)?

## Conclusion

Hardware bulk change is not supported because:
1. Technical complexity is significantly higher than material changes
2. Use cases are less common (materials change more often)
3. Existing workflows (manual edit, templates) are sufficient for most scenarios
4. Development time would be substantial for a rarely-used feature

This is a conscious design decision prioritizing core functionality over edge cases. The feature can be added in the future if demand justifies the development effort.

---

**Status**: Not Supported (By Design)
**Priority**: Low
**Effort**: High
**Alternative Solutions**: Available and Sufficient
