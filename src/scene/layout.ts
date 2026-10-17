import type { TargetId } from "../game/store";
export type V3 = [number, number, number];
export type Solid = {
  id: string;
  p: V3;
  size: V3;
  kind: "wall" | "pillar" | "counter" | "cabinet" | "screen";
};
// All model transforms and colliders share this layout. Units: metres.
export const spawn: V3 = [0, 1.05, 18];
export const solids: Solid[] = [
  { id: "east", p: [10, 3, 0], size: [0.45, 6, 40], kind: "wall" },
  { id: "west-low", p: [-10, 1.1, 0], size: [0.45, 2.2, 40], kind: "wall" },
  { id: "west-upper", p: [-10, 5.8, 0], size: [0.45, 0.4, 40], kind: "wall" },
  {
    id: "west-south",
    p: [-10, 3.9, 12.5],
    size: [0.45, 3.4, 15],
    kind: "wall",
  },
  { id: "west-north", p: [-10, 3.9, -11], size: [0.45, 3.4, 18], kind: "wall" },
  { id: "north", p: [0, 3, -20], size: [20, 6, 0.45], kind: "wall" },
  { id: "south", p: [0, 3, 20], size: [20, 6, 0.45], kind: "wall" },
  { id: "bend1", p: [3.1, 1.8, 8], size: [13.6, 3.6, 0.55], kind: "wall" },
  { id: "bend2", p: [-3.2, 1.8, -6], size: [13.3, 3.6, 0.55], kind: "wall" },
  { id: "counter", p: [-6, 0.6, 15.7], size: [3.4, 1.2, 1], kind: "counter" },
  { id: "cabinet", p: [8.9, 1.4, -11.8], size: [1.3, 2.8, 1], kind: "cabinet" },
  { id: "screen", p: [-2.3, 3.5, -19.55], size: [8, 3, 0.18], kind: "screen" },
  ...[-14, -2, 11].flatMap((z, i) =>
    [-7.6, 6.2].map((x, j) => ({
      id: `pillar-${i}-${j}`,
      p: [x, 3, z] as V3,
      size: [0.85, 6, 0.85] as V3,
      kind: "pillar" as const,
    })),
  ),
];
export const chairs = [-1, 2, 5].flatMap((z, r) =>
  [-4, -1.9, 0.2, 2.3, 4.4, 6.5].map((x, c) => ({
    id: `chair-${r}-${c}`,
    p: [x, 0, z] as V3,
    featured: r === 1 && c === 0,
    broken: (r * 6 + c) % 5 === 3,
  })),
);
export const targets: { id: TargetId; p: V3; size: V3; crouch?: boolean }[] = [
  { id: "ticket", p: [-6, 0.08, 14.5], size: [0.32, 0.09, 0.23], crouch: true },
  { id: "seat", p: [-4, 0.69, 2.05], size: [0.35, 0.16, 0.16] },
  { id: "box", p: [8.2, 0.22, -17.4], size: [0.48, 0.35, 0.42], crouch: true },
  { id: "symbol", p: [-6, 1.35, -6.31], size: [0.65, 0.7, 0.09] },
  { id: "dream", p: [-6, 1.35, -6.5], size: [0.3, 0.4, 0.16] },
  { id: "exit", p: [5.5, 1.35, -19.65], size: [1.9, 2.7, 0.2] },
  { id: "poster", p: [2.4, 1.65, 8.32], size: [0.85, 1.2, 0.04] },
  { id: "projector", p: [7, 1, -12], size: [0.8, 1.1, 0.8] },
];
