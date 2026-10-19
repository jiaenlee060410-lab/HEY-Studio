import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as T from "three";
import { useGame } from "../game/store";
import { targets, type V3 } from "./layout";
import { chipped, tube } from "./geometry";
import { material } from "./materials";
import { Door, KeyMesh, SolidMesh, Stairwell } from "./Architecture";
import { Label, Rebar, Ticket, ArchivePhoto } from "./Details";
import { DreamProjector } from "./ProjectorSystem";
import { ScarClutter } from "./ClutterSpawner";
import { ScarDetails } from "./ScarDetails";
import { DreamEffects } from "./DreamEffects";

function EndWall({ z, y, gap }: { z: number; y: number; gap: number }) {
  const left = gap - 1.2,
    right = gap + 1.2;
  return (
    <>
      <SolidMesh p={[(-10 + left) / 2, y + 3, z]} size={[left + 10, 6, 0.45]} />
      <SolidMesh
        p={[(right + 10) / 2, y + 3, z]}
        size={[10 - right, 6, 0.45]}
      />
      <SolidMesh p={[gap, y + 4.65, z]} size={[2.4, 2.7, 0.45]} />
    </>
  );
}
function Shell({
  y,
  north,
  south,
  dream = false,
}: {
  y: number;
  north: number;
  south: number;
  dream?: boolean;
}) {
  return (
    <>
      <SolidMesh p={[0, y - 0.18, 0]} size={[20, 0.36, 40]} kind="floor" />
      {dream ? (
        <>
          <SolidMesh p={[-10, y + 0.7, 0]} size={[0.45, 1.4, 40]} />
          <SolidMesh p={[-10, y + 5.7, 0]} size={[0.45, 0.6, 40]} />
          {[-13.5, 13.5].map((z) => (
            <SolidMesh key={z} p={[-10, y + 3.4, z]} size={[0.45, 4, 13]} />
          ))}
          <Rebar p={[-9.9, y + 1.4, -6.8]} />
          <Rebar p={[-9.9, y + 1.4, 6.4]} />
        </>
      ) : (
        <SolidMesh p={[-10, y + 3, 0]} size={[0.45, 6, 40]} />
      )}
      <SolidMesh p={[10, y + 3, 0]} size={[0.45, 6, 40]} />
      <EndWall z={-20} y={y} gap={north} />
      <EndWall z={20} y={y} gap={south} />
      <SolidMesh p={[0, y + 6.3, 0]} size={[20, 0.3, 40]} />
      {[-14, -2, 11].flatMap((z) =>
        [-7.6, 6.2].map((x) => (
          <SolidMesh
            key={x + ":" + z}
            p={[x, y + 3, z]}
            size={[0.85, 6, 0.85]}
          />
        )),
      )}
      {[-16, -8, 0, 8, 16].map((z) => (
        <SolidMesh key={z} p={[0, y + 5.95, z]} size={[20, 0.35, 0.5]} />
      ))}
    </>
  );
}
function EmergencyLight({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <SolidMesh p={[0, 0, 0]} size={[0.7, 0.22, 0.24]} kind="rust" />
      <mesh position={[0, -0.08, 0.13]} geometry={chipped([0.55, 0.1, 0.025])}>
        <meshStandardMaterial
          color="#c7d7da"
          emissive="#b6ccd3"
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight
        position={[0, -0.2, 0.35]}
        color="#adbed2"
        intensity={26}
        distance={14}
        decay={2}
      />
    </group>
  );
}
function ArchiveDesk() {
  const open = useGame((s) => s.drawerOpen),
    key = useGame((s) => s.key2Found),
    map = useGame((s) => s.hasMap);
  const drawer = useRef<RapierRigidBody>(null),
    offset = useRef(0);
  useFrame((_, dt) => {
    offset.current = T.MathUtils.damp(
      offset.current,
      open ? 0.8 : 0,
      3,
      Math.min(dt, 0.1),
    );
    drawer.current?.setNextKinematicTranslation({
      x: 0.65,
      y: 7.72,
      z: -3.65 + offset.current,
    });
  });
  return (
    <>
      <SolidMesh p={[0, 8.08, -4]} size={[2.4, 0.16, 1.35]} kind="wood" />
      {[-1, 1].flatMap((x) =>
        [-4.5, -3.5].map((z) => (
          <SolidMesh
            key={x + ":" + z}
            p={[x, 7.54, z]}
            size={[0.13, 1.08, 0.13]}
            kind="wood"
          />
        )),
      )}
      <RigidBody
        ref={drawer}
        type="kinematicPosition"
        colliders={false}
        position={[0.65, 7.72, -3.65]}
      >
        <mesh
          geometry={chipped([0.7, 0.08, 0.75])}
          material={material("wood")}
          receiveShadow
        />
        <mesh
          position={[0, 0.12, 0.4]}
          geometry={chipped([0.78, 0.3, 0.09])}
          material={material("wood")}
          castShadow
        />
        <CuboidCollider args={[0.35, 0.04, 0.375]} />
        <CuboidCollider args={[0.39, 0.15, 0.045]} position={[0, 0.12, 0.4]} />
        {open && !key && <KeyMesh p={[0, 0.08, 0]} />}
      </RigidBody>
      {!map && <Ticket p={[0, 8.18, -4]} />}
      <Label
        p={[0, 9.4, -5.6]}
        size={[2.4, 0.5]}
        lines={["ARCHIVE / 03", "RETURN THE FRAGMENTS"]}
      />
      <SolidMesh p={[0, 8.1, -5.72]} size={[3, 2.2, 0.18]} kind="wood" />
    </>
  );
}
function FallenCabinet() {
  return (
    <group position={[-8, 7, -12]}>
      {/* Open lower cavity leaves the floor fragment visible and reachable while crouched. */}
      <SolidMesh
        p={[0, 0.62, -0.45]}
        size={[2.5, 1.1, 0.16]}
        kind="rust"
        rotation={[0.12, 0, 0]}
      />
      <SolidMesh
        p={[0, 1.02, 0.35]}
        size={[2.5, 0.16, 1.5]}
        kind="rust"
        rotation={[0, 0, 0.04]}
      />
      {[-1.15, 1.15].map((x) => (
        <SolidMesh
          key={x}
          p={[x, 0.47, 0.15]}
          size={[0.16, 0.94, 1.2]}
          kind="rust"
        />
      ))}
      <SolidMesh
        p={[1.6, 0.2, -0.2]}
        size={[0.9, 0.16, 1.3]}
        kind="rust"
        rotation={[0, 0.3, 0.3]}
      />
    </group>
  );
}
function Sandbags() {
  const cloth = useMemo(() => {
    const m = material("canvas").clone();
    m.color.set("#a8a68c");
    m.sheen = 0.15;
    return m;
  }, []);
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const p: V3 = [
          6.8 + (i % 4) * 0.7,
          7.2 + Math.floor(i / 4) * 0.32,
          -1.15,
        ];
        return (
          <RigidBody
            key={i}
            type="fixed"
            colliders={false}
            position={p}
            rotation={[0, 0, (i % 2 ? 1 : -1) * 0.07]}
          >
            <mesh
              geometry={chipped([0.8, 0.38, 0.6], i, true)}
              material={cloth}
              castShadow
            />
            <CuboidCollider args={[0.4, 0.19, 0.3]} />
            <mesh
              geometry={tube(
                [
                  [-0.32, 0.07, 0.29],
                  [0, 0.12, 0.3],
                  [0.32, 0.07, 0.29],
                ],
                0.006,
              )}
              material={material("paper")}
            />
          </RigidBody>
        );
      })}
    </>
  );
}
export function Scar() {
  const pieces = useGame((s) => s.hasPhotoFragments);
  return (
    <>
      <Shell y={7} north={1.5} south={-5.5} />
      <Door p={[1.5, 7, -20]} flag="entry3Open" label="03 / SCAR" />
      <Door p={[-5.5, 7, 20]} flag="exit3Open" label="04 / DREAM" swing={-1} />
      <ArchiveDesk />
      <FallenCabinet />
      <Sandbags />
      <ScarClutter />
      <ScarDetails />
      <EmergencyLight p={[0, 11.8, -4]} />
      <SolidMesh p={[-8.3, 8.07, 14]} size={[2, 0.16, 0.8]} kind="wood" />
      <SolidMesh p={[-8.3, 7.53, 14]} size={[1.4, 1.05, 0.55]} kind="wood" />
      <SolidMesh p={[-3.5, 8.25, 4]} size={[11.5, 2.5, 0.4]} />
      <SolidMesh p={[4.5, 8.5, -9]} size={[6, 3, 0.4]} />
      <Rebar p={[-2, 9.3, 4]} />
      {targets
        .filter((t) => t.id.startsWith("fragment"))
        .map(
          (t, i) => !pieces[i] && <ArchivePhoto key={t.id} p={t.p} part={i} />,
        )}
      {[-15, -4, 8, 16].map((z, i) => (
        <EmergencyLight key={z} p={[i % 2 ? -5 : 5, 11.5, z]} />
      ))}
      <Label
        p={[-3, 10, 19.7]}
        rotation={[0, Math.PI, 0]}
        size={[2, 0.5]}
        lines={["SCAR", "↑ 04 DREAM"]}
      />
    </>
  );
}
export function Dream() {
  return (
    <>
      <Shell y={14} north={5.5} south={-1.5} dream />
      <DreamEffects />
      <Door p={[-1.5, 14, 20]} flag="entry4Open" label="04 / DREAM" swing={1} />
      <Door p={[5.5, 14, -20]} flag="exit4Open" label="05 / STAGE" swing={1} />
      <DreamProjector />
      {[-6, 6].map((x) => (
        <group key={x}>
          <SolidMesh p={[x, 14.9, -8]} size={[2.2, 1.8, 1.1]} kind="wood" />
          <SolidMesh
            p={[x, 15.9, -8]}
            size={[2.3, 0.25, 1.3]}
            kind="rust"
            rotation={[0.15, 0, 0]}
          />
          <Label
            p={[x, 16, -7.28]}
            size={[1.7, 0.6]}
            lines={["CHANNEL " + (x < 0 ? "A" : "B"), "MEMORY / SIGNAL"]}
          />
          <pointLight
            position={[x, 17, -7]}
            color="#777bbb"
            intensity={22}
            distance={14}
          />
        </group>
      ))}
      <EmergencyLight p={[-4, 18.5, 15]} />
      <SolidMesh p={[5.5, 13.85, -21.5]} size={[2.4, 0.3, 3]} />
      <SolidMesh p={[4.15, 15.5, -21.5]} size={[0.25, 3, 3]} />
      <SolidMesh p={[6.85, 15.5, -21.5]} size={[0.25, 3, 3]} />
      <SolidMesh p={[5.5, 15.5, -23]} size={[2.7, 3, 0.25]} />
    </>
  );
}
export function UpperFloors() {
  const session = useGame((s) => s.session);
  const floor = useGame((s) => s.floor);
  return (
    <group key={session}>
      <group visible={floor !== 4}>
        <Stairwell />
      </group>
      <group visible={floor === 3}>
        <Scar />
      </group>
      <group visible={floor !== 2}>
        <Stairwell upper />
      </group>
      <group visible={floor === 4}>
        <Dream />
      </group>
      {targets.map((t) => (
        <RigidBody
          key={t.id}
          type="fixed"
          colliders={false}
          userData={{ id: t.id }}
        >
          <CuboidCollider
            sensor
            position={t.p}
            args={[t.size[0] / 2, t.size[1] / 2, t.size[2] / 2]}
          />
        </RigidBody>
      ))}
    </group>
  );
}
