import { useCallback } from 'react';
import type { WallPolygon, Point } from '../types';
import { snapToGrid, getPointFromClick, isPointInRect } from '../utils/geometry';

interface MapState {
  polygons: WallPolygon[];
  setPolygons: React.Dispatch<React.SetStateAction<WallPolygon[]>>;
  tool: string;
  setTool: React.Dispatch<React.SetStateAction<any>>;
  selectedPolygonId: string | null;
  setSelectedPolygonId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPointIndex: number | null;
  setSelectedPointIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedPoints: {polygonId: string, pointIndex: number}[];
  setSelectedPoints: React.Dispatch<React.SetStateAction<{polygonId: string, pointIndex: number}[]>>;
  isDraggingPoint: boolean;
  setIsDraggingPoint: React.Dispatch<React.SetStateAction<boolean>>;
  dragStart: Point | null;
  setDragStart: React.Dispatch<React.SetStateAction<Point | null>>;
  isDrawingWall: boolean;
  setIsDrawingWall: React.Dispatch<React.SetStateAction<boolean>>;
  currentPolygonPoints: Point[];
  setCurrentPolygonPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  previewPoint: Point | null;
  setPreviewPoint: React.Dispatch<React.SetStateAction<Point | null>>;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  panStart: Point | null;
  setPanStart: React.Dispatch<React.SetStateAction<Point | null>>;
  panOffset: Point;
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  isBoxSelecting: boolean;
  setIsBoxSelecting: React.Dispatch<React.SetStateAction<boolean>>;
  boxSelectStart: Point | null;
  setBoxSelectStart: React.Dispatch<React.SetStateAction<Point | null>>;
  boxSelectEnd: Point | null;
  setBoxSelectEnd: React.Dispatch<React.SetStateAction<Point | null>>;
  isAddingToPolygon: boolean;
  setIsAddingToPolygon: React.Dispatch<React.SetStateAction<boolean>>;
  addToStart: boolean;
  setAddToStart: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useMapHandlers(state: MapState, canvasRef: React.RefObject<HTMLDivElement | null>) {
  const {
    polygons,
    setPolygons,
    tool,
    setTool,
    selectedPolygonId,
    setSelectedPolygonId,
    selectedPointIndex,
    setSelectedPointIndex,
    selectedPoints,
    setSelectedPoints,
    isDraggingPoint,
    setIsDraggingPoint,
    dragStart,
    setDragStart,
    isDrawingWall,
    setIsDrawingWall,
    currentPolygonPoints,
    setCurrentPolygonPoints,
    setPreviewPoint,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    panOffset,
    setPanOffset,
    zoom,
    setZoom,
    isBoxSelecting,
    setIsBoxSelecting,
    boxSelectStart,
    setBoxSelectStart,
    boxSelectEnd,
    setBoxSelectEnd,
    isAddingToPolygon,
    setIsAddingToPolygon,
    addToStart,
    setAddToStart,
  } = state;

  const finishPolygon = useCallback(() => {
    if (currentPolygonPoints.length >= 3) {
      const newPolygon: WallPolygon = {
        id: `polygon-${Date.now()}`,
        points: [...currentPolygonPoints]
      };
      setPolygons(prev => [...prev, newPolygon]);
    }
    setCurrentPolygonPoints([]);
    setIsDrawingWall(false);
    setPreviewPoint(null);
    setTool('select');
  }, [currentPolygonPoints, setPolygons, setCurrentPolygonPoints, setIsDrawingWall, setPreviewPoint, setTool]);

  const handleFinishAddingPoints = useCallback(() => {
    setIsAddingToPolygon(false);
    setPreviewPoint(null);
    setAddToStart(false);
  }, [setIsAddingToPolygon, setPreviewPoint, setAddToStart]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    // Handle panning with middle mouse button or Ctrl+Left
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    
    // Click derecho para finalizar polígono o añadir puntos
    if (e.button === 2) {
      if (isDrawingWall) {
        e.preventDefault();
        finishPolygon();
        return;
      } else if (isAddingToPolygon) {
        e.preventDefault();
        handleFinishAddingPoints();
        return;
      }
    }
    
    // Don't handle other buttons except left click
    if (e.button !== 0) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snapToGrid((e.clientX - rect.left - panOffset.x) / zoom);
    const y = snapToGrid((e.clientY - rect.top - panOffset.y) / zoom);
    const point: Point = { x, y };

    if (isAddingToPolygon && selectedPolygonId) {
      // Modo: añadir puntos a un polígono existente
      setPolygons(prev => prev.map(polygon => {
        if (polygon.id !== selectedPolygonId) return polygon;
        
        // Evitar duplicar el mismo punto
        const lastPoint = addToStart ? polygon.points[0] : polygon.points[polygon.points.length - 1];
        if (lastPoint && lastPoint.x === point.x && lastPoint.y === point.y) {
          return polygon;
        }
        
        return {
          ...polygon,
          points: addToStart 
            ? [point, ...polygon.points] 
            : [...polygon.points, point]
        };
      }));
      
      // Actualizar el índice del punto seleccionado si estamos añadiendo al inicio
      if (addToStart && selectedPointIndex !== null) {
        setSelectedPointIndex(selectedPointIndex + 1);
      }
      
      return;
    } else if (tool === 'drawWall') {
      // Si estamos dibujando, añadir punto al polígono actual
      if (isDrawingWall) {
        // Evitar duplicar el mismo punto
        const lastPoint = currentPolygonPoints[currentPolygonPoints.length - 1];
        if (lastPoint && lastPoint.x === point.x && lastPoint.y === point.y) {
          return;
        }
        setCurrentPolygonPoints(prev => [...prev, point]);
      } else {
        // Iniciar nuevo polígono
        setIsDrawingWall(true);
        setCurrentPolygonPoints([point]);
      }
    } else {
      // Select mode
      let clickedPolygon: WallPolygon | null = null;
      let clickedPointIndex: number | null = null;

      // Check if clicking on a point of a polygon
      for (const polygon of polygons) {
        const pointIndex = getPointFromClick(point, polygon);
        if (pointIndex !== null) {
          clickedPolygon = polygon;
          clickedPointIndex = pointIndex;
          break;
        }
      }

      if (clickedPolygon && clickedPointIndex !== null) {
        // Verificar si el punto clickeado ya está en la selección múltiple
        const isPointSelected = selectedPoints.some(
          p => p.polygonId === clickedPolygon!.id && p.pointIndex === clickedPointIndex
        );

        if (isPointSelected) {
          // Si el punto ya está seleccionado, preparar para arrastrar todos los puntos seleccionados
          setIsDraggingPoint(true);
          setDragStart({ x: 0, y: 0 });
        } else {
          // Si el punto no está seleccionado, limpiar selección múltiple y seleccionar solo este
          setSelectedPoints([]);
          setSelectedPolygonId(clickedPolygon.id);
          setSelectedPointIndex(clickedPointIndex);
          setIsDraggingPoint(true);
          setDragStart({ x: 0, y: 0 });
          // Desactivar modo añadir puntos al seleccionar otro punto
          if (isAddingToPolygon) {
            setIsAddingToPolygon(false);
            setPreviewPoint(null);
          }
        }
      } else {
        // Click en área vacía: iniciar selección rectangular
        setIsBoxSelecting(true);
        setBoxSelectStart(point);
        setBoxSelectEnd(point);
        setSelectedPolygonId(null);
        setSelectedPointIndex(null);
        // Desactivar modo añadir puntos al hacer click en área vacía
        if (isAddingToPolygon) {
          setIsAddingToPolygon(false);
          setPreviewPoint(null);
        }
      }
    }
  }, [
    tool,
    polygons,
    selectedPolygonId,
    zoom,
    panOffset,
    isDrawingWall,
    currentPolygonPoints,
    finishPolygon,
    selectedPoints,
    isAddingToPolygon,
    selectedPointIndex,
    addToStart,
    canvasRef,
    setIsPanning,
    setPanStart,
    setPolygons,
    setSelectedPointIndex,
    setCurrentPolygonPoints,
    setIsDrawingWall,
    setIsDraggingPoint,
    setDragStart,
    setSelectedPoints,
    setSelectedPolygonId,
    setIsBoxSelecting,
    setBoxSelectStart,
    setBoxSelectEnd,
    setIsAddingToPolygon,
    setPreviewPoint,
    handleFinishAddingPoints,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    // Handle panning
    if (isPanning && panStart) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snapToGrid((e.clientX - rect.left - panOffset.x) / zoom);
    const y = snapToGrid((e.clientY - rect.top - panOffset.y) / zoom);
    const point: Point = { x, y };

    // Actualizar rectángulo de selección
    if (isBoxSelecting && boxSelectStart) {
      setBoxSelectEnd(point);
      return;
    }

    // Preview del polígono mientras se dibuja o se añaden puntos
    if ((tool === 'drawWall' && isDrawingWall) || isAddingToPolygon) {
      setPreviewPoint(point);
    }

    // Arrastrar puntos
    if (isDraggingPoint && dragStart) {
      if (selectedPoints.length > 0) {
        // Mover todos los puntos seleccionados
        if (!dragStart.x && !dragStart.y) {
          setDragStart(point);
          return;
        }

        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;

        setPolygons(prev => prev.map(polygon => {
          const selectedIndices = selectedPoints
            .filter(sp => sp.polygonId === polygon.id)
            .map(sp => sp.pointIndex);

          if (selectedIndices.length === 0) return polygon;

          return {
            ...polygon,
            points: polygon.points.map((pt, idx) => {
              if (selectedIndices.includes(idx)) {
                return {
                  x: snapToGrid(pt.x + deltaX),
                  y: snapToGrid(pt.y + deltaY)
                };
              }
              return pt;
            })
          };
        }));

        setDragStart(point);
      } else if (selectedPolygonId !== null && selectedPointIndex !== null) {
        // Mover un solo punto
        if (!dragStart.x && !dragStart.y) {
          setDragStart(point);
          return;
        }

        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;

        setPolygons(prev => prev.map(polygon => {
          if (polygon.id !== selectedPolygonId) return polygon;
          return {
            ...polygon,
            points: polygon.points.map((p, idx) =>
              idx === selectedPointIndex
                ? { x: snapToGrid(p.x + deltaX), y: snapToGrid(p.y + deltaY) }
                : p
            )
          };
        }));

        setDragStart(point);
      }
    }
  }, [
    isDraggingPoint,
    isPanning,
    panStart,
    dragStart,
    selectedPolygonId,
    selectedPointIndex,
    polygons,
    tool,
    zoom,
    panOffset,
    isDrawingWall,
    isBoxSelecting,
    boxSelectStart,
    selectedPoints,
    isAddingToPolygon,
    canvasRef,
    setPanOffset,
    setBoxSelectEnd,
    setPreviewPoint,
    setDragStart,
    setPolygons,
  ]);

