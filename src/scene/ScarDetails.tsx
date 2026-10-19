import { RigidBody } from "@react-three/rapier";
import { SolidMesh } from "./Architecture";
import { Label } from "./Details";
import { tube } from "./geometry";
import { material } from "./materials";
export function ScarDetails() {
  return (
    <>
      {/* A fallen medical case, with separate bevelled lid, straps and metal shell. */}
      {[
        [-4.5, 7.28, 12],
        [4.4, 7.25, -15],
      ].map((p, i) => (
        <group
          key={i}
          position={p as [number, number, number]}
          rotation={[0.18, i * 0.7, 0.12]}
        >
          <SolidMesh
            p={[0, 0, 0]}
            size={[0.85, 0.43, 0.6]}
            kind="canvas"
            soft
          />
          <SolidMesh
            p={[0.48, -0.1, 0.15]}
            size={[0.8, 0.07, 0.55]}
            kind="rust"
            rotation={[0.15, 0, 0.3]}
          />
          <Label
            p={[0, 0.225, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            size={[0.3, 0.24]}
            lines={["+", "MEDICAL"]}
          />
          {[-0.3, 0.3].map((x) => (
            <SolidMesh
              key={x}
              p={[x, 0.22, 0]}
              size={[0.06, 0.025, 0.6]}
              kind="rust"
            />
          ))}
        </group>
      ))}
      {/* Bent, slack wire mesh against the wall; trimesh colliders follow the actual wire. */}
      <RigidBody
        type="fixed"
        colliders="trimesh"
        position={[9.3, 7, 7]}
        rotation={[0, -0.08, -0.14]}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            geometry={tube(
              [
                [0, 0.12, i * 0.24],
                [0, 0.6, i * 0.24 + 0.15],
                [0.1, 1.1, i * 0.24 - 0.1],
                [0.05, 1.6, i * 0.24 + 0.2],
              ],
              0.012,
            )}
            material={material("rust")}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={"h" + i}
            geometry={tube(
              [
                [0, 0.12 + i * 0.22, 0],
                [0.05, 0.2 + i * 0.22, 1.2],
                [0.1, 0.12 + i * 0.22, 2.8],
              ],
              0.012,
            )}
            material={material("rust")}
          />
        ))}
      </RigidBody>
    </>
  );
}
