import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as T from "three";
import { chipped, tube } from "./geometry";
import { material, type Surface } from "./materials";
import { Label } from "./Details";
import { useGame } from "../game/store";
import type { V3 } from "./layout";

// Mesh and blocking volume share transforms and dimensions. No invisible ramps.
export function SolidMesh({
  p,
  size,
  kind = "concrete",
  rotation = [0, 0, 0],
  soft = false,
}: {
  p: V3;
  size: V3;
  kind?: Surface;
  rotation?: V3;
  soft?: boolean;
}) {
  return (
    <RigidBody type="fixed" colliders={false} position={p} rotation={rotation}>
      <mesh
        geometry={chipped(size, 11, soft)}
        material={material(kind)}
        castShadow
        receiveShadow
      />
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  );
}
export function KeyMesh({ p }: { p: V3 }) {
  return (
    <group position={p} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh
        geometry={tube(
          [
            [0, -0.12, 0],
            [0, 0.08, 0],
            [0.06, 0.12, 0],
            [0, 0.18, 0],
            [-0.06, 0.12, 0],
            [0, 0.08, 0],
          ],
          0.014,
        )}
        material={material("rust")}
        castShadow
      />
      <mesh
        geometry={tube(
          [
            [0, -0.1, 0],
            [0.06, -0.1, 0],
            [0.06, -0.055, 0],
          ],
          0.014,
        )}
        material={material("rust")}
        castShadow
      />
    </group>
  );
}
type DoorFlag =
  "exit2Open" | "entry3Open" | "exit3Open" | "entry4Open" | "exit4Open";
export function Door({
  p,
  flag,
  label,
  swing = -1,
}: {
  p: V3;
  flag: DoorFlag;
  label: string;
  swing?: number;
}) {
  const open = useGame((s) => s[flag]),
    session = useGame((s) => s.session);
  const body = useRef<RapierRigidBody>(null),
    angle = useRef(0),
    lastSession = useRef(session);
  useFrame((_, dt) => {
    if (lastSession.current !== session) {
      angle.current = 0;
      lastSession.current = session;
      body.current?.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    }
    angle.current = T.MathUtils.damp(
      angle.current,
      open ? swing * 1.53 : 0,
      3,
      Math.min(dt, 0.1),
    );
    body.current?.setNextKinematicRotation(
      new T.Quaternion().setFromAxisAngle(
        new T.Vector3(0, 1, 0),
        angle.current,
      ),
    );
  });
  return (
    <group position={p}>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[-1.15, 0, 0]}
      >
        <mesh
          position={[1.15, 1.5, 0]}
          geometry={chipped([2.3, 3, 0.14], 22)}
          material={material("wood")}
          castShadow
          receiveShadow
        />
        <CuboidCollider position={[1.15, 1.5, 0]} args={[1.15, 1.5, 0.07]} />
        <mesh
          position={[2, 1.3, 0.12]}
          geometry={tube(
            [
              [0, 0, 0],
              [0, 0.14, 0],
              [-0.16, 0.14, 0],
            ],
            0.025,
          )}
          material={material("rust")}
        />
        <Label p={[1.15, 2.2, 0.09]} size={[1.35, 0.32]} lines={[label]} />
        <Label
          p={[1.15, 2.2, -0.09]}
          rotation={[0, Math.PI, 0]}
          size={[1.35, 0.32]}
          lines={[label]}
        />
      </RigidBody>
      <Label p={[0, 3.35, 0.26]} size={[2.2, 0.35]} lines={[label]} />
      <Label
        p={[0, 3.35, -0.26]}
        rotation={[0, Math.PI, 0]}
        size={[2.2, 0.35]}
        lines={[label]}
      />
    </group>
  );
}

// 40 true 17.5 cm risers, 32 cm treads. Separate return gallery at the upper level.
// Top/bottom platforms overlap tread edges by millimetres to avoid collision seams.
export function Stairwell({ upper = false }: { upper?: boolean }) {
  const y = upper ? 7 : 0,
    sign = upper ? 1 : -1,
    x = upper ? -5.5 : 5.5,
    back = upper ? -1.5 : 1.5;
  const z = (d: number) => sign * d;
  return (
    <group>
      <SolidMesh p={[x, y - 0.15, z(20.5)]} size={[2.4, 0.3, 1.05]} />
      {Array.from({ length: 40 }, (_, i) => {
        const h = (i + 1) * 0.175;
        return (
          <SolidMesh
            key={i}
            p={[x, y + h / 2, z(21 + (i + 0.5) * 0.32)]}
            size={[2.4, h, 0.322]}
          />
        );
      })}
      <SolidMesh
        p={[(x + back) / 2, y + 6.85, z(34.55)]}
        size={[6.4, 0.3, 1.5]}
      />
      <SolidMesh p={[back, y + 6.85, z(27)]} size={[2.4, 0.3, 14]} />
      {/* Full-height enclosure and return-gallery guard prevent falling out at either elevation. */}
      <SolidMesh
        p={[x + (upper ? -1.35 : 1.35), y + 5, z(27.7)]}
        size={[0.25, 10, 15.6]}
      />
      <SolidMesh
        p={[back + (upper ? 1.35 : -1.35), y + 8.5, z(27.7)]}
        size={[0.25, 3, 15.6]}
      />
      <SolidMesh p={[(x + back) / 2, y + 8.5, z(35.4)]} size={[6.9, 3, 0.25]} />
      <SolidMesh
        p={[x + (upper ? 1.35 : -1.35), y + 5, z(26.8)]}
        size={[0.25, 10, 13.5]}
      />
      <SolidMesh
        p={[back + (upper ? -1.35 : 1.35), y + 8.5, z(26.8)]}
        size={[0.25, 3, 13.5]}
      />
      <SolidMesh
        p={[(x + back) / 2, y + 10.1, z(27.6)]}
        size={[6.9, 0.2, 15.8]}
      />
      {/* Rail follows the incline and is an actual collider-backed swept mesh. */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh
          geometry={tube(
            [
              [x + (upper ? 1.05 : -1.05), y + 1, z(21)],
              [x + (upper ? 1.05 : -1.05), y + 8, z(33.8)],
            ],
            0.035,
          )}
          material={material("rust")}
        />
      </RigidBody>
      {[23, 29, 34].map((d) => (
        <group key={d}>
          <pointLight
            position={[(x + back) / 2, y + 8.8, z(d)]}
            color="#bdc5c1"
            intensity={10}
            distance={11}
            decay={2}
          />
          <SolidMesh
            p={[(x + back) / 2, y + 9.8, z(d)]}
            size={[0.6, 0.1, 0.2]}
            kind="rust"
          />
        </group>
      ))}
      <Label
        p={[(x + back) / 2, y + 8.8, z(35.23)]}
        rotation={[0, upper ? Math.PI : 0, 0]}
        size={[3, 0.65]}
        lines={[upper ? "04 / DREAM" : "03 / SCAR", "RETURN GALLERY →"]}
      />
    </group>
  );
}
