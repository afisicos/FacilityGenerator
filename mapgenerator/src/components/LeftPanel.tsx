import type { Tool, WallPolygon } from '../types';

interface LeftPanelProps {
  tool: Tool;
  isDrawingWall: boolean;
  isAddingToPolygon: boolean;
  selectedPoints: { polygonId: string; pointIndex: number }[];
  selectedPolygonId: string | null;
  selectedPointIndex: number | null;
  polygons: WallPolygon[];
  onSetTool: (tool: Tool) => void;
  onDrawWall: () => void;
  onFinishPolygon: () => void;
  onDeletePoints: () => void;
  onAddPointsToWall: () => void;
  onFinishAddingPoints: () => void;
}

export function LeftPanel({
  tool,
  isDrawingWall,
  isAddingToPolygon,
  selectedPoints,
  selectedPolygonId,
  selectedPointIndex,
  polygons,
  onSetTool,
  onDrawWall,
  onFinishPolygon,
  onDeletePoints,
  onAddPointsToWall,
  onFinishAddingPoints,
}: LeftPanelProps) {
  // Determinar qué polígono está seleccionado
  const getSelectedPolygonInfo = () => {
    let polygonId: string | null = null;
    
    // Si hay un punto seleccionado individualmente
    if (selectedPolygonId) {
      polygonId = selectedPolygonId;
    }
    // Si hay puntos seleccionados múltiples, verificar si todos son del mismo polígono
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
    
    const polygonIndex = polygons.findIndex(p => p.id === polygonId) + 1;
    const displayName = polygon.name || `Polyline ${polygonIndex}`;
    
    return { polygon, displayName };
  };

  const selectedPolygonInfo = getSelectedPolygonInfo();

  // Verificar si hay un único punto extremo seleccionado
  const getSelectedEndpoint = () => {
    let polygonId: string | null = null;
    let pointIndex: number | null = null;
    
    if (selectedPolygonId && selectedPointIndex !== null) {
      polygonId = selectedPolygonId;
      pointIndex = selectedPointIndex;
    } else if (selectedPoints.length === 1) {
      polygonId = selectedPoints[0].polygonId;
      pointIndex = selectedPoints[0].pointIndex;
    }
    
    if (!polygonId || pointIndex === null) return null;
    
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return null;
    
    const isEndpoint = pointIndex === 0 || pointIndex === polygon.points.length - 1;
    if (!isEndpoint) return null;
    
    return { polygonId, pointIndex };
  };

  const hasSelectedEndpoint = getSelectedEndpoint() !== null;

  return (
    <div className="side-panel left-panel">
      <h1 className="panel-title">Facility Generator</h1>
      
      {/* Selected Polyline Info */}
      {selectedPolygonInfo && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '6px',
          backgroundColor: 'rgba(100, 108, 255, 0.15)',
          border: '1px solid rgba(100, 108, 255, 0.3)',
        }}>
          <div style={{
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
            fontWeight: 500
          }}>
            Selected
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '4px'
          }}>
            {selectedPolygonInfo.displayName}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#aaa',
            opacity: 0.8
          }}>
            {selectedPolygonInfo.polygon.points.length} points
            {selectedPoints.length > 0 && selectedPoints.length < selectedPolygonInfo.polygon.points.length && 
              ` · ${selectedPoints.length} selected`
            }
          </div>
        </div>
      )}

      <div className="panel-buttons">
        <button
          className={`tool-button ${tool === 'select' ? 'active' : ''}`}
          onClick={() => onSetTool('select')}
          title="Seleccionar y mover salas"
        >
          ✋ Select and Move
        </button>
        <button
          className={`tool-button ${tool === 'drawWall' ? 'active' : ''}`}
          onClick={onDrawWall}
          title="Dibujar muro (polígono)"
        >
          ✏️ Create Wall
        </button>
        {isDrawingWall && (
          <button
            className="tool-button"
            onClick={onFinishPolygon}
            title="Finalizar polígono"
          >
            ✓ Finish Wall
          </button>
        )}
        {(selectedPoints.length > 0 || (selectedPolygonId && selectedPointIndex !== null)) && (
          <button
            className="tool-button delete-button"
            onClick={onDeletePoints}
            title={selectedPoints.length > 0 
              ? `Delete ${selectedPoints.length} selected point(s)` 
              : "Delete selected point"}
          >
            🗑️ Delete Point{selectedPoints.length > 1 ? 's' : ''}
          </button>
        )}
        {hasSelectedEndpoint && (
          isAddingToPolygon ? (
            <button
              className="tool-button"
              onClick={onFinishAddingPoints}
              title="Finish adding points"
            >
              ✓ Finish Adding Points
            </button>
          ) : (
            <button
              className="tool-button"
              onClick={onAddPointsToWall}
              title="Add more points to this wall endpoint"
            >
              ➕ Add Points To Wall
            </button>
          )
        )}
      </div>
      {tool === 'drawWall' && (
        <div className="tool-hint">
          💡 Left click to add points to the wall polygon . Right click to finish.
        </div>
      )}
      {isAddingToPolygon && (
        <div className="tool-hint">
          💡 Left click to add points. Right click to finish.
        </div>
      )}
    </div>
  );
}


