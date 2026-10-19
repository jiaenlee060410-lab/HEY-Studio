import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as T from "three";
import { carpetMaterial } from "./materials";
export function Carpet() {
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(17.8, 36.8, 70, 140),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        edge = Math.max(Math.abs(x) / 8.9, Math.abs(y) / 18.4);
      p.setXYZ(
        i,
        x + Math.sin(y * 9) * 0.025 * Math.pow(edge, 12),
        y + Math.cos(x * 13) * 0.03 * Math.pow(edge, 12),
        0.008 + Math.pow(edge, 20) * (0.006 + 0.005 * Math.sin(y * 10)),
      );
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <>
      <mesh
        position={[0, 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={geometry}
        material={carpetMaterial()}
        receiveShadow
      />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[0, 0.004, 0]} args={[8.9, 0.004, 18.4]} />
      </RigidBody>
    </>
  );
}
