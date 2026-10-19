import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGame } from "../game/store";
import { solids, chairs, type V3 } from "./layout";
import { chipped, tube, brokenOpening, fragment, ruinedWall } from "./geometry";
import { material, featuredVelvet } from "./materials";
import { Atmosphere } from "./Atmosphere";
import { Door } from "./Architecture";
import { CinemaSafe } from "./CinemaSafe";
import { CinemaClutter } from "./ClutterSpawner";
import { Carpet } from "./Carpet";
import { Label, Graffiti, Ticket, Water, Rebar, Projector } from "./Details";

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
      <group
        position={[0, 0.99, 0.32]}
        rotation={[broken ? 0.58 : -0.08, 0, broken ? 0.16 : 0]}
      >
        <mesh
          geometry={tube(
            [
              [-0.34, -0.32, -0.103],
              [-0.37, 0.25, -0.103],
              [-0.29, 0.36, -0.103],
              [0.29, 0.36, -0.103],
              [0.37, 0.25, -0.103],
              [0.34, -0.32, -0.103],
            ],
            0.006,
          )}
          material={material("velvet")}
        />
        {[-0.14, 0.14].map((x) => (
          <mesh
            key={x}
            geometry={tube(
              [
                [x, -0.25, -0.102],
                [x, 0.1, -0.105],
                [x, 0.3, -0.102],
              ],
              0.003,
            )}
            material={material("velvet")}
          />
        ))}
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
            material={featured ? cloth : material("wood")}
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
        <CuboidCollider position={[0, 0.31, 0]} args={[0.45, 0.31, 0.4]} />
        {[-0.5, 0.5].map((x) => (
          <CuboidCollider
            key={x}
            position={[x, 0.39, 0]}
            args={[0.06, 0.39, 0.34]}
          />
        ))}
        <CuboidCollider
          position={[0, 0.99, 0.32]}
          rotation={[broken ? 0.58 : -0.08, 0, broken ? 0.16 : 0]}
          args={[0.425, 0.425, 0.095]}
        />
      </RigidBody>
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
      <group visible={s.floor === 2}>
        <mesh
          position={[0, -0.13, 0]}
          geometry={chipped([20, 0.26, 40])}
          material={material("floor", 5, 10)}
          receiveShadow
        />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[10, 0.2, 20]} position={[0, -0.2, 0]} />
        </RigidBody>
        <Carpet />
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
        <Chair p={[8, 0, -15.8]} broken />
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
        {!(s.hasTicket || s.ticketPlaced) && <Ticket p={[-6, 0.08, 14.5]} />}
        <mesh
          position={[-6.17, 0.075, 14.55]}
          scale={[0.2, 0.4, 0.2]}
          geometry={stone}
          material={material("concrete")}
          receiveShadow
        />
        {!s.hasNumberNote && <Ticket p={[-4, 0.69, 2.05]} />}
        <CinemaSafe key={s.session} />
        <Projector />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider position={[7, 0.9, -12]} args={[0.43, 0.9, 0.55]} />
        </RigidBody>
        <Graffiti revealed={false} />
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
        <Door p={[5.5, 0, -20]} flag="exit2Open" label="3F / SCAR" swing={1} />
        <Water p={[-5, 0.012, 6]} scale={[1.6, 0.8, 1]} />
        <Water p={[5, 0.012, -8]} scale={[2, 1.1, 1]} />
        <CinemaClutter />
      </group>
    </>
  );
}
