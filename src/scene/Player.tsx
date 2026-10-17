import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
  type RapierRigidBody,
  type RapierCollider,
} from "@react-three/rapier";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import * as THREE from "three";
import { available, useGame } from "../game/store";
import { InputManager } from "../game/input";
import { spawn, targets } from "./layout";

export function Player() {
  const body = useRef<RapierRigidBody>(null),
    capsule = useRef<RapierCollider>(null);
  const { camera, gl } = useThree(),
    { world, rapier } = useRapier();
  const session = useGame((s) => s.session),
    modal = useGame((s) => s.modal);
  const input = useMemo(() => new InputManager(), []),
    controls = useMemo(
      () => new PointerLockControls(camera, gl.domElement),
      [camera, gl],
    );
  const controller = useRef<ReturnType<
      typeof world.createCharacterController
    > | null>(null),
    crouch = useRef(false),
    scan = useRef(0),
    skipStep = useRef(1);
  useEffect(() => {
    const c = world.createCharacterController(0.015);
    c.setSlideEnabled(true);
    controller.current = c;
    return () => {
      controller.current = null;
      world.removeCharacterController(c);
    };
  }, [world]);
  const activate = (pad = false) => {
    const s = useGame.getState();
    if (!s.ready) return;
    if (s.modal) {
      s.confirm();
      if (useGame.getState().modal === null && !pad) controls.lock();
    } else if (!controls.isLocked && !pad) controls.lock();
    else if (s.target) s.interact(s.target);
  };
  useEffect(() => {
    controls.connect(gl.domElement);
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      input.keys.add(e.code);
      if (
        ["Enter", "NumpadEnter", "Space", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      const s = useGame.getState();
      if (e.code === "Enter" || e.code === "NumpadEnter") activate();
      if (e.code === "KeyI" && s.modal !== "welcome") {
        s.set({
          modal: s.modal === "inventory" ? null : "inventory",
          readingOnly: false,
        });
        input.clear();
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowRight")
        s.set({
          inventoryIndex: Math.max(
            0,
            s.inventoryIndex + (e.code === "ArrowLeft" ? -1 : 1),
          ),
        });
      if (e.code === "Escape" && s.modal !== "welcome") {
        s.set({
          modal: s.modal && s.modal !== "pause" ? "pause" : s.modal,
          readingOnly: false,
        });
        input.clear();
      }
      if (e.code === "KeyR" && (s.modal === "pause" || s.modal === "next"))
        s.resetGame();
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const lock = () => useGame.getState().set({ locked: true });
    const unlock = () => {
      input.clear();
      const s = useGame.getState();
      s.set({
        locked: false,
        target: null,
        ...(!s.modal ? { modal: "pause" as const } : {}),
      });
    };
    const blur = () => {
      input.clear();
      const s = useGame.getState();
      if (!s.modal) s.set({ modal: "pause" });
      controls.unlock();
    };
    const click = () => {
      if (!useGame.getState().modal) controls.lock();
    };
    const error = () =>
      useGame
        .getState()
        .set({ notice: "마우스 잠금을 허용한 뒤 Enter를 다시 누르세요." });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("pointerlockerror", error);
    gl.domElement.addEventListener("click", click);
    controls.addEventListener("lock", lock);
    controls.addEventListener("unlock", unlock);
    useGame.getState().set({ ready: true });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("pointerlockerror", error);
      gl.domElement.removeEventListener("click", click);
      controls.removeEventListener("lock", lock);
      controls.removeEventListener("unlock", unlock);
      controls.dispose();
      input.clear();
    };
  }, [controls, input, gl]);
  useEffect(() => {
    if (modal) {
      controls.unlock();
      input.clear();
      useGame.getState().set({ target: null });
    }
  }, [modal, controls, input]);
  useEffect(() => {
    const p = { x: spawn[0], y: 0.87, z: spawn[2] };
    body.current?.setTranslation(p, true);
    body.current?.setNextKinematicTranslation(p);
    camera.position.set(spawn[0], 1.65, spawn[2]);
    camera.rotation.set(0, 0, 0);
    input.clear();
    crouch.current = false;
    capsule.current?.setShape(new rapier.Capsule(0.6, 0.25));
    skipStep.current = 1;
  }, [session, camera, input, rapier]);
  useBeforePhysicsStep(() => {
    const s = useGame.getState(),
      b = body.current,
      col = capsule.current,
      cc = controller.current;
    if (
      !b ||
      !col ||
      !cc ||
      s.modal ||
      (!controls.isLocked && !input.padActive)
    )
      return;
    if (skipStep.current > 0) {
      skipStep.current--;
      return;
    }
    let lowered = input.crouched;
    if (!lowered && crouch.current) {
      const p = b.translation();
      const obstruction = world.intersectionWithShape(
        { ...p, y: p.y + 0.42 },
        { x: 0, y: 0, z: 0, w: 1 },
        new rapier.Capsule(0.6, 0.25),
        rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        col,
        b,
      );
      if (obstruction) lowered = true;
    }
    if (lowered !== crouch.current) {
      const old = b.translation(),
        next = {
          ...old,
          y: Math.max(
            lowered ? 0.445 : 0.865,
            old.y + (lowered ? -0.42 : 0.42),
          ),
        };
      col.setShape(new rapier.Capsule(lowered ? 0.18 : 0.6, 0.25));
      b.setTranslation(next, true);
      b.setNextKinematicTranslation(next);
      crouch.current = lowered;
      s.set({ crouched: lowered });
      return;
    }
    const q = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ"),
      f = new THREE.Vector3(-Math.sin(q.y), 0, -Math.cos(q.y)),
      right = new THREE.Vector3(-f.z, 0, f.x);
    const x =
      Number(input.keys.has("KeyD")) -
      Number(input.keys.has("KeyA")) +
      input.move[0];
    const z =
      Number(input.keys.has("KeyW")) -
      Number(input.keys.has("KeyS")) -
      input.move[1];
    const move = f.multiplyScalar(z).addScaledVector(right, x);
    if (move.length() > 1) move.normalize();
    move.multiplyScalar((lowered ? 1.15 : 2.6) / 60);
    move.y = -0.12;
    cc.computeColliderMovement(
      col,
      move,
      rapier.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const d = cc.computedMovement(),
      p = b.translation();
    b.setNextKinematicTranslation({ x: p.x + d.x, y: p.y + d.y, z: p.z + d.z });
  });
  useFrame((_, dt) => {
    input.poll(() => activate(true));
    const s = useGame.getState(),
      b = body.current;
    if (!b) return;
    const p = b.translation();
    camera.position.set(
      p.x,
      THREE.MathUtils.damp(
        camera.position.y,
        p.y + (crouch.current ? 0.33 : 0.8),
        16,
        dt,
      ),
      p.z,
    );
    if (s.modal || (!controls.isLocked && !input.padActive)) {
      if (s.target) s.set({ target: null });
      return;
    }
    const rot = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    rot.y -= input.look[0] * dt * 1.8;
    rot.x = THREE.MathUtils.clamp(rot.x - input.look[1] * dt * 1.4, -1.5, 1.5);
    camera.quaternion.setFromEuler(rot);
    s.elapsed += Math.min(dt, 0.1);
    scan.current += dt;
    if (scan.current < 0.06) return;
    scan.current = 0;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const ray = new THREE.Ray(camera.position, direction),
      hit = new THREE.Vector3();
    let selected = null,
      best = 1.0001;
    for (const t of targets) {
      if (!available(t.id, s) || (t.crouch && !s.crouched)) continue;
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(...t.p),
        new THREE.Vector3(...t.size),
      );
      if (!ray.intersectBox(box, hit)) continue;
      const distance = camera.position.distanceTo(hit);
      if (distance > 1 || distance >= best) continue;
      const obstacle = world.castRay(
        new rapier.Ray(camera.position, direction),
        distance - 0.035,
        true,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        capsule.current ?? undefined,
        b,
      );
      if (!obstacle) {
        selected = t.id;
        best = distance;
      }
    }
    if (selected !== s.target) s.set({ target: selected });
  });
  // Development-only harness drives the same controller and raycast; stripped in production.
  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      !new URLSearchParams(location.search).has("test")
    )
      return;
    const debug = {
      game: useGame,
      input,
      teleport: (x: number, z: number) => {
        const p = { x, y: crouch.current ? 0.45 : 0.87, z };
        body.current?.setTranslation(p, true);
        body.current?.setNextKinematicTranslation(p);
        camera.position.set(x, crouch.current ? 0.78 : 1.67, z);
        skipStep.current = 1;
      },
      aim: (x: number, y: number, z: number) => camera.lookAt(x, y, z),
      position: () => body.current?.translation(),
      camera: () => ({
        position: camera.position.toArray(),
        direction: camera.getWorldDirection(new THREE.Vector3()).toArray(),
      }),
    };
    Object.assign(window, { __recall: debug });
    return () => {
      delete (window as Window & { __recall?: unknown }).__recall;
    };
  }, [input, camera]);
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={spawn}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={capsule} args={[0.6, 0.25]} />
    </RigidBody>
  );
}
