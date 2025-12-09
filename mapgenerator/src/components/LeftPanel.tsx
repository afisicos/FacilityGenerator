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
  onDisconnectPoints: () => void;
  onAddPointsToWall: () => void;
  onFinishAddingPoints: () => void;
  onSaveScenario: () => void;
  onLoadScenario: (file: File) => void;
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
  onDisconnectPoints,
  onAddPointsToWall,
  onFinishAddingPoints,
  onSaveScenario,
  onLoadScenario,
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

  // Verificar si hay exactamente 2 puntos adyacentes del mismo trazado seleccionados
  // y que ninguno sea extremo del trazado
  const canDisconnectPoints = () => {
    if (selectedPoints.length !== 2) return false;

    const polygonId1 = selectedPoints[0].polygonId;
    const polygonId2 = selectedPoints[1].polygonId;

    // Ambos puntos deben ser del mismo trazado
    if (polygonId1 !== polygonId2) return false;

    const polygon = polygons.find(p => p.id === polygonId1);
    if (!polygon) return false;

    const indices = [selectedPoints[0].pointIndex, selectedPoints[1].pointIndex].sort((a, b) => a - b);
    const [idx1, idx2] = indices;

    // Deben ser adyacentes (diferencia de 1 en índices)
    if (idx2 - idx1 !== 1) return false;

    // Ninguno debe ser extremo del trazado
    const isEndpoint1 = idx1 === 0 || idx1 === polygon.points.length - 1;
    const isEndpoint2 = idx2 === 0 || idx2 === polygon.points.length - 1;

    return !isEndpoint1 && !isEndpoint2;
  };

  const hasTwoPointsSelected = canDisconnectPoints();

  // Handler para el input file de carga
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadScenario(file);
    }
    // Reset el input para permitir cargar el mismo archivo otra vez
    e.target.value = '';
  };

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
        {hasTwoPointsSelected && (
          <button
            className="tool-button"
            onClick={onDisconnectPoints}
            title="Disconnect two adjacent points (neither being endpoints) to split the wall segment"
          >
            🔌 Disconnect Points
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

        {/* Scenario Management */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0', paddingTop: '12px' }}>
          <button
            className="tool-button"
            onClick={onSaveScenario}
            title="Save current scenario to JSON file"
            style={{ width: '100%', marginBottom: '8px' }}
          >
            💾 Save Scenario
          </button>
          <label
            className="tool-button"
            style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center' }}
            title="Load scenario from JSON file"
          >
            📁 Load Scenario
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
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


