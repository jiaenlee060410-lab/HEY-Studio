import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { random } from "./materials";
import { useGame } from "../game/store";

export function Atmosphere() {
  const fog = useRef<T.FogExp2>(null);
  const fogColors = useMemo(
    () => [
      new T.Color("#595750"),
      new T.Color("#373c41"),
      new T.Color("#24253b"),
    ],
    [],
  );
  const bounce = useRef<T.HemisphereLight>(null);
  const light = useRef<T.DirectionalLight>(null),
    target = useMemo(() => {
      const t = new T.Object3D();
      t.position.set(-4, 0.6, 2);
      return t;
    }, []);
  const beam = useMemo(() => {
    const m = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.BackSide,
      uniforms: { time: { value: 0 }, tint: { value: new T.Color("#e9c58a") } },
      vertexShader:
        "varying vec3 world; void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}",
      fragmentShader: `
   varying vec3 world; uniform float time; uniform vec3 tint;
   float hash(vec3 p){return fract(sin(dot(floor(p),vec3(127.1,311.7,74.7)))*43758.5453);}
   void main(){vec3 dir=normalize(world-cameraPosition);float depth=length(world-cameraPosition);float fog=0.;
    for(int i=0;i<32;i++){float d=depth*(float(i)+.5)/32.;vec3 p=cameraPosition+dir*d;
      vec3 axis=normalize(vec3(9.,-7.4,-2.));vec3 rel=p-vec3(-13.,8.,4.);float along=dot(rel,axis);float radial=length(rel-axis*along);
      float density=exp(-radial*radial*1.5)*smoothstep(2.,5.,along)*(1.-smoothstep(14.,17.,along));
      fog+=density*(.8+.2*hash(p*5.+vec3(time*.07)))*depth/32.*.012;}
    gl_FragColor=vec4(tint,min(fog,.19));}`,
    });
    return m;
  }, []);
  const dust = useMemo(() => {
    const rng = random(981),
      v = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      v[i * 3] = (rng() - 0.5) * 19;
      v[i * 3 + 1] = rng() * 5.8;
      v[i * 3 + 2] = (rng() - 0.5) * 38;
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(v, 3));
    return g;
  }, []);
  const dustRef = useRef<T.Points>(null);
  useFrame((_, dt) => {
    if (fog.current)
      fog.current.color.lerp(
        fogColors[useGame.getState().floor - 2],
        1 - Math.exp(-dt * 2),
      );
    beam.uniforms.time.value += dt;
    if (dustRef.current)
      dustRef.current.rotation.y =
        Math.sin(beam.uniforms.time.value * 0.03) * 0.003;
    if (light.current) {
      light.current.target = target;
      light.current.intensity = T.MathUtils.damp(
        light.current.intensity,
        useGame.getState().floor === 2 ? 3.7 : 0,
        2,
        dt,
      );
    }
    if (bounce.current) {
      const floor = useGame.getState().floor;
      bounce.current.intensity = T.MathUtils.damp(
        bounce.current.intensity,
        floor === 2 ? 1.0 : floor === 3 ? 0.45 : 0.3,
        2,
        dt,
      );
    }
  });
  return (
    <>
      <color attach="background" args={["#242725"]} />
      <fogExp2 ref={fog} attach="fog" args={["#595750", 0.018]} />
      {/* Low reflected skylight keeps shadow detail; the west breach is the sole strong source. */}
      <hemisphereLight ref={bounce} args={["#acb8c5", "#686960", 1.0]} />
      <primitive object={target} />
      <directionalLight
        ref={light}
        position={[-13, 8, 4]}
        intensity={3.7}
        color="#ffdfaa"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={65}
        shadow-normalBias={0.035}
        shadow-bias={-0.0001}
      />
      <mesh position={[-4, 3, 2]} material={beam}>
        <boxGeometry args={[16, 6, 12]} />
      </mesh>
      <points ref={dustRef} geometry={dust}>
        <pointsMaterial
          color="#d7c3a1"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </points>
    </>
  );
}
