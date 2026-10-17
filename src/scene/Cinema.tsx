import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as T from "three";
import { useGame } from "../game/store";
import { solids, chairs, targets, type V3 } from "./layout";
import { chipped, tube, brokenOpening, fragment, ruinedWall } from "./geometry";
import { material, featuredVelvet } from "./materials";
import { Atmosphere } from "./Atmosphere";
import {
  Label,
  Graffiti,
  Ticket,
  Water,
  Debris,
  Rebar,
  Projector,
  Crumbling,
} from "./Details";

function Chair({
  p,
  featured = false,
  broken = false,
}: {
  p: V3;
  featured?: boolean;
  broken?: boolean;
}) {
  const cloth = useMemo(
    () => (featured ? featuredVelvet() : material("velvet")),
    [featured],
  );
  return (
    <group position={p}>
      <mesh
        position={[0, 0.51, 0]}
        rotation={[0, 0, broken ? 0.13 : 0]}
        geometry={chipped([0.82, 0.22, 0.73], 4, true)}
        material={cloth}
        castShadow
        receiveShadow
      />
      <mesh
        position={[0, 0.99, 0.32]}
        rotation={[broken ? 0.58 : -0.08, 0, broken ? 0.16 : 0]}
        geometry={chipped([0.85, 0.85, 0.19], broken ? 18 : 3, true)}
        material={cloth}
        castShadow
        receiveShadow
      />
      <group position={[0,0.99,0.32]} rotation={[broken ? .58 : -.08,0,broken ? .16 : 0]}>
        <mesh geometry={tube([[-.34,-.32,-.103],[-.37,.25,-.103],[-.29,.36,-.103],[.29,.36,-.103],[.37,.25,-.103],[.34,-.32,-.103]],.006)} material={material('velvet')}/>
        {[-.14,.14].map(x=><mesh key={x} geometry={tube([[x,-.25,-.102],[x,.1,-.105],[x,.3,-.102]],.003)} material={material('velvet')}/>)}
      </group>
      {[-0.5, 0.5].map((x) => (
        <group key={x}>
          <mesh
            geometry={tube(
              [
                [x, 0.04, 0.25],
                [x, 0.35, 0.25],
                [x, 0.7, 0.3],
                [x, 0.7, -0.32],
              ],
              0.022,
            )}
            material={material("rust")}
            castShadow
          />
          <mesh
            position={[x, 0.73, -0.02]}
            geometry={chipped([0.12, 0.1, 0.62], 3, true)}
            material={material("wood")}
            castShadow
          />
        </group>
      ))}
      {broken && (
        <mesh
          position={[0.1, 0.55, -0.32]}
          geometry={chipped([0.19, 0.04, 0.12], 9)}
          material={material("paper")}
        />
      )}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[0, 0.35, 0]} args={[0.57, 0.35, 0.48]} />
        <CuboidCollider position={[0, 1, 0.32]} args={[0.47, 0.45, 0.16]} />
      </RigidBody>
    </group>
  );
}
function Exit() {
  const open = useGame((s) => s.exitDoorUnlocked),
    hinge = useRef<T.Group>(null);
  useFrame((_, dt) => {
    if (hinge.current)
      hinge.current.rotation.y = T.MathUtils.damp(
        hinge.current.rotation.y,
        open ? -1.45 : 0,
        2,
        dt,
      );
  });
  return (
    <group position={[4.5, 0, -19.55]}>
      <group ref={hinge}>
        <mesh
          position={[1, 1.5, 0]}
          geometry={chipped([2, 3, 0.12])}
          material={material("wood")}
          castShadow
        />
        <mesh
          position={[1.8, 1.3, 0.11]}
          geometry={tube(
            [
              [0, 0, 0],
              [0, 0.12, 0],
              [0.1, 0.12, 0],
            ],
            0.025,
          )}
          material={material("rust")}
        />
      </group>
      <Label p={[1, 3.25, 0.02]} size={[2, 0.32]} lines={["5F / STAGE"]} />
    </group>
  );
}
export function Cinema() {
  const s = useGame(),
    opened = useMemo(brokenOpening, []),
    stone = useMemo(() => fragment(47), []);
  return (
    <>
      <Atmosphere />
      <mesh
        position={[0, -0.13, 0]}
        geometry={chipped([20, 0.26, 40])}
        material={material("floor", 5, 10)}
        receiveShadow
      />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[10, 0.2, 20]} position={[0, -0.2, 0]} />
      </RigidBody>
      {solids.map((b) => (
        <group key={b.id} position={b.p}>
          <mesh
            geometry={
              b.id.startsWith("bend")
                ? ruinedWall(b.size, b.id.length)
                : chipped(b.size, b.id.length)
            }
            material={material(
              b.kind === "counter"
                ? "wood"
                : b.kind === "cabinet"
                  ? "rust"
                  : b.kind === "screen"
                    ? "paper"
                    : "concrete",
              b.id.startsWith("bend")
                ? 0.25
                : Math.max(1, Math.max(b.size[0], b.size[2]) / 4),
              b.id.startsWith("bend") ? 0.25 : Math.max(1, b.size[1] / 4),
            )}
            castShadow
            receiveShadow
          />
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider
              args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]}
            />
          </RigidBody>
        </group>
      ))}
      {/* Ceiling ribs and segmented slabs frame an actual west-side opening. */}
      {[-16, -10, -4, 2, 8, 14].map((z) => (
        <group key={z}>
          <mesh
            position={[0, 5.9, z]}
            geometry={chipped([20, 0.32, 0.55])}
            material={material("concrete", 4, 1)}
            castShadow
          />
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider position={[0, 5.9, z]} args={[10, 0.16, 0.275]} />
          </RigidBody>
        </group>
      ))}
      <mesh
        position={[1, 6.12, 0]}
        geometry={chipped([18, 0.18, 40])}
        material={material("concrete", 4, 8)}
        receiveShadow
      />
      <mesh
        position={[-9.7, 2.2, -2]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={opened}
        material={material("concrete")}
        castShadow
      />
      <mesh
        position={[-9.7, 2.2, 5]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={opened}
        material={material("concrete")}
        castShadow
      />
      <Rebar p={[-9.5, 2.2, 4.7]} />
      <Rebar p={[-9.6, 2.2, -1.6]} />
      <Rebar p={[3.2, 3.2, -6]} />
      {chairs.map((c) => (
        <Chair key={c.id} {...c} />
      ))}
      <group position={[8.1, 0.4, -18.5]} rotation={[0, 0, 1.25]}>
        <Chair p={[0, 0, 0]} broken />
      </group>
      <Chair p={[6.1, 0, -18.7]} broken />
      {/* Bent ticket gates use swept rusted profiles and conservative physical bounds. */}
      {[-3, -1].map((x) => (
        <group key={x} position={[x, 0, 16.5]}>
          <mesh
            geometry={tube(
              [
                [0, 0.04, 0],
                [0, 1, 0],
                [0.2, 1.1, 0],
                [0.8, 0.65, 0.2],
                [1.1, 0.3, 0.2],
              ],
              0.035,
            )}
            material={material("rust")}
            castShadow
          />
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider
              position={[0.5, 0.45, 0]}
              args={[0.6, 0.45, 0.15]}
            />
          </RigidBody>
        </group>
      ))}
      <mesh
        position={[-6, 0.012, 14.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={chipped([0.8, 0.65, 0.01])}
        material={material("floor")}
      />
      {!s.ticketCollected && <Ticket p={[-6, 0.08, 14.5]} />}
      <mesh
        position={[-6.17, 0.075, 14.55]}
        scale={[0.2, 0.4, 0.2]}
        geometry={stone}
        material={material("concrete")}
        receiveShadow
      />
      {!s.seatClueRead && <Ticket p={[-4, 0.69, 2.05]} />}
      <group position={[8.2, 0.15, -17.4]}>
        <mesh
          geometry={chipped([0.48, 0.28, 0.42])}
          material={material("rust")}
          castShadow
        />
        <mesh
          position={[0, s.boxUnlocked ? 0.35 : 0.15, s.boxUnlocked ? -0.2 : 0]}
          rotation={[s.boxUnlocked ? -1.2 : 0, 0, 0]}
          geometry={chipped([0.5, 0.035, 0.44])}
          material={material("rust")}
          castShadow
        />
        <mesh
          position={[0, 0.06, 0.222]}
          geometry={chipped([0.065, 0.12, 0.035])}
          material={material("rust")}
        />
        <mesh
          geometry={tube(
            [
              [-0.23, 0.08, -0.21],
              [-0.23, 0.08, 0.21],
              [0.23, 0.08, 0.21],
              [0.23, 0.08, -0.21],
            ],
            0.009,
          )}
          material={material("rust")}
        />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.24, 0.14, 0.21]} />
        </RigidBody>
      </group>
      <Projector />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[7, 0.9, -12]} args={[0.43, 0.9, 0.55]} />
      </RigidBody>
      <Graffiti revealed={s.dreamRevealed} />
      <Crumbling active={s.dreamRevealed} />
      {s.dreamRevealed && !s.dreamKeyCollected && (
        <group position={[-6, 1.35, -6.5]}>
          <mesh
            geometry={tube(
              [
                [-0.06, -0.14, 0],
                [0, -0.15, 0],
                [0, 0.12, 0],
                [0.06, 0.12, 0],
              ],
              0.022,
            )}
          >
            <meshPhysicalMaterial
              color="#b8ae8c"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          <mesh
            geometry={tube(
              [
                [0, 0.1, 0],
                [-0.08, 0.16, 0],
                [0, 0.24, 0],
                [0.08, 0.16, 0],
                [0, 0.1, 0],
              ],
              0.019,
            )}
            material={material("rust")}
          />
        </group>
      )}
      <Label
        p={[2.4, 1.65, 8.32]}
        size={[0.85, 1.2]}
        lines={["THE LAST", "PICTURE", "BEIRUT · 1965"]}
      />
      <Label
        p={[-6, 1.25, 16.22]}
        size={[2.3, 0.3]}
        lines={["BILLETS / تذاكر"]}
      />
      <Label
        p={[-1, 3.7, -19.42]}
        size={[5, 1.7]}
        lines={["RE:CALL", "MEMORA", "THE MEMORY REMAINS"]}
      />
      <Exit />
      <Water p={[-5, 0.012, 6]} scale={[1.6, 0.8, 1]} />
      <Water p={[5, 0.012, -8]} scale={[2, 1.1, 1]} />
      <Debris />
      {/* Sensor colliders mirror the small interaction boxes; never used as blockers. */}
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
    </>
  );
}
