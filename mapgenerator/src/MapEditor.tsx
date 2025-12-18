import { useRef, useEffect } from 'react';

// Función para generar un color aleatorio en formato hex
const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#EE5A24', '#009432', '#0652DD', '#9980FA',
    '#FDA7DF', '#E17055', '#81ECEC', '#74B9FF', '#A29BFE'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
import './MapEditor.css';
import { useMapState } from './hooks/useMapState';
import { useMapHandlers } from './hooks/useMapHandlers';
import { exportToOBJ, exportFloorToOBJ } from './utils/objExport';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { Canvas } from './components/Canvas';

export default function MapEditor() {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // State management
  const state = useMapState();
  const {
    polygons,
    setPolygons,
    selectedPolygonId,
    selectedPointIndex,
    selectedPoints,
    tool,
    setTool,
    setIsDraggingPoint,
    setDragStart,
    isDrawingWall,
    currentPolygonPoints,
    previewPoint,
    isAddingToPolygon,
    addToStart,
    isBoxSelecting,
    boxSelectStart,
    boxSelectEnd,
    zoom,
    panOffset,
    wallHeight,
    setWallHeight,
    wallThickness,
    setWallThickness,
    visiblePolygons,
    setVisiblePolygons,
    exportTogether,
    setExportTogether,
    floorWithVolume,
    setFloorWithVolume,
    lockedPolygons,
    togglePolygonLock,
    setSelectedPolygonId,
    setSelectedPointIndex,
    setSelectedPoints,
    resetScenario,
  } = state;

  // Event handlers
  const {
    finishPolygon,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDrawWall,
    handleAddPointsToWall,
    handleFinishAddingPoints,
    handleDeletePoints,
    handleDisconnectPoints,
    handleSaveScenario,
    handleLoadScenario,
  } = useMapHandlers(state, canvasRef);

  // Handle point mouse down
  const handlePointMouseDown = (
    polygonId: string,
    pointIndex: number,
    e: React.MouseEvent<SVGCircleElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // No permitir selección de puntos de polilíneas bloqueadas
    if (lockedPolygons.has(polygonId)) {
      return;
    }

    const isPointSelected = selectedPoints.some(
      sp => sp.polygonId === polygonId && sp.pointIndex === pointIndex
    );

    if (isPointSelected) {
      setIsDraggingPoint(true);
      setDragStart({ x: 0, y: 0 });
    } else {
      setSelectedPoints([]);
      setSelectedPolygonId(polygonId);
      setSelectedPointIndex(pointIndex);
      setIsDraggingPoint(true);
      setDragStart({ x: 0, y: 0 });
    }
  };

  // Handle point double click - select entire polyline
  const handlePointDoubleClick = (polygonId: string) => {
    // No permitir selección de polilíneas bloqueadas
    if (lockedPolygons.has(polygonId)) {
      return;
    }

    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    // Select all points of this polygon
    const allPoints = polygon.points.map((_, idx) => ({
      polygonId: polygonId,
      pointIndex: idx
    }));

    setSelectedPoints(allPoints);
    setSelectedPolygonId(null);
    setSelectedPointIndex(null);
  };

  // Export handlers
  const handleExportWalls = () => {
    // Pedir nombre del escenario al usuario
    const scenarioName = prompt('Enter scenario name for walls:', 'walls-scene');

    if (!scenarioName || scenarioName.trim() === '') {
      return; // Cancel if no name is entered
    }

    // Filter only visible polygons
    const visiblePolygonsList = polygons.filter(p => visiblePolygons.has(p.id));
    exportToOBJ(visiblePolygonsList, wallHeight, wallThickness, exportTogether, scenarioName.trim());
  };

  const handleExportFloor = () => {
    // Pedir nombre del escenario al usuario
    const scenarioName = prompt('Enter scenario name for floor:', 'floor-scene');

    if (!scenarioName || scenarioName.trim() === '') {
      return; // Cancel if no name is entered
    }

    // Filter only visible polygons
    const visiblePolygonsList = polygons.filter(p => visiblePolygons.has(p.id));
    exportFloorToOBJ(visiblePolygonsList, exportTogether, floorWithVolume, scenarioName.trim());
  };

  // Rename polygon handler
  const handleRenamePolygon = (id: string, name: string) => {
    setPolygons(prev => prev.map(polygon =>
      polygon.id === id ? { ...polygon, name } : polygon
    ));
  };

  // Change polygon color handler
  const handleChangePolygonColor = (id: string, color: string) => {
    setPolygons(prev => prev.map(polygon =>
      polygon.id === id ? { ...polygon, fillColor: color } : polygon
    ));
  };

  // Reset scenario handler
  const handleResetScenario = () => {
    if (window.confirm('Are you sure you want to reset the entire scene? All unsaved changes will be lost.')) {
      resetScenario();
    }
  };

  // Auto-add new polygons to visible set (only on polygon count change)
  useEffect(() => {
    const currentIds = new Set(polygons.map(p => p.id));
    const newVisible = new Set(visiblePolygons);
    let changed = false;

    // Add new polygons
    polygons.forEach(polygon => {
      if (!newVisible.has(polygon.id)) {
        newVisible.add(polygon.id);
        changed = true;
      }
    });

    // Remove deleted polygons
    Array.from(newVisible).forEach(id => {
      if (!currentIds.has(id)) {
        newVisible.delete(id);
        changed = true;
      }
    });

    if (changed) {
      setVisiblePolygons(newVisible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygons.length]); // Only run when polygon count changes

  // Assign random colors to polygons without colors
  useEffect(() => {
    const needsColorUpdate = polygons.some(p => !p.fillColor);
    if (needsColorUpdate) {
      setPolygons(prev => prev.map(polygon =>
        polygon.fillColor ? polygon : { ...polygon, fillColor: getRandomColor() }
      ));
    }
  }, [polygons, setPolygons]);

  // Calculate total wall distance for selected polygon
  const getSelectedPolygonInfo = () => {
    let polygonId: string | null = null;

    // If there's an individual point selected
    if (selectedPolygonId) {
      polygonId = selectedPolygonId;
    }
    // If there are multiple points selected, check if all are from the same polygon
    else if (selectedPoints.length > 0) {
      const firstPolygonId = selectedPoints[0].polygonId;
      const allSamePolygon = selectedPoints.every(p => p.polygonId === firstPolygonId);
      if (allSamePolygon) {
        polygonId = firstPolygonId;
      }
    }

    if (!polygonId) return null;

    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return null;

    // Calculate total wall distance
    let totalDistance = 0;
    for (let i = 0; i < polygon.points.length - 1; i++) {
      const p1 = polygon.points[i];
      const p2 = polygon.points[i + 1];
      const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      totalDistance += distance;
    }

    // Add closing segment for closed polygons
    if (polygon.isClosed && polygon.points.length >= 3) {
      const firstPoint = polygon.points[0];
      const lastPoint = polygon.points[polygon.points.length - 1];
      const closingDistance = Math.sqrt(Math.pow(firstPoint.x - lastPoint.x, 2) + Math.pow(firstPoint.y - lastPoint.y, 2));
      totalDistance += closingDistance;
    }

    const polygonIndex = polygons.findIndex(p => p.id === polygonId) + 1;
    const displayName = polygon.name || `${polygon.isClosed ? 'Room' : 'Line'} ${polygonIndex}`;

    return {
      polygon,
      displayName,
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      selectedPointsCount: selectedPoints.length
    };
  };

  const selectedPolygonInfo = getSelectedPolygonInfo();

  // Prevent page scroll when mouse is over canvas
  useEffect(() => {
    const handleWheelGlobal = (e: WheelEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheelGlobal, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheelGlobal, { capture: true });
    };
  }, []);

  // Handler para el input file de carga
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadScenario(file);
    }
    // Reset el input para permitir cargar el mismo archivo otra vez
    e.target.value = '';
  };

  return (
    <div className="map-editor">
      {/* Top Bar with Title and Scenario Buttons */}
      <div className="top-bar">
        <div className="scenario-buttons-top">
          <button
            className="scenario-icon-button"
            onClick={handleSaveScenario}
            title="Save current scenario to JSON file"
          >
            💾
          </button>
          <label
            className="scenario-icon-button"
            title="Load scenario from JSON file"
          >
            📁
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="scenario-icon-button delete-button"
            onClick={handleResetScenario}
            title="Reset entire scenario (delete all walls and reset state)"
          >
            🔄
          </button>
        </div>
        <h1 className="app-title">3D Facility Generator</h1>
        <div className="top-bar-spacer"></div>
      </div>

      <LeftPanel
        tool={tool}
        isDrawingWall={isDrawingWall}
        isAddingToPolygon={isAddingToPolygon}
        selectedPoints={selectedPoints}
        selectedPolygonId={selectedPolygonId}
        selectedPointIndex={selectedPointIndex}
        polygons={polygons}
        onSetTool={setTool}
        onDrawWall={handleDrawWall}
        onFinishPolygon={finishPolygon}
        onDeletePoints={handleDeletePoints}
        onDisconnectPoints={handleDisconnectPoints}
        onAddPointsToWall={handleAddPointsToWall}
        onFinishAddingPoints={handleFinishAddingPoints}
      />
      
      <RightPanel
        wallHeight={wallHeight}
        wallThickness={wallThickness}
        polygons={polygons}
        visiblePolygons={visiblePolygons}
        lockedPolygons={lockedPolygons}
        exportTogether={exportTogether}
        floorWithVolume={floorWithVolume}
        onExportWalls={handleExportWalls}
        onExportFloor={handleExportFloor}
        onWallHeightChange={setWallHeight}
        onWallThicknessChange={setWallThickness}
        onTogglePolygonVisibility={(id) => {
          const newVisible = new Set(visiblePolygons);
          if (newVisible.has(id)) {
            newVisible.delete(id);
          } else {
            newVisible.add(id);
          }
          setVisiblePolygons(newVisible);
        }}
        onTogglePolygonLock={togglePolygonLock}
        onToggleExportTogether={() => setExportTogether(!exportTogether)}
        onToggleFloorVolume={() => setFloorWithVolume(!floorWithVolume)}
        onRenamePolygon={handleRenamePolygon}
        onChangePolygonColor={handleChangePolygonColor}
      />
      
      <Canvas
        canvasRef={canvasRef}
        polygons={polygons}
        visiblePolygons={visiblePolygons}
        selectedPolygonId={selectedPolygonId}
        selectedPointIndex={selectedPointIndex}
        selectedPoints={selectedPoints}
        isDrawingWall={isDrawingWall}
        currentPolygonPoints={currentPolygonPoints}
        previewPoint={previewPoint}
        isAddingToPolygon={isAddingToPolygon}
        addToStart={addToStart}
        isBoxSelecting={isBoxSelecting}
        boxSelectStart={boxSelectStart}
        boxSelectEnd={boxSelectEnd}
        zoom={zoom}
        panOffset={panOffset}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onPointMouseDown={handlePointMouseDown}
        onPointDoubleClick={handlePointDoubleClick}
      />

      {/* Selected Polygon Info Panel */}
      {selectedPolygonInfo && (
        <div className="selected-polygon-panel">
          <div className="selected-polygon-header">
            <span className="selected-polygon-label">Selected Room</span>
            <span className="selected-polygon-name">{selectedPolygonInfo.displayName}</span>
          </div>
          <div className="selected-polygon-details">
            <div className="detail-item">
              <span className="detail-label">Points:</span>
              <span className="detail-value">{selectedPolygonInfo.polygon.points.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Wall Length:</span>
              <span className="detail-value">{selectedPolygonInfo.totalDistance} units</span>
            </div>
            {selectedPolygonInfo.selectedPointsCount > 0 && selectedPolygonInfo.selectedPointsCount < selectedPolygonInfo.polygon.points.length && (
              <div className="detail-item">
                <span className="detail-label">Selected Points:</span>
                <span className="detail-value">{selectedPolygonInfo.selectedPointsCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawing hints */}
      {tool === 'drawWall' && (
        <div className="drawing-hints-container">
          <div className="drawing-hint-left">
            Left click to add points
          </div>
          <div className="drawing-hint-right">
            {isDrawingWall && currentPolygonPoints.length >= 3 ? "Click first point to close" : "Right click to finish"}
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div
        className="zoom-indicator-fixed"
      >
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

