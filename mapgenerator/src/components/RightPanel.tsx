import { useState } from 'react';
import type { WallPolygon } from '../types';

interface RightPanelProps {
  polygons: WallPolygon[];
  visiblePolygons: Set<string>;
  lockedPolygons: Set<string>;
  onTogglePolygonVisibility: (id: string) => void;
  onTogglePolygonLock: (id: string) => void;
  onRenamePolygon: (id: string, name: string) => void;
  onChangePolygonColor: (id: string, color: string) => void;
}

export function RightPanel({
  polygons,
  visiblePolygons,
  lockedPolygons,
  onTogglePolygonVisibility,
  onTogglePolygonLock,
  onRenamePolygon,
  onChangePolygonColor,
}: RightPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  return (
    <div className="side-panel right-panel">
      {/* Polygon List */}
      {polygons.length > 0 && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          flex: 1,
          overflowY: 'auto',
          width: '100%',
          minHeight: 0
        }}>
          <h3 style={{
            fontSize: '11px',
            marginBottom: '8px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 500
          }}>
            Polylines ({polygons.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {polygons.map((polygon, index) => {
              const isVisible = visiblePolygons.has(polygon.id);
              const isLocked = lockedPolygons.has(polygon.id);
              const isEditing = editingId === polygon.id;
              const displayName = polygon.name || `Room ${index + 1}`;
              
              return (
                <div
                  key={polygon.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '4px',
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
                          padding: '3px 6px',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 500,
                          outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: isVisible ? (isLocked ? '#aaa' : '#fff') : '#666',
                          transition: 'color 0.2s ease',
                          cursor: isLocked ? 'default' : 'text',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: isLocked ? 0.7 : 1
                        }}
                        onDoubleClick={(e) => {
                          if (isLocked) return;
                          e.stopPropagation();
                          setEditingId(polygon.id);
                          setEditingName(displayName);
                        }}
                        title={isLocked ? "Polygon is locked - cannot rename" : "Double click to rename"}
                      >
                        {displayName}
                        <span style={{
                          fontSize: '10px',
                          marginLeft: '4px',
                          opacity: 0.7,
                          fontWeight: 400
                        }}>
                          ({polygon.points.length} pts)
                        </span>
                      </span>
                    )}
                    {/* Color Picker */}
                    <input
                      type="color"
                      value={polygon.fillColor || '#6464ff'}
                      onChange={(e) => {
                        const color = e.target.value;
                        onChangePolygonColor(polygon.id, color);
                      }}
                      disabled={isLocked}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        background: 'none',
                        flexShrink: 0,
                        opacity: isLocked ? 0.5 : 1
                      }}
                      title={isLocked ? "Polygon is locked - cannot change color" : "Change polygon fill color"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {/* Lock Button */}
                  <span
                    style={{
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: isLocked ? 1 : 0.6
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePolygonLock(polygon.id);
                    }}
                    title={isLocked ? "Unlock polygon" : "Lock polygon (prevents editing)"}
                  >
                    {isLocked ? '🔒' : '🔓'}
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
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


