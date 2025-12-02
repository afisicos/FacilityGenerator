interface RightPanelProps {
  wallHeight: number;
  wallThickness: number;
  zoom: number;
  hasClosedPolygons: boolean;
  onExport: () => void;
  onWallHeightChange: (height: number) => void;
  onWallThicknessChange: (thickness: number) => void;
}

export function RightPanel({
  wallHeight,
  wallThickness,
  zoom,
  hasClosedPolygons,
  onExport,
  onWallHeightChange,
  onWallThicknessChange,
}: RightPanelProps) {
  return (
    <div className="side-panel right-panel">
      <div className="export-section">
        <button
          className="tool-button export-button"
          onClick={onExport}
          disabled={hasClosedPolygons}
          title={hasClosedPolygons 
            ? "Cannot export: there are closed polygons. Keep the polygon open or remove the last point."
            : "Export map to OBJ 3D format"
          }
        >
          📦 Export OBJ
        </button>
        {hasClosedPolygons && (
          <div className="tool-hint" style={{ color: '#ff6b6b', marginTop: '10px' }}>
            ⚠️ Closed polygons cannot be exported. Keep walls open.
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
              onChange={(e) => onWallHeightChange(parseFloat(e.target.value) || 10)}
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
              onChange={(e) => onWallThicknessChange(parseFloat(e.target.value) || 2)}
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
  );
}

