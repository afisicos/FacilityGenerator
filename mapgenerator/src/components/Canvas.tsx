import { useMemo } from 'react';
import type { WallPolygon, Point } from '../types';

// Función helper para convertir color HEX a RGBA con opacidad
const hexToRgba = (hex: string, alpha: number = 0.1): string => {
  if (!hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Función helper para detectar si un punto tiene duplicados en el polígono
const hasDuplicatePoints = (points: Point[], currentIndex: number): boolean => {
  const currentPoint = points[currentIndex];
  for (let i = 0; i < points.length; i++) {
    if (i !== currentIndex && points[i].x === currentPoint.x && points[i].y === currentPoint.y) {
      return true;
    }
  }
  return false;
};

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  polygons: WallPolygon[];
  visiblePolygons: Set<string>;
  selectedPolygonId: string | null;
  selectedPointIndex: number | null;
  selectedPoints: { polygonId: string; pointIndex: number }[];
  isDrawingWall: boolean;
  currentPolygonPoints: Point[];
  previewPoint: Point | null;
  isAddingToPolygon: boolean;
  addToStart: boolean;
  isBoxSelecting: boolean;
  boxSelectStart: Point | null;
  boxSelectEnd: Point | null;
  zoom: number;
  panOffset: Point;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  onPointMouseDown: (polygonId: string, pointIndex: number, e: React.MouseEvent<SVGCircleElement>) => void;
  onPointDoubleClick: (polygonId: string) => void;
}

export function Canvas({
  canvasRef,
  polygons,
  visiblePolygons,
  selectedPolygonId,
  selectedPointIndex,
  selectedPoints,
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
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onPointMouseDown,
  onPointDoubleClick,
}: CanvasProps) {
  // Memoizar los polígonos visibles con sus colores para forzar re-render
  const visiblePolygonsWithColors = useMemo(() => {
    return polygons.filter(p => visiblePolygons.has(p.id)).map(polygon => ({
      ...polygon,
      strokeColor: polygon.fillColor || '#6464ff'
    }));
  }, [polygons, visiblePolygons]);
  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
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
        {visiblePolygonsWithColors.map(polygon => (
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
            {/* Polígono cerrado cuando hay 3 o más puntos */}
            {polygon.points.length >= 3 && (
              <polygon
                points={polygon.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={polygon.fillColor ? hexToRgba(polygon.fillColor, polygon.id === selectedPolygonId ? 0.2 : 0.1) : (polygon.id === selectedPolygonId ? 'rgba(100, 108, 255, 0.2)' : 'rgba(100, 108, 255, 0.1)')}
                stroke="none"
              />
            )}
            {/* Líneas del contorno */}
            <polyline
              points={polygon.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={polygon.strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {polygon.points.length > 0 && (
              <polyline
                points={`${polygon.points[0].x},${polygon.points[0].y} ${polygon.points.map(p => `${p.x},${p.y}`).join(' ')}`}
                fill="none"
                stroke={polygon.strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0"
              />
            )}
            {/* Points */}
            {polygon.points.map((point, idx) => {
              const isSelected = selectedPoints.some(sp => sp.polygonId === polygon.id && sp.pointIndex === idx);
              const isSingleSelected = polygon.id === selectedPolygonId && idx === selectedPointIndex;
              const hasDuplicates = hasDuplicatePoints(polygon.points, idx);

              return (
                <g key={idx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected || isSingleSelected ? 4 : 3}
                    fill={isSelected ? '#ff6b6b' : (isSingleSelected ? '#646cff' : '#646cff')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ pointerEvents: 'auto', cursor: 'move' }}
                    onMouseDown={(e) => onPointMouseDown(polygon.id, idx, e)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onPointDoubleClick(polygon.id);
                    }}
                  />
                  {hasDuplicates && (
                    <text
                      x={point.x + 10}
                      y={point.y - 8}
                      fill="#ff6b6b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      2
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ))}

        {/* Distance indicators for selected points */}
        {(() => {
          const distanceLabels = [];
          let showDistances = false;

          // Multiple points selected
          if (selectedPoints.length >= 2) {
            // Group points by polygon
            const pointsByPolygon = selectedPoints.reduce((acc, point) => {
              if (!acc[point.polygonId]) {
                acc[point.polygonId] = [];
              }
              acc[point.polygonId].push(point);
              return acc;
            }, {} as Record<string, typeof selectedPoints>);

            // Only show distances if all points are from the same polygon
            const polygonIds = Object.keys(pointsByPolygon);
            if (polygonIds.length === 1) {
              const polygonId = polygonIds[0];
              const polygonPoints = pointsByPolygon[polygonId];

              // Sort points by their index in the polygon
              polygonPoints.sort((a, b) => a.pointIndex - b.pointIndex);

              const polygon = polygons.find(p => p.id === polygonId);
              if (polygon) {
                // Create distance labels for each adjacent pair
                for (let i = 0; i < polygonPoints.length - 1; i++) {
                  const point1 = polygonPoints[i];
                  const point2 = polygonPoints[i + 1];

                  const p1 = polygon.points[point1.pointIndex];
                  const p2 = polygon.points[point2.pointIndex];

                  if (!p1 || !p2) continue;

                  // Calculate distance
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Calculate midpoint for label position
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;

                  // Calculate perpendicular offset for label (above the line)
                  const length = Math.sqrt(dx * dx + dy * dy);
                  if (length === 0) continue;

                  const offsetX = -dy / length * 15; // 15 units above the line
                  const offsetY = dx / length * 15;

                  distanceLabels.push(
                    <text
                      key={`distance-multi-${i}`}
                      x={midX + offsetX}
                      y={midY + offsetY}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {Math.round(distance)}
                    </text>
                  );
                }
                showDistances = distanceLabels.length > 0;
              }
            }
          }
          // Single point selected - show distances of connected walls
          else if (selectedPolygonId && selectedPointIndex !== null) {
            const polygon = polygons.find(p => p.id === selectedPolygonId);
            if (polygon && polygon.points.length >= 2) {
              const pointIndex = selectedPointIndex;
              const points = polygon.points;

              // Get the segments connected to this point
              const connectedSegments = [];

              // Previous segment (if not the first point)
              if (pointIndex > 0) {
                connectedSegments.push({
                  p1: points[pointIndex - 1],
                  p2: points[pointIndex],
                  key: `prev-${pointIndex}`
                });
              }

              // Next segment (if not the last point)
              if (pointIndex < points.length - 1) {
                connectedSegments.push({
                  p1: points[pointIndex],
                  p2: points[pointIndex + 1],
                  key: `next-${pointIndex}`
                });
              }

              // If it's the last point and the polygon is closed, also include the closing segment
              if (pointIndex === points.length - 1 && points.length >= 3) {
                const firstPoint = points[0];
                const lastPoint = points[points.length - 1];
                // Check if polygon is closed (first and last points are the same)
                if (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
                  connectedSegments.push({
                    p1: points[points.length - 2],
                    p2: points[0],
                    key: `close-${pointIndex}`
                  });
                }
              }

              // Create distance labels for connected segments
              connectedSegments.forEach(segment => {
                const { p1, p2, key } = segment;

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate midpoint for label position
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                // Calculate perpendicular offset for label (above the line)
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length === 0) return;

                const offsetX = -dy / length * 15; // 15 units above the line
                const offsetY = dx / length * 15;

                distanceLabels.push(
                  <text
                    key={`distance-single-${key}`}
                    x={midX + offsetX}
                    y={midY + offsetY}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {Math.round(distance)}
                  </text>
                );
              });

              showDistances = distanceLabels.length > 0;
            }
          }

          if (!showDistances) return null;

          return (
            <svg
              key="distance-indicators"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 25
              }}
            >
              {distanceLabels}
            </svg>
          );
        })()}

        {/* Distance indicator for drawing preview */}
        {isDrawingWall && previewPoint && currentPolygonPoints.length > 0 && (() => {
          const lastPoint = currentPolygonPoints[currentPolygonPoints.length - 1];

          // Calculate distance
          const dx = previewPoint.x - lastPoint.x;
          const dy = previewPoint.y - lastPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate midpoint for label position
          const midX = (lastPoint.x + previewPoint.x) / 2;
          const midY = (lastPoint.y + previewPoint.y) / 2;

          // Calculate perpendicular offset for label (above the line)
          const length = Math.sqrt(dx * dx + dy * dy);
          if (length === 0) return null;

          const offsetX = -dy / length * 15; // 15 units above the line
          const offsetY = dx / length * 15;

          return (
            <svg
              key="drawing-distance-indicator"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 25
              }}
            >
              {/* Distance label */}
              <text
                x={midX + offsetX}
                y={midY + offsetY}
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                {Math.round(distance)}
              </text>
            </svg>
          );
        })()}

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
            {/* Líneas del contorno */}
            <polyline
              points={currentPolygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#646cff"
              strokeWidth="2"
              strokeDasharray="5,5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Polígono cerrado cuando hay 3 o más puntos */}
            {currentPolygonPoints.length >= 3 && (
              <polygon
                points={currentPolygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(100, 108, 255, 0.1)"
                stroke="none"
              />
            )}
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
            {currentPolygonPoints.map((point, idx) => {
              const hasDuplicates = hasDuplicatePoints(currentPolygonPoints, idx);

              return (
                <g key={idx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill="#646cff"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {hasDuplicates && (
                    <text
                      x={point.x + 10}
                      y={point.y - 8}
                      fill="#ff6b6b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      2
                    </text>
                  )}
                </g>
              );
            })}
            {previewPoint && (
              <circle
                cx={previewPoint.x}
                cy={previewPoint.y}
                r={3}
                fill="rgba(100, 108, 255, 0.5)"
                stroke="#646cff"
                strokeWidth="2"
              />
            )}
          </svg>
        )}

        {/* Preview when adding points to existing polygon */}
        {isAddingToPolygon && selectedPolygonId && previewPoint && (() => {
          const polygon = polygons.find(p => p.id === selectedPolygonId);
          if (!polygon) return null;
          
          const endPoint = addToStart ? polygon.points[0] : polygon.points[polygon.points.length - 1];
          
          return (
            <svg
              key="adding-preview"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 8
              }}
            >
              <line
                x1={endPoint.x}
                y1={endPoint.y}
                x2={previewPoint.x}
                y2={previewPoint.y}
                stroke="#646cff"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <circle
                cx={previewPoint.x}
                cy={previewPoint.y}
                r={3}
                fill="rgba(100, 108, 255, 0.5)"
                stroke="#646cff"
                strokeWidth="2"
              />
            </svg>
          );
        })()}

        {/* Rectángulo de selección */}
        {isBoxSelecting && boxSelectStart && boxSelectEnd && (
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <rect
              x={Math.min(boxSelectStart.x, boxSelectEnd.x)}
              y={Math.min(boxSelectStart.y, boxSelectEnd.y)}
              width={Math.abs(boxSelectEnd.x - boxSelectStart.x)}
              height={Math.abs(boxSelectEnd.y - boxSelectStart.y)}
              fill="rgba(100, 108, 255, 0.1)"
              stroke="#646cff"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

