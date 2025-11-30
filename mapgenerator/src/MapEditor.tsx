import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { WallPolygon, Door, Point, Tool } from './types';
import './MapEditor.css';
import polygonClipping from 'polygon-clipping';
import earcut from 'earcut';

const GRID_SIZE = 20;

export default function MapEditor() {
  const [polygons, setPolygons] = useState<WallPolygon[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [wallHeight, setWallHeight] = useState(25); // Altura de los muros
  const [wallThickness, setWallThickness] = useState(0.5); // Grosor de los muros
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Detectar si hay polígonos cerrados sin aberturas (invalida la exportación)
  const hasClosedPolygonsWithoutOpenings = useMemo(() => {
    return polygons.some(polygon => {
      const totalPoints = polygon.points.length;
      if (totalPoints < 2) return false;

      const firstPoint = polygon.points[0];
      const lastPoint = polygon.points[totalPoints - 1];
      const isClosed = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;

      if (isClosed) {
        // Verificar si tiene al menos un corte/puerta
        const hasDoors = doors.some(d => d.polygonId === polygon.id);
        return !hasDoors; // Retorna true si está cerrado y NO tiene puertas
      }

      return false;
    });
  }, [polygons, doors]);

  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Encuentra el punto más cercano a un click dentro de un umbral
  const getPointFromClick = useCallback((point: Point, polygon: WallPolygon, threshold: number = 15): number | null => {
    for (let i = 0; i < polygon.points.length; i++) {
      const p = polygon.points[i];
      const dist = Math.sqrt(
        Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2)
      );
      if (dist < threshold) {
        return i;
      }
    }
    return null;
  }, []);

  // Finaliza el polígono actual y lo añade a la lista
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
  }, [currentPolygonPoints]);

  // TODO: Implementar detección de segmentos en polígonos
  /* const getWallFromPoint = useCallback((room: Room, point: Point): { wall: 'top' | 'right' | 'bottom' | 'left', position: number } | null => {
    const threshold = 10;
    const { x, y, width, height } = room;
    
    // Check top wall
    if (Math.abs(point.y - y) < threshold && point.x >= x && point.x <= x + width) {
      return { wall: 'top', position: (point.x - x) / width };
    }
    // Check right wall
    if (Math.abs(point.x - (x + width)) < threshold && point.y >= y && point.y <= y + height) {
      return { wall: 'right', position: (point.y - y) / height };
    }
    // Check bottom wall
    if (Math.abs(point.y - (y + height)) < threshold && point.x >= x && point.x <= x + width) {
      return { wall: 'bottom', position: (point.x - x) / width };
    }
    // Check left wall
    if (Math.abs(point.x - x) < threshold && point.y >= y && point.y <= y + height) {
      return { wall: 'left', position: (point.y - y) / height };
    }
    
    return null;
  }, []); */

  // TODO: Implementar detección de polígonos adyacentes
  /* const findAdjacentRoom = useCallback((room: Room, wall: 'top' | 'right' | 'bottom' | 'left', position: number): Room | null => {
    const threshold = 5; // Tolerance for adjacency
    
    for (const otherRoom of rooms) {
      if (otherRoom.id === room.id) continue;
      
      let isAdjacent = false;
      
      switch (wall) {
        case 'top':
          // Check if other room is below and shares the wall segment
          if (Math.abs(otherRoom.y - (room.y + room.height)) < threshold) {
            const doorX = room.x + position * room.width;
            if (doorX >= otherRoom.x && doorX <= otherRoom.x + otherRoom.width) {
              isAdjacent = true;
            }
          }
          break;
        case 'right':
          // Check if other room is to the right
          if (Math.abs(otherRoom.x - (room.x + room.width)) < threshold) {
            const doorY = room.y + position * room.height;
            if (doorY >= otherRoom.y && doorY <= otherRoom.y + otherRoom.height) {
              isAdjacent = true;
            }
          }
          break;
        case 'bottom':
          // Check if other room is below
          if (Math.abs(room.y - (otherRoom.y + otherRoom.height)) < threshold) {
            const doorX = room.x + position * room.width;
            if (doorX >= otherRoom.x && doorX <= otherRoom.x + otherRoom.width) {
              isAdjacent = true;
            }
          }
          break;
        case 'left':
          // Check if other room is to the left
          if (Math.abs(room.x - (otherRoom.x + otherRoom.width)) < threshold) {
            const doorY = room.y + position * room.height;
            if (doorY >= otherRoom.y && doorY <= otherRoom.y + otherRoom.height) {
              isAdjacent = true;
            }
          }
          break;
      }
      
      if (isAdjacent) {
        return otherRoom;
      }
    }
    
    return null;
  }, [rooms]); */

  // TODO: Implementar detección de cortes en polígonos
  /* const getDoorFromPoint = useCallback((point: Point): Door | null => {
    const cutSize = GRID_SIZE; // Tamaño del corte: una celda de rejilla
    const threshold = cutSize / 2 + 8;

    for (const door of doors) {
      const room = rooms.find(r => r.id === door.roomId);
      if (!room) continue;

      let doorX: number;
      let doorY: number;
      let doorW: number;
      let doorH: number;

      switch (door.wall) {
        case 'top':
          doorX = room.x + door.position * room.width - cutSize / 2;
          doorY = room.y;
          doorW = cutSize;
          doorH = cutSize;
          break;
        case 'right':
          doorX = room.x + room.width - cutSize;
          doorY = room.y + door.position * room.height - cutSize / 2;
          doorW = cutSize;
          doorH = cutSize;
          break;
        case 'bottom':
          doorX = room.x + door.position * room.width - cutSize / 2;
          doorY = room.y + room.height - cutSize;
          doorW = cutSize;
          doorH = cutSize;
          break;
        case 'left':
          doorX = room.x;
          doorY = room.y + door.position * room.height - cutSize / 2;
          doorW = cutSize;
          doorH = cutSize;
          break;
        default:
          continue;
      }

      if (
        point.x >= doorX - threshold &&
        point.x <= doorX + doorW + threshold &&
        point.y >= doorY - threshold &&
        point.y <= doorY + doorH + threshold
      ) {
        return door;
      }
    }
    return null;
  }, [doors, rooms]); */

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    // Handle panning with middle mouse button or Ctrl+Left
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    
    // Click derecho para finalizar polígono
    if (e.button === 2 && isDrawingWall) {
      e.preventDefault();
      finishPolygon();
      return;
    }
    
    // Don't handle other buttons except left click
    if (e.button !== 0) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snapToGrid((e.clientX - rect.left - panOffset.x) / zoom);
    const y = snapToGrid((e.clientY - rect.top - panOffset.y) / zoom);
    const point: Point = { x, y };

    if (tool === 'drawWall') {
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

      // First check if clicking on a door/cut
      // TODO: Implementar detección de clicks en cortes

      // Solo procesar clicks en puntos si no estamos ya arrastrando
      // (el arrastre se maneja desde el onMouseDown de los círculos SVG)
      if (!isDraggingPoint) {
        // Check if clicking on a point of a polygon
        const polygonsToCheck = selectedPolygonId 
          ? [polygons.find(p => p.id === selectedPolygonId), ...polygons.filter(p => p.id !== selectedPolygonId)].filter(Boolean) as WallPolygon[]
          : polygons;

        for (const polygon of polygonsToCheck) {
          const pointIndex = getPointFromClick(point, polygon);
          if (pointIndex !== null) {
            clickedPolygon = polygon;
            clickedPointIndex = pointIndex;
            break;
          }
        }

        if (clickedPolygon && clickedPointIndex !== null) {
          setSelectedPolygonId(clickedPolygon.id);
          setSelectedPointIndex(clickedPointIndex);
          setSelectedDoorId(null);
        } else {
          setSelectedPolygonId(null);
          setSelectedPointIndex(null);
          setSelectedDoorId(null);
        }
      }
    }
  }, [tool, polygons, snapToGrid, getPointFromClick, selectedPolygonId, zoom, panOffset, isDrawingWall, currentPolygonPoints, finishPolygon, isDraggingPoint]);

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

    // Preview del polígono mientras se dibuja
    if (tool === 'drawWall' && isDrawingWall) {
      setPreviewPoint(point);
    }

    // Arrastrar punto de polígono
    if (isDraggingPoint && selectedPolygonId !== null && selectedPointIndex !== null && dragStart) {
      const polygon = polygons.find(p => p.id === selectedPolygonId);
      if (!polygon) return;

      // Calcular la nueva posición del punto basada en el offset guardado
      const newPoint: Point = {
        x: snapToGrid(point.x - dragStart.x),
        y: snapToGrid(point.y - dragStart.y)
      };

      setPolygons(prev => prev.map(p => 
        p.id === selectedPolygonId
          ? {
              ...p,
              points: p.points.map((pt, idx) => idx === selectedPointIndex ? newPoint : pt)
            }
          : p
      ));
    }
  }, [isDraggingPoint, isPanning, panStart, dragStart, selectedPolygonId, selectedPointIndex, polygons, snapToGrid, tool, zoom, panOffset, isDrawingWall]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPoint(false);
    setIsPanning(false);
    setPanStart(null);
    setDragStart(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom factor
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom + delta));
    
    // Calculate zoom point in world coordinates
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    // Adjust pan offset to keep the point under cursor fixed
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoom, panOffset]);

  const handleDeleteDoor = useCallback(() => {
    if (selectedDoorId) {
      setDoors(prev => prev.filter(d => d.id !== selectedDoorId));
      setSelectedDoorId(null);
    }
  }, [selectedDoorId]);

  const handleDrawWall = useCallback(() => {
    setTool('drawWall');
    setIsDrawingWall(true);
    setCurrentPolygonPoints([]);
  }, []);

  const handleDeletePolygon = useCallback(() => {
    if (selectedPolygonId) {
      setPolygons(prev => prev.filter(p => p.id !== selectedPolygonId));
      setDoors(prev => prev.filter(d => d.polygonId !== selectedPolygonId));
      setSelectedPolygonId(null);
      setSelectedPointIndex(null);
    }
  }, [selectedPolygonId]);

  const exportToOBJ = useCallback(() => {
    const thickness = wallThickness * GRID_SIZE;
    const height = wallHeight;

    // Calcular el centro geométrico de todos los polígonos
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    polygons.forEach(polygon => {
      polygon.points.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Paso 1: Crear polígonos offseteados (con grosor) calculando intersecciones correctas en esquinas
    const rectangles: polygonClipping.Polygon[] = [];

    polygons.forEach(polygon => {
      const totalPoints = polygon.points.length;
      if (totalPoints < 2) return;

      // Verificar si el polígono está cerrado
      const firstPoint = polygon.points[0];
      const lastPoint = polygon.points[totalPoints - 1];
      const isClosed = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;
      
      const segmentCount = isClosed ? totalPoints : totalPoints - 1;

      // Calcular polígonos offseteados con intersecciones correctas en esquinas
      const outerPoints: number[][] = [];
      const innerPoints: number[][] = [];
      
      for (let i = 0; i < segmentCount; i++) {
        const prevIdx = i === 0 ? (isClosed ? totalPoints - 2 : -1) : i - 1;
        const currIdx = i;
        const nextIdx = (i + 1) % totalPoints;
        
        const curr = polygon.points[currIdx];
        const next = polygon.points[nextIdx];
        
        // Vector del segmento actual
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        
        const perpX = -(dy / len) * (thickness / 2);
        const perpY = (dx / len) * (thickness / 2);
        
        if (prevIdx < 0) {
          // Primer punto de polígono abierto: solo agregar offset perpendicular
          outerPoints.push([curr.x + perpX, curr.y + perpY]);
          innerPoints.push([curr.x - perpX, curr.y - perpY]);
        } else {
          // Calcular intersección con el segmento anterior
          const prev = polygon.points[prevIdx];
          const dx2 = curr.x - prev.x;
          const dy2 = curr.y - prev.y;
          const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (len2 > 0) {
            const perpX2 = -(dy2 / len2) * (thickness / 2);
            const perpY2 = (dx2 / len2) * (thickness / 2);
            
            // Calcular punto de intersección de las líneas offseteadas
            const outer1 = { x: prev.x + perpX2, y: prev.y + perpY2 };
            const outer2 = { x: curr.x + perpX2, y: curr.y + perpY2 };
            const outer3 = { x: curr.x + perpX, y: curr.y + perpY };
            const outer4 = { x: next.x + perpX, y: next.y + perpY };
            
            const inner1 = { x: prev.x - perpX2, y: prev.y - perpY2 };
            const inner2 = { x: curr.x - perpX2, y: curr.y - perpY2 };
            const inner3 = { x: curr.x - perpX, y: curr.y - perpY };
            const inner4 = { x: next.x - perpX, y: next.y - perpY };
            
            // Intersección de líneas outer2-outer1 con outer3-outer4
            const outerIntersect = lineIntersection(outer1, outer2, outer3, outer4);
            const innerIntersect = lineIntersection(inner1, inner2, inner3, inner4);
            
            if (outerIntersect) {
              outerPoints.push([outerIntersect.x, outerIntersect.y]);
            } else {
              outerPoints.push([curr.x + perpX, curr.y + perpY]);
            }
            
            if (innerIntersect) {
              innerPoints.push([innerIntersect.x, innerIntersect.y]);
            } else {
              innerPoints.push([curr.x - perpX, curr.y - perpY]);
            }
          }
        }
        
        // Último punto del segmento (si es el último segmento de un polígono abierto)
        if (!isClosed && i === segmentCount - 1) {
          outerPoints.push([next.x + perpX, next.y + perpY]);
          innerPoints.push([next.x - perpX, next.y - perpY]);
        }
      }
      
      // Crear polígono combinando outer e inner (en orden inverso)
      if (outerPoints.length > 0 && innerPoints.length > 0) {
        const combinedPolygon: [number, number][] = outerPoints.map(p => [p[0], p[1]] as [number, number]);
        for (let i = innerPoints.length - 1; i >= 0; i--) {
          combinedPolygon.push([innerPoints[i][0], innerPoints[i][1]] as [number, number]);
        }
        combinedPolygon.push([outerPoints[0][0], outerPoints[0][1]] as [number, number]); // Cerrar
        
        rectangles.push([combinedPolygon]);
      }
    });
    
    // Función auxiliar para calcular intersección de dos líneas
    function lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
      const x1 = p1.x, y1 = p1.y;
      const x2 = p2.x, y2 = p2.y;
      const x3 = p3.x, y3 = p3.y;
      const x4 = p4.x, y4 = p4.y;
      
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 0.0001) return null; // Paralelas
      
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }

    // Paso 2: Unión booleana de todos los rectángulos
    if (rectangles.length === 0) {
      alert('No hay muros para exportar');
      return;
    }

    // Hacer unión acumulativa de todos los rectángulos
    // polygonClipping.union acepta Polygon o MultiPolygon y retorna MultiPolygon
    // Convertir el primer Polygon a MultiPolygon envolviéndolo en un array
    let unionResult: polygonClipping.MultiPolygon = rectangles.slice(0, 1);
    for (let i = 1; i < rectangles.length; i++) {
      unionResult = polygonClipping.union(unionResult, rectangles[i]);
    }

    // Paso 3: unionResult ya tiene puntos optimizados (polygon-clipping elimina puntos internos)
    // Paso 4 y 5: Extruir y generar geometría 3D con normales correctas

    const vertices: number[] = [];
    const faces: number[] = [];
    let vertexOffset = 0;

    const addVertex = (x: number, y: number, z: number): number => {
      // Centrar la malla restando el centro geométrico
      vertices.push(x - centerX, y, z - centerY);
      return vertexOffset++;
    };

    const addFace = (a: number, b: number, c: number) => {
      faces.push(a + 1, b + 1, c + 1);
    };

    const addQuad = (v1: number, v2: number, v3: number, v4: number, reverse = false) => {
      if (reverse) {
        addFace(v1, v3, v2);
        addFace(v1, v4, v3);
      } else {
        addFace(v1, v2, v3);
        addFace(v1, v3, v4);
      }
    };

    // Algoritmo point-in-polygon usando ray casting
    const isPointInPolygon = (px: number, py: number, ring: number[][]): boolean => {
      let inside = false;
      for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        
        const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // unionResult es un MultiPolygon (array de Polygon)
    // Cada Polygon es un array de Ring
    // Cada Ring es un array de [x, y]
    unionResult.forEach(polygon => {
      // polygon[0] es el contorno exterior, polygon[1]... son huecos internos
      const exteriorRing = polygon[0];
      const holes = polygon.slice(1);

      // SUELO: Triangular el polígono usando earcut (soporta polígonos cóncavos y huecos)
      // Preparar datos para earcut: array plano de coordenadas y índices de huecos
      const flatCoords: number[] = [];
      const holeIndices: number[] = [];
      
      // Agregar contorno exterior
      for (let i = 0; i < exteriorRing.length - 1; i++) { // -1 porque está cerrado
        flatCoords.push(exteriorRing[i][0], exteriorRing[i][1]);
      }
      
      // Agregar huecos
      for (const hole of holes) {
        holeIndices.push(flatCoords.length / 2); // Índice donde empieza este hueco
        for (let i = 0; i < hole.length - 1; i++) { // -1 porque está cerrado
          flatCoords.push(hole[i][0], hole[i][1]);
        }
      }
      
      // Triangular con earcut
      const triangleIndices = earcut(flatCoords, holeIndices, 2);
      
      // Crear vértices 3D para el suelo
      const floorVertices: number[] = [];
      for (let i = 0; i < flatCoords.length; i += 2) {
        floorVertices.push(addVertex(flatCoords[i], 0, flatCoords[i + 1]));
      }
      
      // Crear triángulos del suelo (normal hacia arriba: +Y)
      for (let i = 0; i < triangleIndices.length; i += 3) {
        const v0 = floorVertices[triangleIndices[i]];
        const v1 = floorVertices[triangleIndices[i + 1]];
        const v2 = floorVertices[triangleIndices[i + 2]];
        addFace(v0, v2, v1);
      }

      // TECHO: Crear vértices del techo y triangular (normal hacia arriba: +Y, visible desde arriba)
      const ceilingVertices: number[] = [];
      for (let i = 0; i < flatCoords.length; i += 2) {
        ceilingVertices.push(addVertex(flatCoords[i], height, flatCoords[i + 1]));
      }
      
      // Crear triángulos del techo (mismo orden que el suelo para que la normal apunte hacia arriba)
      for (let i = 0; i < triangleIndices.length; i += 3) {
        const v0 = ceilingVertices[triangleIndices[i]];
        const v1 = ceilingVertices[triangleIndices[i + 1]];
        const v2 = ceilingVertices[triangleIndices[i + 2]];
        addFace(v0, v2, v1);
      }

      // PAREDES EXTERIORES: Extruir el contorno exterior
      for (let i = 0; i < exteriorRing.length - 1; i++) {
        const curr = exteriorRing[i];
        const next = exteriorRing[i + 1];
        
        // Calcular el vector del segmento
        const dx = next[0] - curr[0];
        const dy = next[1] - curr[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) continue;
        
        // Calcular el vector perpendicular (hacia la derecha del movimiento)
        const perpX = -dy / len;
        const perpY = dx / len;
        
        // Punto de prueba un poco desplazado hacia la perpendicular
        const testDist = 0.1;
        const midX = (curr[0] + next[0]) / 2;
        const midY = (curr[1] + next[1]) / 2;
        const testX = midX + perpX * testDist;
        const testY = midY + perpY * testDist;
        
        // Verificar si el punto de prueba está dentro del polígono
        const isInside = isPointInPolygon(testX, testY, exteriorRing);
        
        // Crear 4 vértices para el quad: 2 abajo, 2 arriba
        const v0 = addVertex(curr[0], 0, curr[1]);      // abajo actual
        const v1 = addVertex(next[0], 0, next[1]);      // abajo siguiente
        const v2 = addVertex(next[0], height, next[1]); // arriba siguiente
        const v3 = addVertex(curr[0], height, curr[1]); // arriba actual
        
        // Si la perpendicular apunta hacia dentro, invertir el orden
        if (isInside) {
          addQuad(v1, v0, v3, v2);
        } else {
          addQuad(v0, v1, v2, v3);
        }
      }

      // PAREDES INTERIORES (huecos): Extruir cada hueco
      for (const hole of holes) {
        for (let i = 0; i < hole.length - 1; i++) {
          const curr = hole[i];
          const next = hole[i + 1];
          
          // Calcular el vector del segmento
          const dx = next[0] - curr[0];
          const dy = next[1] - curr[1];
          const len = Math.sqrt(dx * dx + dy * dy);
          
          if (len === 0) continue;
          
          // Calcular el vector perpendicular (hacia la derecha del movimiento)
          const perpX = -dy / len;
          const perpY = dx / len;
          
          // Punto de prueba un poco desplazado hacia la perpendicular
          const testDist = 0.1;
          const midX = (curr[0] + next[0]) / 2;
          const midY = (curr[1] + next[1]) / 2;
          const testX = midX + perpX * testDist;
          const testY = midY + perpY * testDist;
          
          // Verificar si el punto de prueba está dentro del hueco
          const isInsideHole = isPointInPolygon(testX, testY, hole);
          
          // Crear 4 vértices para el quad
          const v0 = addVertex(curr[0], 0, curr[1]);      // abajo actual
          const v1 = addVertex(next[0], 0, next[1]);      // abajo siguiente
          const v2 = addVertex(next[0], height, next[1]); // arriba siguiente
          const v3 = addVertex(curr[0], height, curr[1]); // arriba actual
          
          // Para huecos, queremos que la normal apunte hacia dentro del hueco (fuera del sólido)
          // Si la perpendicular apunta hacia fuera del hueco, invertir
          if (isInsideHole) {
            addQuad(v0, v1, v2, v3);
          } else {
            addQuad(v1, v0, v3, v2);
          }
        }
      }
    });

    // Generar archivo OBJ
    let objContent = '# Map exported from 3D Estance Generator\n';
    objContent += `# Polygons: ${polygons.length}, Cuts: ${doors.length}\n\n`;

    for (let i = 0; i < vertices.length; i += 3) {
      objContent += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
    }

    objContent += '\n';

    for (let i = 0; i < faces.length; i += 3) {
      objContent += `f ${faces[i]} ${faces[i + 1]} ${faces[i + 2]}\n`;
    }

    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapa.obj';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [polygons, doors, wallHeight, wallThickness]);

  // Prevent page scroll when mouse is over canvas, but allow zoom
  useEffect(() => {
    const handleWheelGlobal = (e: WheelEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        // Only prevent default to stop page scroll, but let the event bubble to handleWheel
        e.preventDefault();
      }
    };

    // Use capture phase to catch the event early, but don't stop propagation
    window.addEventListener('wheel', handleWheelGlobal, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheelGlobal, { capture: true });
    };
  }, []);

  const selectedPolygon = polygons.find(p => p.id === selectedPolygonId);
  const selectedDoor = doors.find(d => d.id === selectedDoorId);

  return (
    <div className="map-editor">
      <div className="side-panel left-panel">
        <h1 className="panel-title">Editor de Mapas</h1>
        <div className="panel-buttons">
          <button
            className={`tool-button ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Seleccionar y mover salas"
          >
            ✋ Seleccionar
          </button>
          <button
            className={`tool-button ${tool === 'drawWall' ? 'active' : ''}`}
            onClick={handleDrawWall}
            title="Dibujar muro (polígono)"
          >
            ✏️ Dibujar Muro
          </button>
          {isDrawingWall && (
            <button
              className="tool-button"
              onClick={finishPolygon}
              title="Finalizar polígono"
            >
              ✓ Finalizar Polígono
            </button>
          )}
          {selectedPolygon && (
            <button
              className="tool-button delete-button"
              onClick={handleDeletePolygon}
              title="Eliminar polígono seleccionado"
            >
              🗑️ Eliminar Polígono
            </button>
          )}
          {selectedDoor && (
            <button
              className="tool-button delete-button"
              onClick={handleDeleteDoor}
              title="Eliminar puerta seleccionada"
            >
              🗑️ Eliminar Puerta
            </button>
          )}
        </div>
        {tool === 'drawWall' && (
          <div className="tool-hint">
            💡 Haz click para añadir puntos al polígono. Click derecho, Enter o botón para finalizar.
          </div>
        )}
      </div>
      
      <div className="side-panel right-panel">
        <div className="export-section">
          <button
            className="tool-button export-button"
            onClick={exportToOBJ}
            disabled={hasClosedPolygonsWithoutOpenings}
            title={hasClosedPolygonsWithoutOpenings 
              ? "No se puede exportar: hay polígonos cerrados sin aberturas. Abre el polígono o elimina el último punto."
              : "Exportar mapa a formato OBJ 3D"
            }
          >
            📦 Exportar OBJ
          </button>
          {hasClosedPolygonsWithoutOpenings && (
            <div className="tool-hint" style={{ color: '#ff6b6b', marginTop: '10px' }}>
              ⚠️ Los polígonos cerrados necesitan al menos una abertura
            </div>
          )}
          <div className="wall-parameters">
            <label className="parameter-label">
              Altura de muros:
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={wallHeight}
                onChange={(e) => setWallHeight(parseFloat(e.target.value) || 10)}
                className="parameter-input"
              />
              unidades
            </label>
            <label className="parameter-label">
              Grosor de muros:
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={wallThickness}
                onChange={(e) => setWallThickness(parseFloat(e.target.value) || 2)}
                className="parameter-input"
              />
              unidades
            </label>
          </div>
        </div>
        <div className="zoom-indicator">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
      
      <div
        ref={canvasRef}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        onAuxClick={(e) => e.preventDefault()}
      >
        <div 
          className="canvas-content"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid */}
          <div className="grid" />
        
        {/* Wall Polygons */}
        {polygons.map(polygon => (
          <svg
            key={polygon.id}
            className={`wall-polygon ${polygon.id === selectedPolygonId ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: polygon.id === selectedPolygonId ? 10 : 5
            }}
          >
            <polyline
              points={polygon.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={polygon.id === selectedPolygonId ? '#646cff' : '#646cff'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {polygon.points.length > 0 && (
              <polyline
                points={`${polygon.points[0].x},${polygon.points[0].y} ${polygon.points.map(p => `${p.x},${p.y}`).join(' ')}`}
                fill="none"
                stroke={polygon.id === selectedPolygonId ? '#646cff' : '#646cff'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Points */}
            {polygon.points.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r={polygon.id === selectedPolygonId && idx === selectedPointIndex ? 8 : 6}
                fill={polygon.id === selectedPolygonId ? '#646cff' : '#646cff'}
                stroke="#ffffff"
                strokeWidth="2"
                style={{ pointerEvents: 'auto', cursor: 'move' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedPolygonId(polygon.id);
                  setSelectedPointIndex(idx);
                  setIsDraggingPoint(true);
                  // Calcular posición del mouse en coordenadas del mundo
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = snapToGrid((e.clientX - rect.left - panOffset.x) / zoom);
                    const y = snapToGrid((e.clientY - rect.top - panOffset.y) / zoom);
                    const mousePoint: Point = { x, y };
                    // Guardar el offset entre el mouse y el punto del polígono
                    setDragStart({ x: mousePoint.x - point.x, y: mousePoint.y - point.y });
                  }
                }}
              />
            ))}
          </svg>
        ))}

        {/* Preview polygon while drawing */}
        {isDrawingWall && currentPolygonPoints.length > 0 && (
          <svg
            className="wall-polygon preview"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 8
            }}
          >
            <polyline
              points={currentPolygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#646cff"
              strokeWidth="2"
              strokeDasharray="5,5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {previewPoint && currentPolygonPoints.length > 0 && (
              <line
                x1={currentPolygonPoints[currentPolygonPoints.length - 1].x}
                y1={currentPolygonPoints[currentPolygonPoints.length - 1].y}
                x2={previewPoint.x}
                y2={previewPoint.y}
                stroke="#646cff"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            {currentPolygonPoints.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r={6}
                fill="#646cff"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
            {previewPoint && (
              <circle
                cx={previewPoint.x}
                cy={previewPoint.y}
                r={6}
                fill="rgba(100, 108, 255, 0.5)"
                stroke="#646cff"
                strokeWidth="2"
              />
            )}
          </svg>
        )}

        {/* Wall Cuts - TODO: Implementar visualización de cortes en polígonos */}
        </div>
      </div>
    </div>
  );
}


