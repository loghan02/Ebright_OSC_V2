export type ShapeId =
  | "circle"
  | "square"
  | "rectangle"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "heart"
  | "arrow"
  | "ellipse"
  | "plus";

export const SHAPE_DEFS: Record<ShapeId, (fill: string, stroke: string) => string> = {
  circle: (f, s) => `<circle cx="32" cy="32" r="26" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  square: (f, s) => `<rect x="8" y="8" width="48" height="48" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  rectangle: (f, s) => `<rect x="6" y="20" width="52" height="24" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  triangle: (f, s) => `<polygon points="32,8 58,56 6,56" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  diamond: (f, s) => `<polygon points="32,6 58,32 32,58 6,32" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  pentagon: (f, s) => `<polygon points="32,6 58,24 48,56 16,56 6,24" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  hexagon: (f, s) => `<polygon points="20,8 44,8 58,32 44,56 20,56 6,32" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  star: (f, s) =>
    `<polygon points="32,6 39,25 59,25 43,37 49,57 32,45 15,57 21,37 5,25 25,25" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  heart: (f, s) =>
    `<path d="M32 56 C 6 38, 6 16, 22 16 C 28 16, 32 22, 32 22 C 32 22, 36 16, 42 16 C 58 16, 58 38, 32 56 Z" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  arrow: (f, s) =>
    `<polygon points="6,24 38,24 38,12 58,32 38,52 38,40 6,40" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  ellipse: (f, s) => `<ellipse cx="32" cy="32" rx="26" ry="16" fill="${f}" stroke="${s}" stroke-width="3"/>`,
  plus: (f, s) =>
    `<polygon points="24,6 40,6 40,24 58,24 58,40 40,40 40,58 24,58 24,40 6,40 6,24 24,24" fill="${f}" stroke="${s}" stroke-width="3"/>`,
};

export function renderShapeSvg(id: ShapeId, filled: boolean, color: string): string {
  const def = SHAPE_DEFS[id];
  if (!def) return "";
  const f = filled ? color : "none";
  const s = filled ? "none" : color;
  return def(f, s);
}
