import type { WallPolygon } from '../types';
import polygonClipping from 'polygon-clipping';
import earcut from 'earcut';
import { GRID_SIZE } from './constants';
import { lineIntersection } from './geometry';

export function exportToOBJ(
  polygons: WallPolygon[],
  wallHeight: number,
  wallThickness: number
): void {
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

  // Paso 2: Unión booleana de todos los rectángulos
  if (rectangles.length === 0) {
    alert('No hay muros para exportar');
    return;
  }

  // Hacer unión acumulativa de todos los rectángulos
  let unionResult: polygonClipping.MultiPolygon = rectangles.slice(0, 1);
  for (let i = 1; i < rectangles.length; i++) {
    unionResult = polygonClipping.union(unionResult, rectangles[i]);
  }

  // Paso 3: Extruir y generar geometría 3D con normales correctas
  const vertices: number[] = [];
  const faces: number[] = [];
  let vertexOffset = 0;

  const addVertex = (x: number, y: number, z: number): number => {
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

  // Procesar cada polígono del resultado de unión
  unionResult.forEach(polygon => {
    const exteriorRing = polygon[0];
    const holes = polygon.slice(1);

    // SUELO: Triangular el polígono usando earcut
    const flatCoords: number[] = [];
    const holeIndices: number[] = [];
    
    for (let i = 0; i < exteriorRing.length - 1; i++) {
      flatCoords.push(exteriorRing[i][0], exteriorRing[i][1]);
    }
    
    for (const hole of holes) {
      holeIndices.push(flatCoords.length / 2);
      for (let i = 0; i < hole.length - 1; i++) {
        flatCoords.push(hole[i][0], hole[i][1]);
      }
    }
    
    const triangleIndices = earcut(flatCoords, holeIndices, 2);
    
    // Crear vértices del suelo
    const floorVertices: number[] = [];
    for (let i = 0; i < flatCoords.length; i += 2) {
      floorVertices.push(addVertex(flatCoords[i], 0, flatCoords[i + 1]));
    }
    
    // Crear triángulos del suelo
    for (let i = 0; i < triangleIndices.length; i += 3) {
      const v0 = floorVertices[triangleIndices[i]];
      const v1 = floorVertices[triangleIndices[i + 1]];
      const v2 = floorVertices[triangleIndices[i + 2]];
      addFace(v0, v2, v1);
    }

    // TECHO: Crear vértices del techo
    const ceilingVertices: number[] = [];
    for (let i = 0; i < flatCoords.length; i += 2) {
      ceilingVertices.push(addVertex(flatCoords[i], height, flatCoords[i + 1]));
    }
    
    // Crear triángulos del techo
    for (let i = 0; i < triangleIndices.length; i += 3) {
      const v0 = ceilingVertices[triangleIndices[i]];
      const v1 = ceilingVertices[triangleIndices[i + 1]];
      const v2 = ceilingVertices[triangleIndices[i + 2]];
      addFace(v0, v2, v1);
    }

    // PAREDES EXTERIORES
    for (let i = 0; i < exteriorRing.length - 1; i++) {
      const curr = exteriorRing[i];
      const next = exteriorRing[i + 1];
      
      const dx = next[0] - curr[0];
      const dy = next[1] - curr[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len === 0) continue;
      
      const perpX = -dy / len;
      const perpY = dx / len;
      
      const testDist = 0.1;
      const midX = (curr[0] + next[0]) / 2;
      const midY = (curr[1] + next[1]) / 2;
      const testX = midX + perpX * testDist;
      const testY = midY + perpY * testDist;
      
      const isInside = isPointInPolygon(testX, testY, exteriorRing);
      
      const v0 = addVertex(curr[0], 0, curr[1]);
      const v1 = addVertex(next[0], 0, next[1]);
      const v2 = addVertex(next[0], height, next[1]);
      const v3 = addVertex(curr[0], height, curr[1]);
      
      if (isInside) {
        addQuad(v1, v0, v3, v2);
      } else {
        addQuad(v0, v1, v2, v3);
      }
    }

    // PAREDES INTERIORES (huecos)
    for (const hole of holes) {
      for (let i = 0; i < hole.length - 1; i++) {
        const curr = hole[i];
        const next = hole[i + 1];
        
        const dx = next[0] - curr[0];
        const dy = next[1] - curr[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) continue;
        
        const perpX = -dy / len;
        const perpY = dx / len;
        
        const testDist = 0.1;
        const midX = (curr[0] + next[0]) / 2;
        const midY = (curr[1] + next[1]) / 2;
        const testX = midX + perpX * testDist;
        const testY = midY + perpY * testDist;
        
        const isInsideHole = isPointInPolygon(testX, testY, hole);
        
        const v0 = addVertex(curr[0], 0, curr[1]);
        const v1 = addVertex(next[0], 0, next[1]);
        const v2 = addVertex(next[0], height, next[1]);
        const v3 = addVertex(curr[0], height, curr[1]);
        
        if (isInsideHole) {
          addQuad(v0, v1, v2, v3);
        } else {
          addQuad(v1, v0, v3, v2);
        }
      }
    }
  });

  // Generar archivo OBJ
  let objContent = '# Map exported from Facility Generator\n';
  objContent += `# Polygons: ${polygons.length}\n\n`;

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
}

