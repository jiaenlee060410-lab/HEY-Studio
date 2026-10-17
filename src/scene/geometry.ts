import * as T from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { random } from "./materials";
import type { V3 } from "./layout";
const cache = new Map<string, T.BufferGeometry>();
export function chipped(size: V3, seed = 1, cushion = false) {
  const key = `${size}:${seed}:${cushion}`;
  if (cache.has(key)) return cache.get(key)!;
  const radius = Math.min(...size) * (cushion ? 0.25 : 0.12),
    g = new RoundedBoxGeometry(...size, 3, radius),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const wave =
      Math.sin(x * 19 + seed) *
      Math.sin(z * 27 + seed) *
      Math.cos(y * 23 + seed);
    const dent = cushion
      ? Math.sin(x * 8) ** 2 * 0.018
      : Math.max(0, wave - 0.3) * 0.035;
    const n = new T.Vector3(x / size[0], y / size[1], z / size[2]).normalize();
    p.setXYZ(i, x - n.x * dent, y - n.y * dent, z - n.z * dent);
  }
  g.computeVertexNormals();
  cache.set(key, g);
  return g;
}
export function tube(points: V3[], radius = 0.025) {
  return new T.TubeGeometry(
    new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
    32,
    radius,
    8,
    false,
  );
}
export function fragment(seed: number) {
  const rng = random(seed),
    points = Array.from(
      { length: 18 },
      () =>
        new T.Vector3(
          (rng() - 0.5) * 2,
          (rng() - 0.5) * 0.5,
          (rng() - 0.5) * 2,
        ),
    );
  const g = new ConvexGeometry(points);
  const p = g.attributes.position;
  const uv = [];
  for (let i = 0; i < p.count; i++) uv.push(p.getX(i), p.getZ(i));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  return g;
}
export function cup() {
  const points = Array.from(
    { length: 16 },
    (_, i) => new T.Vector2(0.038 + i * 0.002, i * 0.008),
  );
  const g = new T.LatheGeometry(points, 32);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) * (1 - 0.65 * Math.sin(y * 23)));
    p.setZ(i, p.getZ(i) * 0.45 + Math.sin(y * 40) * 0.02);
  }
  g.computeVertexNormals();
  return g;
}
export function paper() {
  const g = new T.PlaneGeometry(0.31, 0.21, 16, 12),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++)
    p.setZ(
      i,
      Math.sin(p.getX(i) * 32) * 0.008 + Math.cos(p.getY(i) * 37) * 0.004,
    );
  g.computeVertexNormals();
  return g;
}
export function brokenOpening() {
  const shape = new T.Shape();
  shape.moveTo(-0.15, 0);
  shape.lineTo(0.5, 0.35);
  shape.lineTo(0.15, 1.2);
  shape.lineTo(0.65, 1.9);
  shape.lineTo(0.25, 3.4);
  shape.lineTo(-0.2, 3.55);
  shape.closePath();
  return new T.ExtrudeGeometry(shape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.025,
    bevelSegments: 3,
    steps: 2,
  });
}
export function ruinedWall(size: V3, seed: number) {
  const key = `ruin-${size}-${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const rng = random(seed),
    [w, h, d] = size,
    s = new T.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2 - 0.1);
  for (let i = 1; i <= 40; i++)
    s.lineTo(
      w / 2 - (w * i) / 40,
      h / 2 - (rng() > 0.8 ? 0.2 + rng() * 0.6 : rng() * 0.13),
    );
  s.closePath();
  const g = new T.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    bevelSegments: 3,
    steps: 1,
  });
  g.translate(0, 0, -d / 2);
  cache.set(key, g);
  return g;
}
