import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as T from "three";
import { chipped, cup, fragment, paper, tube } from "./geometry";
import { material, random } from "./materials";
import type { V3 } from "./layout";
import { assets, assetURL } from "../game/assets";

export function ArchivePhoto({ p, part }: { p: V3; part?: number }) {
  const source = useTexture(
    assetURL(assets.historicalPhoto || "assets/archive-study.svg"),
  );
  const map = useMemo(() => {
    const t = source.clone();
    t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [source]);
  const geometry = useMemo(() => {
    const g = paper(),
      uv = g.attributes.uv;
    if (part !== undefined)
      for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) + part) / 3);
    return g;
  }, [part]);
  useEffect(
    () => () => {
      map.dispose();
      geometry.dispose();
    },
    [map, geometry],
  );
  return (
    <mesh
      position={p}
      rotation={[-Math.PI / 2, 0, 0.15]}
      scale={[part === undefined ? 1 : 0.4, 1, 1]}
      geometry={geometry}
      receiveShadow
    >
      <meshStandardMaterial
        map={map}
        normalMap={material("paper").normalMap}
        roughness={0.95}
        side={T.DoubleSide}
      />
    </mesh>
  );
}

export function drawSymbol(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  c.beginPath();
  c.moveTo(x, y - size * 0.5);
  c.lineTo(x - size * 0.42, y + size * 0.35);
  c.lineTo(x + size * 0.42, y + size * 0.35);
  c.closePath();
  c.moveTo(x - size * 0.6, y);
  c.lineTo(x + size * 0.6, y);
  c.moveTo(x + size * 0.12, y - size * 0.63);
  c.lineTo(x + size * 0.12, y + size * 0.55);
  c.stroke();
}
export function lettering(lines: string[], symbol = false, graffiti = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext("2d")!;
  const rng = random(182);
  if (!graffiti) {
    c.fillStyle = "#a69b7c";
    c.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 10000; i++) {
      c.fillStyle = `rgba(35,29,21,${rng() * 0.16})`;
      c.fillRect(rng() * 1024, rng() * 512, 2 + rng() * 5, 2);
    }
  }
  c.fillStyle = graffiti ? "#9a8a68" : "#302f28";
  c.textAlign = "center";
  c.font = "48px Georgia";
  lines.forEach((l, i) => c.fillText(l, 512, 120 + i * 86));
  if (graffiti) {
    for (let i = 0; i < 35; i++) {
      c.strokeStyle = ["#684e42", "#5b6459", "#8c8570", "#312c29"][i % 4];
      c.lineWidth = 2 + rng() * 5;
      c.beginPath();
      c.moveTo(rng() * 1024, rng() * 512);
      c.bezierCurveTo(
        rng() * 1024,
        rng() * 512,
        rng() * 1024,
        rng() * 512,
        rng() * 1024,
        rng() * 512,
      );
      c.stroke();
    }
  }
  if (symbol) {
    c.strokeStyle = graffiti ? "#c6c1a0" : "#24271e";
    c.lineWidth = 9;
    drawSymbol(c, 512, 280, 270);
  }
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
export function Label({
  p,
  size,
  lines,
  rotation = [0, 0, 0],
  symbol = false,
}: {
  p: V3;
  size: [number, number];
  lines: string[];
  rotation?: V3;
  symbol?: boolean;
}) {
  const map = useMemo(
    () => lettering(lines, symbol),
    [lines.join("|"), symbol],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh
      position={p}
      rotation={rotation}
      geometry={chipped([size[0], size[1], 0.018])}
    >
      <meshStandardMaterial map={map} roughness={0.95} side={T.DoubleSide} />
    </mesh>
  );
}
export function Graffiti({ revealed }: { revealed: boolean }) {
  const wall = useMemo(() => chipped([0.83, 1, 0.04]).clone(), []);
  const original = useMemo(
    () => new Float32Array(wall.attributes.position.array),
    [wall],
  );
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    if (!revealed) {
      elapsed.current = 0;
      return;
    }
    if (elapsed.current > 2.5) return;
    elapsed.current += dt;
    const p = wall.attributes.position,
      t = elapsed.current;
    for (let i = 0; i < p.count; i++) {
      const x = original[i * 3],
        y = original[i * 3 + 1];
      p.setZ(
        i,
        original[i * 3 + 2] +
          Math.exp(-(x * x + y * y) * 15) *
            Math.sin(t * 9) *
            Math.exp(-t * 2) *
            0.035,
      );
    }
    p.needsUpdate = true;
    wall.computeVertexNormals();
  });
  const texture = useMemo(() => lettering([], true, true), []),
    other = useMemo(
      () => lettering(["MEMORA", "WE WERE HERE"], false, true),
      [],
    );
  return (
    <>
      <mesh
        position={[-6, 1.35, -6.28]}
        geometry={wall}
        material={material("concrete")}
        rotation={[0, Math.PI, 0]}
      >
        {!revealed && (
          <Decal position={[0, 0, 0.025]} scale={[0.82, 0.98, 0.15]}>
            <meshPhysicalMaterial
              map={texture}
              transparent
              polygonOffset
              polygonOffsetFactor={-4}
              roughness={0.26}
              metalness={0.42}
              clearcoat={0.65}
            />
          </Decal>
        )}
      </mesh>
      {[-8.5, -3, 0].map((x, i) => (
        <mesh
          key={x}
          position={[x, 1.5 + i * 0.15, -6.285]}
          rotation={[0, Math.PI, 0]}
          geometry={chipped([1.8, 1.5, 0.025])}
          material={material("concrete")}
        >
          <Decal position={[0, 0, 0.02]} scale={[1.8, 1.5, 0.1]}>
            <meshStandardMaterial
              map={other}
              transparent
              polygonOffset
              polygonOffsetFactor={-4}
              roughness={0.9}
            />
          </Decal>
        </mesh>
      ))}
    </>
  );
}
export function Rebar({ p }: { p: V3 }) {
  return (
    <RigidBody type="fixed" colliders="trimesh" position={p}>
      {[0, 0.24, 0.48].map((x, i) => (
        <mesh
          key={x}
          geometry={tube(
            [
              [x, 0, 0],
              [x + 0.04, 0.6, 0.04],
              [x - 0.12, 1.1, 0.1],
              [x + 0.12, 1.5, 0.18],
            ],
            0.014,
          )}
          material={material("rust")}
          castShadow
        />
      ))}
    </RigidBody>
  );
}
export function Debris() {
  const ref = useRef<T.InstancedMesh>(null),
    cups = useRef<T.InstancedMesh>(null),
    corn = useRef<T.InstancedMesh>(null);
  const rubble = useMemo(() => fragment(15), []),
    cupGeometry = useMemo(cup, []),
    cornGeometry = useMemo(() => fragment(117), []);
  // Shared transforms drive both instancing and small blocking volumes.
  const bounds = useMemo(() => {
    const boxes: { p: V3; size: V3 }[] = [];
    [rubble, cupGeometry, cornGeometry].forEach((geometry, type) => {
      geometry.computeBoundingBox();
      const rng = random(84 + type),
        dummy = new T.Object3D();
      for (let i = 0; i < [250, 40, 300][type]; i++) {
        const x = (rng() - 0.5) * 19,
          z = (rng() - 0.5) * 38;
        dummy.position.set(x, type === 0 ? 0.005 : 0.025, z);
        dummy.rotation.set(
          type === 1 ? Math.PI / 2 : 0,
          rng() * 6.28,
          rng() * 0.2,
        );
        const scale =
          type === 0
            ? 0.07 + rng() * 0.22
            : type === 1
              ? 0.8
              : 0.02 + rng() * 0.02;
        dummy.scale.set(scale, type === 2 ? scale * 0.15 : scale, scale);
        dummy.updateMatrix();
        const box = geometry.boundingBox!.clone().applyMatrix4(dummy.matrix),
          p = new T.Vector3(),
          size = new T.Vector3();
        box.getCenter(p);
        box.getSize(size);
        boxes.push({ p: p.toArray() as V3, size: size.toArray() as V3 });
      }
    });
    return boxes;
  }, [rubble, cupGeometry, cornGeometry]);
  const setup = (mesh: T.InstancedMesh | null, type: number) => {
    if (!mesh) return;
    const rng = random(84 + type),
      dummy = new T.Object3D();
    for (let i = 0; i < mesh.count; i++) {
      const x = (rng() - 0.5) * 19,
        z = (rng() - 0.5) * 38;
      dummy.position.set(x, type === 0 ? 0.005 : 0.025, z);
      dummy.rotation.set(
        type === 1 ? Math.PI / 2 : 0,
        rng() * 6.28,
        rng() * 0.2,
      );
      const scale =
        type === 0
          ? 0.07 + rng() * 0.22
          : type === 1
            ? 0.8
            : 0.02 + rng() * 0.02;
      dummy.scale.set(scale, type === 2 ? scale * 0.15 : scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {bounds.map((b, i) => (
          <CuboidCollider
            key={i}
            position={b.p}
            args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]}
          />
        ))}
      </RigidBody>
      <instancedMesh
        ref={(m) => {
          ref.current = m;
          setup(m, 0);
        }}
        args={[rubble, material("concrete"), 250]}
        receiveShadow
      />
      <instancedMesh
        ref={(m) => {
          cups.current = m;
          setup(m, 1);
        }}
        args={[cupGeometry, material("paper"), 40]}
        receiveShadow
      />
      <instancedMesh
        ref={(m) => {
          corn.current = m;
          setup(m, 2);
        }}
        args={[cornGeometry, material("paper"), 300]}
      />
    </>
  );
}
export function Projector() {
  const reel = useMemo(
    () =>
      new T.LatheGeometry(
        [
          new T.Vector2(0.04, 0),
          new T.Vector2(0.35, 0),
          new T.Vector2(0.36, 0.035),
          new T.Vector2(0.05, 0.04),
        ],
        48,
      ),
    [],
  );
  return (
    <group position={[7, 0, -12]}>
      <mesh
        position={[0, 0.5, 0]}
        geometry={chipped([0.55, 1, 0.6])}
        material={material("rust")}
        castShadow
      />
      <mesh
        position={[0, 1.2, 0]}
        geometry={chipped([0.65, 0.55, 0.7])}
        material={material("rust")}
        castShadow
      />
      {[-0.37, 0.37].map((z, i) => (
        <group key={z} position={[0, 1.7, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh geometry={reel} material={material("rust")} />
          {Array.from({ length: 6 }, (_, j) => (
            <mesh
              key={j}
              position={[
                Math.cos((j * Math.PI) / 3) * 0.22,
                0.043,
                Math.sin((j * Math.PI) / 3) * 0.22,
              ]}
              geometry={chipped([0.07, 0.01, 0.07])}
            >
              <meshStandardMaterial color="#191713" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh
        position={[0, 1.22, 0.45]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={tube(
          [
            [0, 0, 0],
            [0, 0.2, 0],
          ],
          0.12,
        )}
        material={material("rust")}
      />
      <mesh
        geometry={tube(
          [
            [0, 0.3, 0],
            [0.6, 0.05, 0.2],
            [0.8, 0.02, 1],
            [1.3, 0.02, 1.4],
          ],
          0.014,
        )}
        material={material("rust")}
      />
    </group>
  );
}
export function Water({ p, scale }: { p: V3; scale: V3 }) {
  const shape = useMemo(() => {
    const s = new T.Shape();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2,
        r = 1 + Math.sin(a * 5) * 0.15 + Math.sin(a * 9) * 0.08;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return new T.ShapeGeometry(s, 32);
  }, []);
  return (
    <mesh
      position={p}
      scale={scale}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={shape}
    >
      <MeshReflectorMaterial
        resolution={256}
        mirror={0.4}
        mixStrength={0.4}
        mixBlur={0.7}
        blur={[128, 64]}
        color="#55564d"
        roughness={0.18}
        metalness={0.2}
        depthScale={0.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  );
}
export function Crumbling({ active }: { active: boolean }) {
  const ref = useRef<T.InstancedMesh>(null),
    clock = useRef(0),
    geometry = useMemo(() => fragment(22), []);
  useFrame((_, dt) => {
    if (!active || !ref.current) return;
    clock.current += dt;
    const t = Math.min(clock.current, 2.5),
      rng = random(18),
      d = new T.Object3D();
    for (let i = 0; i < 35; i++) {
      d.position.set(
        -6 + (rng() - 0.5) * 0.7,
        Math.max(0.03, 1.6 + rng() * 0.4 - t * t * 1.4),
        -6.4 - rng() * 0.35 * t,
      );
      d.scale.setScalar(0.02 + rng() * 0.04);
      d.rotation.set(t * rng() * 4, t, 0);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return active ? (
    <instancedMesh ref={ref} args={[geometry, material("concrete"), 35]} />
  ) : null;
}
export function Ticket({ p }: { p: V3 }) {
  return (
    <mesh
      position={p}
      rotation={[-Math.PI / 2, 0, 0.15]}
      geometry={useMemo(paper, [])}
      material={material("paper")}
      receiveShadow
    />
  );
}
