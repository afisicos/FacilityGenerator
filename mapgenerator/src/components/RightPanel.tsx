import { useState } from 'react';
import type { WallPolygon } from '../types';

interface RightPanelProps {
  wallHeight: number;
  wallThickness: number;
  zoom: number;
  hasClosedPolygons: boolean;
  polygons: WallPolygon[];
  visiblePolygons: Set<string>;
  exportTogether: boolean;
  floorWithVolume: boolean;
  onExportWalls: () => void;
  onExportFloor: () => void;
  onWallHeightChange: (height: number) => void;
  onWallThicknessChange: (thickness: number) => void;
  onTogglePolygonVisibility: (id: string) => void;
  onToggleExportTogether: () => void;
  onToggleFloorVolume: () => void;
  onRenamePolygon: (id: string, name: string) => void;
}

export function RightPanel({
  wallHeight,
  wallThickness,
  zoom,
  hasClosedPolygons,
  polygons,
  visiblePolygons,
  exportTogether,
  floorWithVolume,
  onExportWalls,
  onExportFloor,
  onWallHeightChange,
  onWallThicknessChange,
  onTogglePolygonVisibility,
  onToggleExportTogether,
  onToggleFloorVolume,
  onRenamePolygon,
}: RightPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  return (
    <div className="side-panel right-panel">
      <div className="export-section">
        {/* Export Together Toggle */}
        <label className="parameter-label" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={exportTogether}
            onChange={onToggleExportTogether}
            style={{ marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <span>Export together (single file)</span>
        </label>

        <button
          className="tool-button export-button"
          onClick={onExportWalls}
          disabled={hasClosedPolygons}
          title={hasClosedPolygons 
            ? "Cannot export: there are closed polygons. Keep the polygon open or remove the last point."
            : exportTogether 
              ? "Export all walls together to OBJ 3D format"
              : "Export each wall separately to OBJ 3D format"
          }
        >
          📦 Export Walls
        </button>

        {/* Floor with Volume Toggle */}
        <label className="parameter-label" style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={floorWithVolume}
            onChange={onToggleFloorVolume}
            style={{ marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <span>Floor with volume (1 unit height)</span>
        </label>

        <button
          className="tool-button export-button"
          onClick={onExportFloor}
          title={
            floorWithVolume
              ? exportTogether 
                ? "Export all floors with volume (1 unit height) together"
                : "Export each floor with volume (1 unit height) separately"
              : exportTogether 
                ? "Export all floors as flat surface together"
                : "Export each floor as flat surface separately"
          }
        >
          🏢 Export Floor
        </button>
        {hasClosedPolygons && (
          <div className="tool-hint" style={{ color: '#ff6b6b', marginTop: '10px' }}>
            ⚠️ Closed polygons cannot be exported as walls. Keep walls open.
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

      {/* Polygon List */}
      {polygons.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          width: '100%'
        }}>
          <h3 style={{ 
            fontSize: '12px', 
            marginBottom: '12px', 
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 500
          }}>
            Polylines ({polygons.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {polygons.map((polygon, index) => {
              const isVisible = visiblePolygons.has(polygon.id);
              const isEditing = editingId === polygon.id;
              const displayName = polygon.name || `Polyline ${index + 1}`;
              
              return (
                <div
                  key={polygon.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: isVisible 
                      ? 'rgba(100, 108, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isVisible ? 'rgba(100, 108, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditing) {
                      e.currentTarget.style.backgroundColor = isVisible 
                        ? 'rgba(100, 108, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditing) {
                      e.currentTarget.style.backgroundColor = isVisible 
                        ? 'rgba(100, 108, 255, 0.15)' 
                        : 'rgba(255, 255, 255, 0.03)';
                    }
                  }}
                >
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: 0
                  }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          if (editingName.trim()) {
                            onRenamePolygon(polygon.id, editingName.trim());
                          }
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingName.trim()) {
                              onRenamePolygon(polygon.id, editingName.trim());
                            }
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(100, 108, 255, 0.5)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 500,
                          outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        style={{ 
                          fontSize: '13px',
                          fontWeight: 500,
                          color: isVisible ? '#fff' : '#666',
                          transition: 'color 0.2s ease',
                          cursor: 'text',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingId(polygon.id);
                          setEditingName(displayName);
                        }}
                        title="Double click to rename"
                      >
                        {displayName}
                        <span style={{ 
                          fontSize: '11px',
                          marginLeft: '6px',
                          opacity: 0.7,
                          fontWeight: 400
                        }}>
                          ({polygon.points.length} pts)
                        </span>
                      </span>
                    )}
                  </div>
                  <span 
                    style={{ 
                      fontSize: '18px',
                      transition: 'all 0.2s ease',
                      opacity: isVisible ? 1 : 0.4,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePolygonVisibility(polygon.id);
                    }}
                  >
                    {isVisible ? '👁️' : '👁️‍🗨️'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