  const handleMouseUp = useCallback(() => {
    // Finalizar selección rectangular
    if (isBoxSelecting && boxSelectStart && boxSelectEnd) {
      // Calcular el área del rectángulo
      const width = Math.abs(boxSelectEnd.x - boxSelectStart.x);
      const height = Math.abs(boxSelectEnd.y - boxSelectStart.y);

      if (width > 5 || height > 5) {
        // Seleccionar todos los puntos dentro del rectángulo
        const pointsInBox: {polygonId: string, pointIndex: number}[] = [];
        
        polygons.forEach(polygon => {
          polygon.points.forEach((point, index) => {
            if (isPointInRect(point, boxSelectStart, boxSelectEnd)) {
              pointsInBox.push({ polygonId: polygon.id, pointIndex: index });
            }
          });
        });

        setSelectedPoints(pointsInBox);
      } else {
        // Fue un click simple en área vacía: limpiar selecciones
        setSelectedPoints([]);
      }

      setIsBoxSelecting(false);
      setBoxSelectStart(null);
      setBoxSelectEnd(null);
    }

    setIsDraggingPoint(false);
    setIsPanning(false);
    setPanStart(null);
    setDragStart(null);
  }, [
    isBoxSelecting,
    boxSelectStart,
    boxSelectEnd,
    polygons,
    setSelectedPoints,
    setIsBoxSelecting,
    setBoxSelectStart,
    setBoxSelectEnd,
    setIsDraggingPoint,
    setIsPanning,
    setPanStart,
    setDragStart,
  ]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom + delta));
    
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoom, panOffset, canvasRef, setZoom, setPanOffset]);

  const handleDrawWall = useCallback(() => {
    setTool('drawWall');
    setIsDrawingWall(true);
    setCurrentPolygonPoints([]);
  }, [setTool, setIsDrawingWall, setCurrentPolygonPoints]);

  const handleAddPointsToWall = useCallback(() => {
    let polygonId: string | null = null;
    let pointIndex: number | null = null;
    
    if (selectedPolygonId !== null && selectedPointIndex !== null) {
      polygonId = selectedPolygonId;
      pointIndex = selectedPointIndex;
    } else if (selectedPoints.length === 1) {
      polygonId = selectedPoints[0].polygonId;
      pointIndex = selectedPoints[0].pointIndex;
    }
    
    if (polygonId === null || pointIndex === null) return;
    
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;
    
    const isStart = pointIndex === 0;
    const isEnd = pointIndex === polygon.points.length - 1;
    
    if (isStart || isEnd) {
      setSelectedPolygonId(polygonId);
      setSelectedPointIndex(pointIndex);
      setSelectedPoints([]);
      setIsAddingToPolygon(true);
      setAddToStart(isStart);
      setTool('select');
    }
  }, [
    selectedPolygonId,
    selectedPointIndex,
    selectedPoints,
    polygons,
    setSelectedPolygonId,
    setSelectedPointIndex,
    setSelectedPoints,
    setIsAddingToPolygon,
    setAddToStart,
    setTool,
  ]);

  const handleDeletePoints = useCallback(() => {
    if (selectedPoints.length > 0) {
      setPolygons(prev => prev.map(polygon => {
        const pointsToDelete = selectedPoints
          .filter(sp => sp.polygonId === polygon.id)
          .map(sp => sp.pointIndex);
        
        if (pointsToDelete.length === 0) return polygon;
        
        const newPoints = polygon.points.filter((_, idx) => !pointsToDelete.includes(idx));
        
        if (newPoints.length < 2) return null;
        
        return {
          ...polygon,
          points: newPoints
        };
      }).filter(Boolean) as WallPolygon[]);
      
      setSelectedPoints([]);
    } else if (selectedPolygonId !== null && selectedPointIndex !== null) {
      setPolygons(prev => prev.map(polygon => {
        if (polygon.id !== selectedPolygonId) return polygon;
        
        const newPoints = polygon.points.filter((_, idx) => idx !== selectedPointIndex);
        
        if (newPoints.length < 2) return null;
        
        return {
          ...polygon,
          points: newPoints
        };
      }).filter(Boolean) as WallPolygon[]);
      
      setSelectedPolygonId(null);
      setSelectedPointIndex(null);
    }
  }, [
    selectedPoints,
    selectedPolygonId,
    selectedPointIndex,
    setPolygons,
    setSelectedPoints,
    setSelectedPolygonId,
    setSelectedPointIndex,
  ]);

  return {
    finishPolygon,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDrawWall,
    handleAddPointsToWall,
    handleFinishAddingPoints,
    handleDeletePoints,
  };
}

