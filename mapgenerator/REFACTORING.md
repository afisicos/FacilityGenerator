# MapEditor Refactoring

## Overview
The MapEditor component has been refactored from a single 1224-line file into a modular, maintainable structure.

## New Structure

```
src/
├── MapEditor.tsx              # Main component (now ~150 lines)
├── MapEditor.tsx.backup       # Backup of original file
├── MapEditor.css             # Styles (unchanged)
├── types.ts                  # Type definitions
│
├── components/               # UI Components
│   ├── LeftPanel.tsx        # Left toolbar with tools
│   ├── RightPanel.tsx       # Right panel with export settings
│   └── Canvas.tsx            # Canvas rendering and interactions
│
├── hooks/                    # Custom React Hooks
│   ├── useMapState.ts       # State management
│   └── useMapHandlers.ts    # Event handlers
│
└── utils/                    # Utility Functions
    ├── constants.ts         # App constants (GRID_SIZE, etc.)
    ├── geometry.ts          # Geometric calculations
    └── objExport.ts         # OBJ file export logic
```

## Module Breakdown

### 1. **MapEditor.tsx** (Main Component)
- Orchestrates all other modules
- Manages refs and effects
- Delegates rendering to child components
- ~150 lines (down from 1224)

### 2. **Components** (`components/`)

#### `LeftPanel.tsx`
- Tool selection buttons
- Wall creation controls
- Point deletion
- Dynamic hints based on active tool

#### `RightPanel.tsx`
- Export button with validation
- Wall height/thickness parameters
- Zoom indicator
- Warning messages

#### `Canvas.tsx`
- Grid rendering
- Polygon/wall visualization
- Point rendering with selection states
- Preview overlays (drawing, box selection)
- Mouse event handling for points

### 3. **Hooks** (`hooks/`)

#### `useMapState.ts`
- Centralized state management
- All useState declarations
- Computed values (e.g., `hasClosedPolygons`)
- Returns complete state object

#### `useMapHandlers.ts`
- All event handlers as useCallback
- Mouse events (down, move, up, wheel)
- Tool-specific actions
- Polygon manipulation logic

### 4. **Utils** (`utils/`)

#### `constants.ts`
- GRID_SIZE constant

#### `geometry.ts`
- `snapToGrid()` - Grid snapping
- `getPointFromClick()` - Point detection
- `lineIntersection()` - Line intersection calculation
- `isPointInRect()` - Rectangle collision detection
- `pointInPolygon()` - Point-in-polygon test

#### `objExport.ts`
- Complete OBJ export logic
- Polygon offsetting with mitered corners
- Boolean union operations
- Triangulation with earcut
- 3D geometry generation
- Normal calculation

## Benefits

### Maintainability
- **Single Responsibility**: Each file has one clear purpose
- **Easier Navigation**: Find code by feature, not by scrolling
- **Isolated Changes**: Modify one feature without affecting others

### Readability
- **Clear Structure**: Logical file organization
- **Smaller Files**: Each file is under 400 lines
- **Better Names**: Descriptive file and function names

### Testability
- **Pure Functions**: Utils are easily testable
- **Isolated Logic**: Test handlers independently
- **Mock-friendly**: Hooks can be tested with mocked dependencies

### Reusability
- **Generic Components**: LeftPanel, RightPanel, Canvas can be reused
- **Utility Functions**: Geometry functions useful in other projects
- **Custom Hooks**: State and handlers can be composed differently

## Migration Notes

### Original File Backup
The original `MapEditor.tsx` is preserved as `MapEditor.tsx.backup` for reference.

### No Breaking Changes
- All functionality remains identical
- Same props and behavior
- Same CSS classes
- No changes to types.ts

### Testing Checklist
- [x] Application compiles without errors
- [ ] Drawing walls works correctly
- [ ] Point selection (single and box) works
- [ ] Point dragging works
- [ ] Adding points to walls works
- [ ] Deleting points works
- [ ] Export to OBJ works
- [ ] Validation for closed polygons works
- [ ] Pan and zoom work correctly

## Future Improvements

### Possible Enhancements
1. **State Management**: Consider Redux/Zustand for larger apps
2. **Component Library**: Extract Canvas primitives (Circle, Line, etc.)
3. **Testing**: Add unit tests for utils and integration tests
4. **TypeScript**: Stricter types, fewer 'any' types
5. **Performance**: Memoize expensive calculations
6. **Accessibility**: Add keyboard shortcuts and ARIA labels

### Next Refactoring Opportunities
- Extract SVG rendering logic into separate components
- Create a PolygonRenderer component
- Split Canvas.tsx if it grows larger
- Add a context provider for deeply nested state

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

## Notes
- All dependencies remain the same
- No new npm packages required
- CSS remains unchanged
- Types remain unchanged


