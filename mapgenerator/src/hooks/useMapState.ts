import { useState, useMemo } from 'react';
import type { WallPolygon, Point, Tool } from '../types';

export function useMapState() {
  const [polygons, setPolygons] = useState<WallPolygon[]>([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<{polygonId: string, pointIndex: number}[]>([]);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState<Point | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = useState<Point | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [isAddingToPolygon, setIsAddingToPolygon] = useState(false);
  const [addToStart, setAddToStart] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [wallHeight, setWallHeight] = useState(25);
  const [wallThickness, setWallThickness] = useState(0.5);
  const [visiblePolygons, setVisiblePolygons] = useState<Set<string>>(new Set());
  const [exportTogether, setExportTogether] = useState(true);
  const [floorWithVolume, setFloorWithVolume] = useState(false);

  // Detectar si hay polígonos cerrados (sin aberturas)
  const hasClosedPolygons = useMemo(() => {
    return polygons.some(polygon => {
      const totalPoints = polygon.points.length;
      if (totalPoints < 2) return false;

      const firstPoint = polygon.points[0];
      const lastPoint = polygon.points[totalPoints - 1];
      const isClosed = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;

      return isClosed;
    });
  }, [polygons]);

  // Función para reiniciar completamente el escenario
  const resetScenario = () => {
    setPolygons([]);
    setSelectedPolygonId(null);
    setSelectedPointIndex(null);
    setSelectedPoints([]);
    setIsBoxSelecting(false);
    setBoxSelectStart(null);
    setBoxSelectEnd(null);
    setTool('select');
    setIsDraggingPoint(false);
    setDragStart(null);
    setIsDrawingWall(false);
    setCurrentPolygonPoints([]);
    setPreviewPoint(null);
    setIsAddingToPolygon(false);
    setAddToStart(false);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
    setPanStart(null);
    setVisiblePolygons(new Set());
  };

  return {
    polygons,
    setPolygons,
    selectedPolygonId,
    setSelectedPolygonId,
    selectedPointIndex,
    setSelectedPointIndex,
    selectedPoints,
    setSelectedPoints,
    isBoxSelecting,
    setIsBoxSelecting,
    boxSelectStart,
    setBoxSelectStart,
    boxSelectEnd,
    setBoxSelectEnd,
    tool,
    setTool,
    isDraggingPoint,
    setIsDraggingPoint,
    dragStart,
    setDragStart,
    isDrawingWall,
    setIsDrawingWall,
    currentPolygonPoints,
    setCurrentPolygonPoints,
    previewPoint,
    setPreviewPoint,
    isAddingToPolygon,
    setIsAddingToPolygon,
    addToStart,
    setAddToStart,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
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
    hasClosedPolygons,
    resetScenario,
  };
}

