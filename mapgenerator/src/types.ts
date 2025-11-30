export type Point = {
  x: number;
  y: number;
};

export type WallPolygon = {
  id: string;
  points: Point[]; // Array de puntos que definen el polígono del muro
};

export type Door = {
  id: string;
  polygonId: string;
  segmentIndex: number; // Índice del segmento del polígono donde está el corte
  position: number; // Posición a lo largo del segmento (0-1)
};

export type Tool = 'select' | 'drawWall' | 'cutWall';
