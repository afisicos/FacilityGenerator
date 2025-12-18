export type Point = {
  x: number;
  y: number;
};

export type WallPolygon = {
  id: string;
  name?: string; // Nombre personalizado de la polilínea/polígono
  points: Point[]; // Array de puntos que definen la polilínea o el polígono
  fillColor?: string; // Color de relleno del polígono (solo para polígonos cerrados)
  isClosed: boolean; // true = polígono cerrado, false = polilínea abierta
};

export type Tool = 'select' | 'drawWall';
