export type Point = {
  x: number;
  y: number;
};

export type WallPolygon = {
  id: string;
  name?: string; // Nombre personalizado de la polilínea
  points: Point[]; // Array de puntos que definen el polígono del muro
  fillColor?: string; // Color de relleno del polígono (RGBA)
};

export type Tool = 'select' | 'drawWall';
