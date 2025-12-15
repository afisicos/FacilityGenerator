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
    const scenarioName = prompt('Ingresa el nombre del escenario para las paredes:', 'escenario-muros');

    if (!scenarioName || scenarioName.trim() === '') {
      return; // Cancelar si no se ingresa nombre
    }

    // Filter only visible polygons
    const visiblePolygonsList = polygons.filter(p => visiblePolygons.has(p.id));
    exportToOBJ(visiblePolygonsList, wallHeight, wallThickness, exportTogether, scenarioName.trim());
  };

  const handleExportFloor = () => {
    // Pedir nombre del escenario al usuario
    const scenarioName = prompt('Ingresa el nombre del escenario para el piso:', 'escenario-piso');

    if (!scenarioName || scenarioName.trim() === '') {
      return; // Cancelar si no se ingresa nombre
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
    if (window.confirm('¿Estás seguro de que quieres reiniciar todo el escenario? Se perderán todos los cambios no guardados.')) {
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
        onDisconnectPoints={handleDisconnectPoints}
        onAddPointsToWall={handleAddPointsToWall}
        onFinishAddingPoints={handleFinishAddingPoints}
        onSaveScenario={handleSaveScenario}
        onLoadScenario={handleLoadScenario}
        onResetScenario={handleResetScenario}
      />
      
      <RightPanel
        wallHeight={wallHeight}
        wallThickness={wallThickness}
        zoom={zoom}
        polygons={polygons}
        visiblePolygons={visiblePolygons}
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
    </div>
  );
}

