import type { Point, WallPolygon } from '../types';
import { GRID_SIZE } from './constants';

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function getPointFromClick(
  point: Point,
  polygon: WallPolygon,
  threshold: number = 15
): number | null {
  for (let i = 0; i < polygon.points.length; i++) {
    const p = polygon.points[i];
    const dist = Math.sqrt(
      Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2)
    );
    if (dist < threshold) {
      return i;
    }
  }
  return null;
}

export function lineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1)
  };
}

export function isPointInRect(
  point: Point,
  rectStart: Point,
  rectEnd: Point
): boolean {
  const minX = Math.min(rectStart.x, rectEnd.x);
  const maxX = Math.max(rectStart.x, rectEnd.x);
  const minY = Math.min(rectStart.y, rectEnd.y);
  const maxY = Math.max(rectStart.y, rectEnd.y);

  return point.x >= minX && point.x <= maxX && 
         point.y >= minY && point.y <= maxY;
}

export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

