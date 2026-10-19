import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as T from "three";
import { useGame } from "../game/store";
import { SolidMesh, KeyMesh } from "./Architecture";
import { Label, Ticket } from "./Details";
import { chipped, tube } from "./geometry";
import { material } from "./materials";

export function CinemaSafe() {
  const unlocked = useGame((s) => s.safeUnlocked),
    collected = useGame((s) => s.key1Found);
  const door = useRef<RapierRigidBody>(null),
    angle = useRef(0);
  const quaternion = useRef(new T.Quaternion());
  useFrame((_, dt) => {
    angle.current = T.MathUtils.damp(
      angle.current,
      unlocked ? -1.65 : 0,
      3,
      Math.min(dt, 0.1),
    );
    quaternion.current.setFromAxisAngle(T.Object3D.DEFAULT_UP, angle.current);
    door.current?.setNextKinematicRotation(quaternion.current);
  });
  return (
    <group>
      {/* Hollow, bevelled steel enclosure, not a solid cube hiding its contents. */}
      <SolidMesh p={[5.1, 0.15, -13]} size={[1.4, 0.22, 1.15]} kind="rust" />
      <SolidMesh p={[5.1, 1.25, -13]} size={[1.4, 0.16, 1.15]} kind="rust" />
      <SolidMesh p={[5.1, 0.7, -13.5]} size={[1.4, 1, 0.15]} kind="rust" />
      {[-1, 1].map((n) => (
        <SolidMesh
          key={n}
          p={[5.1 + n * 0.64, 0.7, -13]}
          size={[0.12, 1, 1]}
          kind="rust"
        />
      ))}
      <RigidBody
        ref={door}
        type="kinematicPosition"
        colliders={false}
        position={[4.48, 0.7, -12.43]}
      >
        <mesh
          position={[0.62, 0, 0]}
          geometry={chipped([1.24, 1.02, 0.12], 73)}
          material={material("rust")}
          castShadow
          receiveShadow
        />
        <CuboidCollider args={[0.62, 0.51, 0.06]} position={[0.62, 0, 0]} />
        <Label
          p={[0.82, 0.15, 0.075]}
          size={[0.3, 0.36]}
          lines={["1 2 3", "4 5 6", "7 8 9", "⌫ 0 ↵"]}
        />
        <mesh
          geometry={tube(
            [
              [0.22, -0.1, 0.1],
              [0.22, 0.15, 0.19],
              [0.22, 0.33, 0.1],
            ],
            0.025,
          )}
          material={material("rust")}
        />
        <CuboidCollider
          position={[0.22, 0.12, 0.13]}
          args={[0.045, 0.23, 0.08]}
        />
      </RigidBody>
      {unlocked && !collected && (
        <>
          <KeyMesh p={[5.1, 0.3, -12.9]} />
          <Ticket p={[5.35, 0.285, -13.05]} />
        </>
      )}
      <Label
        p={[5.1, 1.7, -13.5]}
        size={[1.5, 0.34]}
        lines={["PROJECTION OFFICE", "ARCHIVES / 1975"]}
      />
      <pointLight
        position={[5.1, 2, -11.9]}
        intensity={5}
        color="#d6b780"
        distance={5}
      />
    </group>
  );
}
