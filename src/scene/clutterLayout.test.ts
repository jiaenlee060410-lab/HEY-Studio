import { expect, it } from "vitest";
import { scatter } from "./clutterLayout";
it("is reproducible and keeps all prop centers inside the region and out of clue buffers", () => {
  const region = {
    x: [-9, 9] as [number, number],
    z: [-18, 18] as [number, number],
  };
  const exclusions = [
    { x: [-2, 2] as [number, number], z: [-18, 18] as [number, number] },
  ];
  const points = scatter(region, 400, 842, exclusions, 0.8);
  expect(points).toHaveLength(400);
  expect(points).toEqual(scatter(region, 400, 842, exclusions, 0.8));
  for (const p of points) {
    expect(Math.abs(p.x)).toBeGreaterThanOrEqual(2.8);
    expect(Math.abs(p.x)).toBeLessThanOrEqual(9);
    expect(Math.abs(p.z)).toBeLessThanOrEqual(18);
  }
});
it("stops safely instead of looping forever when an area is entirely excluded", () => {
  const region = {
    x: [0, 1] as [number, number],
    z: [0, 1] as [number, number],
  };
  expect(scatter(region, 10, 1, [region])).toEqual([]);
});
