import { useEffect, useMemo, useRef } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { chipped, cup, fragment, paper, tube } from "./geometry";
import { material, random, type Surface } from "./materials";
import { scatter, type Rect } from "./clutterLayout";
import { chairs, solids, targets, type V3 } from "./layout";
import { lettering } from "./Details";

export type ClutterKind =
  | "PaperCup"
  | "PopcornBucket"
  | "Popcorn"
  | "OldPoster"
  | "OldChair"
  | "Sandbag"
  | "ShellCasing"
  | "ConcreteDebris"
  | "Plaster";
const models = new Map<ClutterKind, T.BufferGeometry>();
function model(kind: ClutterKind) {
  if (models.has(kind)) return models.get(kind)!;
  let g: T.BufferGeometry;
  if (kind === "PaperCup") g = cup();
  else if (kind === "OldPoster") g = paper().scale(3, 4, 1);
  else if (kind === "PopcornBucket") {
    const profile = Array.from(
      { length: 22 },
      (_, i) => new T.Vector2(0.1 + i * 0.0032, i * 0.014),
    );
    g = new T.LatheGeometry(profile, 40);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i),
        angle = Math.atan2(p.getZ(i), p.getX(i));
      p.setXYZ(
        i,
        p.getX(i) * (0.7 + 0.2 * Math.cos(y * 18 + angle * 3)),
        y,
        p.getZ(i) * 0.5 + 0.025 * Math.sin(y * 21),
      );
    }
    g.computeVertexNormals();
  } else if (kind === "ShellCasing") {
    // Hollow neck, rim and closed spent base; lathed high-resolution mesh.
    g = new T.LatheGeometry(
      [
        [0, 0],
        [0.007, 0],
        [0.007, 0.003],
        [0.0055, 0.004],
        [0.0055, 0.034],
        [0.0045, 0.042],
        [0.0045, 0.05],
        [0.0035, 0.05],
        [0.0035, 0.044],
      ].map((p) => new T.Vector2(...(p as [number, number]))),
      24,
    );
  } else if (kind === "Sandbag") {
    const body = chipped([0.82, 0.32, 0.48], 21, true).clone();
    const seam = tube(
      [
        [-0.36, 0, 0.24],
        [-0.1, 0.07, 0.25],
        [0.3, 0.02, 0.24],
        [0.4, 0, 0.1],
      ],
      0.008,
    ).clone();
    g = mergeGeometries([body.toNonIndexed(), seam.toNonIndexed()])!;
    body.dispose();
    seam.dispose();
  } else if (kind === "OldChair") {
    const parts: T.BufferGeometry[] = [];
    parts.push(chipped([0.53, 0.07, 0.51], 4).clone().translate(0, 0.5, 0));
    for (const x of [-0.22, 0.22])
      for (const z of [-0.21, 0.21])
        parts.push(
          chipped([0.045, z > 0 ? 1.02 : 0.5, 0.045], 9)
            .clone()
            .translate(x, z > 0 ? 0.51 : 0.25, z),
        );
    for (const y of [0.76, 0.91])
      parts.push(chipped([0.5, 0.07, 0.04], 5).clone().translate(0, y, 0.21));
    const copies = parts.map((p) => (p.index ? p.toNonIndexed() : p));
    g = mergeGeometries(copies)!;
    new Set([...parts, ...copies]).forEach((p) => p.dispose());
  } else {
    g = fragment(kind === "ConcreteDebris" ? 218 : 88);
    const scale = kind === "Popcorn" ? 0.025 : kind === "Plaster" ? 0.2 : 0.25;
    g.scale(
      scale,
      kind === "Popcorn" ? 0.005 : kind === "Plaster" ? 0.025 : scale,
      scale,
    );
  }
  g.computeBoundingBox();
  models.set(kind, g);
  return g;
}
const kinds: Record<ClutterKind, Surface> = {
  PaperCup: "paper",
  PopcornBucket: "paper",
  Popcorn: "paper",
  OldPoster: "paper",
  OldChair: "wood",
  Sandbag: "canvas",
  ShellCasing: "brass",
  ConcreteDebris: "concrete",
  Plaster: "concrete",
};
export function ClutterSpawner({
  kind,
  region,
  count,
  seed,
  y = 0,
  exclusions = [],
  wall = false,
}: {
  kind: ClutterKind;
  region: Rect;
  count: number;
  seed: number;
  y?: number;
  exclusions?: Rect[];
  wall?: boolean;
}) {
  const mesh = useRef<T.InstancedMesh>(null),
    geometry = useMemo(() => model(kind), [kind]);
  const placements = useMemo(() => {
    const points = scatter(
      region,
      count,
      seed,
      exclusions,
      kind === "OldChair" ? 0.8 : 0.32,
    );
    const dummy = new T.Object3D(),
      rng = random(seed + 9);
    return points.map((p) => {
      const tipped = [
        "PaperCup",
        "PopcornBucket",
        "OldChair",
        "ShellCasing",
      ].includes(kind);
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(
        wall
          ? 0
          : kind === "OldPoster"
            ? -Math.PI / 2
            : tipped
              ? Math.PI / 2 + p.tilt
              : p.tilt * 0.2,
        wall ? -Math.PI / 2 : p.yaw,
        wall ? p.tilt : 0,
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      const box = geometry.boundingBox!.clone().applyMatrix4(dummy.matrix);
      dummy.position.y = wall ? y + rng() * 1.8 : y - box.min.y + 0.006;
      dummy.updateMatrix();
      const finalBox = geometry.boundingBox!.clone().applyMatrix4(dummy.matrix);
      const center = new T.Vector3(),
        size = new T.Vector3();
      finalBox.getCenter(center);
      finalBox.getSize(size);
      return {
        matrix: dummy.matrix.clone(),
        p: center.toArray() as V3,
        size: size.toArray() as V3,
      };
    });
  }, [geometry, kind, region, count, seed, y, exclusions, wall]);
  const mat = useMemo(() => {
    if (kind !== "OldPoster" && kind !== "PopcornBucket")
      return material(kinds[kind]);
    const m = material("paper").clone();
    m.map = lettering(
      kind === "OldPoster"
        ? ["CINEMA / 1975", "LE DERNIER SOIR", "BEYROUTH"]
        : ["CINEMA", "POP CORN", "1975"],
    );
    return m;
  }, [kind]);
  useEffect(
    () => () => {
      if (kind === "OldPoster" || kind === "PopcornBucket") {
        mat.map?.dispose();
        mat.dispose();
      }
    },
    [mat, kind],
  );
  useEffect(() => {
    if (!mesh.current) return;
    placements.forEach((p, i) => mesh.current!.setMatrixAt(i, p.matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [placements]);
  return (
    <>
      <instancedMesh
        ref={mesh}
        args={[geometry, mat, placements.length]}
        castShadow={kind === "OldChair" || kind === "Sandbag"}
        receiveShadow
      />
      <RigidBody type="fixed" colliders={false}>
        {placements.map((p, i) => (
          <CuboidCollider
            key={i}
            position={p.p}
            args={[
              Math.max(0.004, p.size[0] / 2),
              Math.max(0.004, p.size[1] / 2),
              Math.max(0.004, p.size[2] / 2),
            ]}
          />
        ))}
      </RigidBody>
    </>
  );
}
const floorRegion: Rect = { x: [-9.1, 9.1], z: [-18.5, 18.5] };
const clueClearance = (y: number): Rect[] =>
  targets
    .filter((t) => Math.abs(t.p[1] - y) < 3)
    .map((t) => ({
      x: [t.p[0] - 1.6, t.p[0] + 1.6],
      z: [t.p[2] - 1.8, t.p[2] + 1.8],
    }));
const cinemaExclusions: Rect[] = [
  ...clueClearance(0),
  ...solids.map((s) => ({
    x: [s.p[0] - s.size[0] / 2, s.p[0] + s.size[0] / 2] as [number, number],
    z: [s.p[2] - s.size[2] / 2, s.p[2] + s.size[2] / 2] as [number, number],
  })),
  ...chairs.map((c) => ({
    x: [c.p[0] - 0.6, c.p[0] + 0.6] as [number, number],
    z: [c.p[2] - 0.5, c.p[2] + 0.6] as [number, number],
  })),
  { x: [4.3, 8], z: [-15, -10.5] },
];
const scarExclusions: Rect[] = [
  ...clueClearance(7),
  { x: [-9.3, 2.3], z: [3.4, 4.6] },
  { x: [1.4, 7.6], z: [-9.6, -8.4] },
  { x: [-2, 2], z: [-6, -2] },
  { x: [-9.4, -6.5], z: [-13.2, -10.4] },
  ...[-14, -2, 11].flatMap((z) =>
    [-7.6, 6.2].map((x) => ({
      x: [x - 0.6, x + 0.6] as [number, number],
      z: [z - 0.6, z + 0.6] as [number, number],
    })),
  ),
];
const posterRegion: Rect = { x: [9.73, 9.73], z: [-17, 17] };
const cinemaTypes: [ClutterKind, number][] = [
  ["PaperCup", 65],
  ["PopcornBucket", 24],
  ["Popcorn", 240],
  ["ConcreteDebris", 90],
  ["OldChair", 8],
];
const scarTypes: [ClutterKind, number][] = [
  ["Sandbag", 24],
  ["ShellCasing", 180],
  ["ConcreteDebris", 135],
  ["Plaster", 45],
];
export function CinemaClutter() {
  return (
    <>
      {cinemaTypes.map(([kind, count], i) => (
        <ClutterSpawner
          key={kind}
          kind={kind}
          count={count}
          region={floorRegion}
          seed={470 + i}
          exclusions={cinemaExclusions}
        />
      ))}
      <ClutterSpawner
        kind="OldPoster"
        count={9}
        region={posterRegion}
        seed={937}
        y={1.2}
        wall
      />
    </>
  );
}
export function ScarClutter() {
  return (
    <>
      {scarTypes.map(([kind, count], i) => (
        <ClutterSpawner
          key={kind}
          kind={kind}
          count={count}
          region={floorRegion}
          seed={810 + i}
          exclusions={scarExclusions}
          y={7}
        />
      ))}
    </>
  );
}
