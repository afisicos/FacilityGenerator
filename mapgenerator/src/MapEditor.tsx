import { useRef, useEffect } from 'react';
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
    hasClosedPolygons,
    setSelectedPolygonId,
    setSelectedPointIndex,
    setSelectedPoints,
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
  } = useMapHandlers(state, canvasRef);

  // Handle point mouse down
  const handlePointMouseDown = (
    polygonId: string,
    pointIndex: number,
    e: React.MouseEvent<SVGCircleElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
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

  // Export handlers
  const handleExportWalls = () => {
    exportToOBJ(polygons, wallHeight, wallThickness);
  };

  const handleExportFloor = () => {
    exportFloorToOBJ(polygons);
  };

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

  return (
    <div className="map-editor">
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
        onAddPointsToWall={handleAddPointsToWall}
        onFinishAddingPoints={handleFinishAddingPoints}
      />
      
      <RightPanel
        wallHeight={wallHeight}
        wallThickness={wallThickness}
        zoom={zoom}
        hasClosedPolygons={hasClosedPolygons}
        onExportWalls={handleExportWalls}
        onExportFloor={handleExportFloor}
        onWallHeightChange={setWallHeight}
        onWallThicknessChange={setWallThickness}
      />
      
      <Canvas
        canvasRef={canvasRef}
        polygons={polygons}
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
      />
    </div>
  );
}

