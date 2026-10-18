import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as T from "three";
import { assets, assetURL } from "../game/assets";
import { useGame } from "../game/store";
import { copy } from "../game/content";
import { chipped, tube } from "./geometry";
import { material } from "./materials";
import { SolidMesh, KeyMesh } from "./Architecture";
import { Label, Ticket, ArchivePhoto } from "./Details";

function OriginalPoster() {
  const source = useTexture(assetURL(assets.memoraPoster!));
  const texture = useMemo(() => {
    const t = source.clone();
    t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [source]);
  const image = source.image as HTMLImageElement;
  const width = (4.4 * image.width) / image.height;
  const mat = useRef<T.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.color.setScalar(
        0.96 + Math.sin(clock.elapsedTime * 1.7) * 0.035,
      );
  });
  useEffect(() => () => texture.dispose(), [texture]);
  // Flat original artwork, unmodified UVs and exact source aspect ratio.
  return (
    <mesh position={[0, 17.15, -13.86]}>
      <planeGeometry args={[width, 4.4]} />
      <meshBasicMaterial ref={mat} map={texture} toneMapped={false} />
    </mesh>
  );
}
function LightStream() {
  const geometry = useMemo(() => {
    const p = [0, 15.75, -1.41],
      corners = [
        [-1.6, 14.9, -13.84],
        [1.6, 14.9, -13.84],
        [1.6, 19.4, -13.84],
        [-1.6, 19.4, -13.84],
      ];
    const vertices: number[] = [];
    for (let i = 0; i < 4; i++)
      vertices.push(...p, ...corners[i], ...corners[(i + 1) % 4]);
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        uniforms: { time: { value: 0 } },
        vertexShader:
          "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec3 p;uniform float time;void main(){float wave=.5+.5*sin(p.z*.7+p.x*2.+time*.6);vec3 c=mix(vec3(.25,.35,.8),vec3(.55,.3,.7),wave);gl_FragColor=vec4(c,.025+wave*.018);}",
      }),
    [],
  );
  useFrame((_, dt) => {
    mat.uniforms.time.value += dt;
  });
  return <mesh geometry={geometry} material={mat} />;
}
export function DreamProjector() {
  const s = useGame(),
    lid = useRef<RapierRigidBody>(null),
    fired = useRef(false);
  const projectionClock = useRef(performance.now());
  useEffect(() => {
    projectionClock.current = performance.now();
  }, [s.modal, s.projectorStarted]);
  const target = useMemo(() => {
    const t = new T.Object3D();
    t.position.set(0, 17.1, -14);
    return t;
  }, []);
  const lens = useMemo(
    () =>
      new T.LatheGeometry(
        [
          new T.Vector2(0.11, 0),
          new T.Vector2(0.18, 0.02),
          new T.Vector2(0.18, 0.32),
          new T.Vector2(0.13, 0.34),
        ],
        40,
      ),
    [],
  );
  useFrame(() => {
    const now = performance.now(),
      elapsed = (now - projectionClock.current) / 1000;
    projectionClock.current = now;
    // Use active wall-clock time, not frame count, including on slower GPUs.
    if (!document.hidden) useGame.getState().tickProjection(elapsed);
    if (
      useGame.getState().projectionFinished &&
      !fired.current &&
      lid.current?.isDynamic()
    ) {
      fired.current = true;
      lid.current.applyImpulse({ x: 0.02, y: 0.6, z: -0.25 }, true);
      lid.current.applyTorqueImpulse({ x: -0.03, y: 0.002, z: 0.005 }, true);
    }
  });
  return (
    <>
      <SolidMesh p={[0, 15.08, -0.15]} size={[3.6, 0.18, 2.4]} kind="wood" />
      {[-1.5, 1.5].flatMap((x) =>
        [-1.1, 0.8].map((z) => (
          <SolidMesh
            key={x + ":" + z}
            p={[x, 14.5, z]}
            size={[0.16, 1, 0.16]}
            kind="rust"
          />
        )),
      )}
      <SolidMesh p={[0, 15.52, -0.7]} size={[0.85, 0.65, 0.7]} kind="rust" />
      <RigidBody
        type="fixed"
        colliders="hull"
        position={[0, 15.72, -1.05]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <mesh geometry={lens} material={material("rust")} castShadow />
      </RigidBody>
      {/* Film tray is hollow. The key lies on its bottom, never floats in mid-air. */}
      <SolidMesh
        p={[1.05, 15.24, -0.65]}
        size={[0.65, 0.08, 0.6]}
        kind="rust"
      />
      {[-1, 1].map((n) => (
        <SolidMesh
          key={n}
          p={[1.05 + n * 0.32, 15.325, -0.65]}
          size={[0.045, 0.09, 0.6]}
          kind="rust"
        />
      ))}
      <SolidMesh
        p={[1.05, 15.325, -0.95]}
        size={[0.65, 0.09, 0.045]}
        kind="rust"
      />
      <SolidMesh
        p={[1.05, 15.325, -0.35]}
        size={[0.65, 0.09, 0.045]}
        kind="rust"
      />
      <RigidBody
        ref={lid}
        type={s.projectionFinished ? "dynamic" : "fixed"}
        colliders={false}
        position={[1.05, 15.405, -0.65]}
        mass={0.12}
        restitution={0.12}
        friction={0.8}
        ccd
      >
        <mesh
          geometry={chipped([0.7, 0.045, 0.65], 7)}
          material={material("rust")}
          castShadow
        />
        <CuboidCollider args={[0.35, 0.0225, 0.325]} mass={0.12} />
      </RigidBody>
      {s.projectionFinished && !s.key3Found && (
        <KeyMesh p={[1.05, 15.3, -0.65]} />
      )}
      {s.ticketPlaced && <Ticket p={[-0.6, 15.19, 0.35]} />}
      {s.photoPlaced && <ArchivePhoto p={[0.3, 15.19, 0.35]} />}
      <mesh
        geometry={tube(
          [
            [-0.3, 15.3, -0.8],
            [-0.8, 14.08, -1.1],
            [-2, 14.025, -2],
            [-4, 14.025, -5],
          ],
          0.015,
        )}
        material={material("rust")}
      />
      <SolidMesh p={[0, 17.15, -14]} size={[5, 5.5, 0.22]} />
      <pointLight
        position={[1.4, 16.2, -0.3]}
        color="#c9cfdd"
        intensity={8}
        distance={6}
      />
      <SolidMesh p={[0.35, 16, -0.65]} size={[0.12, 0.12, 0.12]} kind="rust" />
      <primitive object={target} />
      <spotLight
        position={[0, 15.75, -1.41]}
        target={target}
        color="#9d8deb"
        intensity={s.projectorStarted ? 110 : 15}
        angle={0.32}
        penumbra={0.5}
        distance={22}
        decay={1.5}
      />
      {s.projectorStarted && (
        <>
          <LightStream />
          {assets.memoraPoster ? (
            <Suspense fallback={null}>
              <OriginalPoster />
            </Suspense>
          ) : (
            <Label
              p={[0, 17, -13.85]}
              size={[3, 1]}
              lines={[copy.missingArt]}
            />
          )}
          <pointLight
            position={[0, 17, -12]}
            color="#929bd9"
            intensity={35}
            distance={14}
          />
        </>
      )}
      <Label
        p={[0, 15.6, 1.08]}
        size={[2, 0.4]}
        lines={["MEMORY SYNC", "TICKET → PHOTOGRAPH"]}
      />
    </>
  );
}
