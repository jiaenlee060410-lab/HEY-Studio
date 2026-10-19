import { random } from "./materials";
export type Rect = { x: [number, number]; z: [number, number] };
export type ScatterPoint = {
  x: number;
  z: number;
  yaw: number;
  scale: number;
  tilt: number;
};
// Reproducible placements: remounting/resetting does not rearrange the puzzle.
// Keep exclusions wider than the prop radius, especially at clues and doors.
export function scatter(
  region: Rect,
  count: number,
  seed: number,
  exclusions: Rect[] = [],
  clearance = 0.4,
): ScatterPoint[] {
  const rng = random(seed),
    result: ScatterPoint[] = [];
  for (
    let attempt = 0;
    result.length < count && attempt < count * 100;
    attempt++
  ) {
    const x = region.x[0] + rng() * (region.x[1] - region.x[0]);
    const z = region.z[0] + rng() * (region.z[1] - region.z[0]);
    if (
      exclusions.some(
        (b) =>
          x > b.x[0] - clearance &&
          x < b.x[1] + clearance &&
          z > b.z[0] - clearance &&
          z < b.z[1] + clearance,
      )
    )
      continue;
    result.push({
      x,
      z,
      yaw: rng() * Math.PI * 2,
      scale: 0.75 + rng() * 0.5,
      tilt: (rng() - 0.5) * 0.4,
    });
  }
  return result;
}
