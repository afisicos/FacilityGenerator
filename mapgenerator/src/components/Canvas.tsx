import type { WallPolygon, Point } from '../types';

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
        {polygons.filter(p => visiblePolygons.has(p.id)).map(polygon => (
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
                opacity="0"
              />
            )}
            {/* Points */}
            {polygon.points.map((point, idx) => {
              const isSelected = selectedPoints.some(sp => sp.polygonId === polygon.id && sp.pointIndex === idx);
              const isSingleSelected = polygon.id === selectedPolygonId && idx === selectedPointIndex;
              
              return (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={isSelected || isSingleSelected ? 8 : 6}
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
              );
            })}
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
                r={6}
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

