export type Point = {
  x: number;
  y: number;
};

export type WallPolygon = {
  id: string;
  name?: string; // Nombre personalizado de la polilínea
  points: Point[]; // Array de puntos que definen el polígono del muro
};

export type Tool = 'select' | 'drawWall';
