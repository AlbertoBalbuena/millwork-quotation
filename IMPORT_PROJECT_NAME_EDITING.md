# Import Project Name Editing Feature

## Overview
Enhanced the Import Project workflow to allow users to manually edit the target project name before importing, providing greater flexibility and control over project organization.

## Changes Made

### 1. New State Management
Added `targetProjectName` state variable to track the editable project name throughout the import process.

```typescript
const [targetProjectName, setTargetProjectName] = useState<string>('');
```

### 2. Auto-Population Logic
The target project name is automatically populated when:
- A file is successfully validated after selection/drop
- The user switches between import modes (New Project vs Version)

```typescript
// In handleFileSelect
if (result.isValid) {
  setTargetProjectName(result.newProjectName);
}

// In handleImportModeChange
if (result.isValid) {
  setTargetProjectName(result.newProjectName);
}
```

### 3. UI Enhancement
Replaced the static text preview with an editable Input field in the Import Options section:

**Before:**
```typescript
<p className="text-xs text-slate-500 mt-0.5">
  Creates a new project with name: "{validationResult.newProjectName}"
</p>
```

**After:**
```typescript
<div>
  <label htmlFor="targetProjectName" className="block text-sm font-medium text-slate-700 mb-2">
    Project Name
  </label>
  <Input
    id="targetProjectName"
    value={targetProjectName}
    onChange={(e) => setTargetProjectName(e.target.value)}
    placeholder="Enter project name"
    disabled={isImporting}
    className="w-full"
  />
  <p className="text-xs text-slate-500 mt-1">
    You can customize the project name before importing
  </p>
</div>
```

### 4. Import Button Validation
Updated the Import button to ensure the project name is not empty:

```typescript
<Button
  onClick={handleImport}
  disabled={!validationResult?.isValid || !targetProjectName.trim() || isImporting}
>
```

### 5. Import Execution
Modified `handleImport` to use the user's edited name instead of the auto-generated one:

```typescript
const result = await performProjectImport(
  validationResult.projectData,
  targetProjectName.trim()  // Uses edited name instead of validationResult.newProjectName
);
```

### 6. State Cleanup
Updated cleanup functions to reset the target project name:

```typescript
// In handleClose and handleClearFile
setTargetProjectName('');
```

## User Experience Flow

### Scenario 1: Import as New Project
1. User drops/selects "Smith Kitchen.evita.json"
2. System suggests: "Smith Kitchen (Imported)"
3. User edits to: "Smith Kitchen - Final Version"
4. User clicks "Import Project"
5. Project is created with the custom name

### Scenario 2: Import as Version
1. User drops/selects "Smith Kitchen.evita.json"
2. System suggests: "Smith Kitchen - v2"
3. User edits to: "Smith Kitchen - FINAL REVISION"
4. User clicks "Import Project"
5. Project is created with the custom name

### Scenario 3: Switching Import Modes
1. User drops/selects file
2. "New Project" mode shows: "Project (Imported)"
3. User switches to "Version" mode
4. Name automatically updates to: "Project - v2"
5. User can edit either suggestion

## Benefits

1. **Flexibility:** Users can create meaningful project names that match their workflow
2. **Organization:** Better project organization with custom naming conventions
3. **Efficiency:** No need to rename projects after importing
4. **User Control:** Users maintain control over their project structure
5. **Smart Defaults:** Auto-generated names serve as helpful starting points

## Technical Details

### File Modified
- `src/components/ImportProjectModal.tsx`

### Dependencies Added
- `Input` component import

### Validation Logic
- Empty names are prevented (trim() validation)
- Import button is disabled when name is empty or whitespace-only
- Name is trimmed before being sent to the import function

## Testing Recommendations

1. **Basic Editing:**
   - Import a file and verify the suggested name appears
   - Edit the name and verify it's preserved during import

2. **Mode Switching:**
   - Import a file in "New Project" mode
   - Switch to "Version" mode and verify name updates
   - Edit the name and verify it's preserved

3. **Validation:**
   - Try to import with an empty name (should be disabled)
   - Try to import with only whitespace (should be disabled)
   - Verify trimming removes leading/trailing spaces

4. **State Management:**
   - Clear a file and verify the name field resets
   - Close the modal and reopen to verify clean state
   - Import multiple files in sequence to verify proper cleanup

## Related Features

This enhancement complements:
- Project export system
- Project versioning system
- Project management workflow
- Project organization features
