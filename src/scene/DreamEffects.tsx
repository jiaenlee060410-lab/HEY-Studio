import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { random } from "./materials";
import { tube } from "./geometry";
import { useGame } from "../game/store";
import type { V3 } from "./layout";

const noiseGLSL = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float f=0.;float a=.5;for(int i=0;i<5;i++){f+=a*noise(p);p=p*2.03+vec2(3.7,1.2);a*=.5;}return f;}`;

export function DreamEffects() {
  const active = useGame((s) => s.floor === 4),
    last = useRef(new T.Vector3()),
    wind = useRef(new T.Vector3());
  const sky = useMemo(
    () =>
      new T.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        side: T.DoubleSide,
        toneMapped: false,
        vertexShader:
          "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `varying vec2 v;uniform float time;${noiseGLSL}
    void main(){vec2 uv=v*vec2(3.,1.);float t=time*.025;
      float cloud=fbm(uv*2.+vec2(t,-t*.3));
      float bend=.48+.13*sin(uv.x*2.+t*2.)+.1*fbm(uv*3.+t);
      float curtain=exp(-abs(v.y-bend)*10.)*(.25+.75*fbm(vec2(uv.x*9.-t,v.y*2.)));
      float stars=step(.997,hash(floor(v*vec2(900.,400.))))*(.55+.45*sin(time*.7+v.x*60.));
      vec3 c=mix(vec3(.012,.018,.052),vec3(.09,.045,.18),cloud);
      c+=curtain*mix(vec3(.12,.22,.48),vec3(.28,.13,.4),cloud)*1.6;
      gl_FragColor=vec4(c+stars*.35,1.);
    }`,
      }),
    [],
  );
  const cracks = useMemo(() => {
    const rng = random(451),
      pieces: T.BufferGeometry[] = [];
    for (let i = 0; i < 25; i++) {
      const ceiling = i > 15,
        startX = ceiling ? (rng() - 0.5) * 17 : 9.72,
        startY = ceiling ? 20.11 : 15 + rng() * 3.8,
        startZ = (rng() - 0.5) * 35;
      const points: V3[] = Array.from({ length: 8 }, (_, j) => [
        startX + (ceiling ? j * 0.3 : 0),
        startY + (ceiling ? 0 : j * 0.13),
        startZ + j * 0.23 + Math.sin(j * 2.4 + i) * 0.18,
      ]);
      pieces.push(tube(points, 0.012).clone());
      const a = points[3];
      pieces.push(
        tube(
          [
            a,
            [
              a[0] - (ceiling ? 0.5 : 0),
              a[1] - (ceiling ? 0 : 0.3),
              a[2] + 0.22,
            ],
            [
              a[0] - (ceiling ? 0.9 : 0),
              a[1] - (ceiling ? 0 : 0.5),
              a[2] + 0.55,
            ],
          ],
          0.007,
        ).clone(),
      );
    }
    const g = mergeGeometries(pieces)!;
    pieces.forEach((p) => p.dispose());
    return g;
  }, []);
  const glow = useMemo(
    () =>
      new T.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
        vertexShader:
          "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec3 p;uniform float time;void main(){float pulse=.35+.65*pow(.5+.5*sin(p.z*.7+p.y*1.3-time*.65),3.);gl_FragColor=vec4(mix(vec3(.25,.18,.55),vec3(.3,.65,1.),pulse),.2+pulse*.65);}",
      }),
    [],
  );
  const particles = useMemo(() => {
    const rng = random(792),
      points = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      points[i * 3] = (rng() - 0.5) * 18;
      points[i * 3 + 1] = 14.3 + rng() * 5.3;
      points[i * 3 + 2] = (rng() - 0.5) * 37;
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(points, 3));
    return g;
  }, []);
  const dust = useMemo(
    () =>
      new T.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          player: { value: new T.Vector3() },
          wind: { value: new T.Vector3() },
        },
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
        vertexShader: `uniform float time;uniform vec3 player;uniform vec3 wind;varying float fade;
      void main(){vec3 p=position;float seed=p.x*3.+p.z;
      p+=vec3(sin(time*.18+seed),cos(time*.13+seed*.2),sin(time*.15+seed*.4))*.18;
      float nearPlayer=exp(-dot(p-player,p-player)*.4);p+=wind*nearPlayer*.22;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(15./max(1.,-mv.z),1.2,4.5);fade=.28+.25*sin(time*.6+seed);}`,
        fragmentShader: `varying float fade;void main(){float r=length(gl_PointCoord-.5);float a=exp(-r*r*20.)*(1.-smoothstep(.3,.5,r));gl_FragColor=vec4(.53,.65,1.,a*fade);}`,
      }),
    [],
  );
  useEffect(
    () => () => {
      sky.dispose();
      glow.dispose();
      dust.dispose();
      cracks.dispose();
      particles.dispose();
    },
    [sky, glow, dust, cracks, particles],
  );
  useFrame(({ camera }, dt) => {
    if (!active || useGame.getState().modal) {
      last.current.copy(camera.position);
      wind.current.multiplyScalar(0.9);
      return;
    }
    sky.uniforms.time.value += dt;
    glow.uniforms.time.value += dt;
    dust.uniforms.time.value += dt;
    const velocity = camera.position
      .clone()
      .sub(last.current)
      .divideScalar(Math.max(0.016, dt));
    if (velocity.length() > 5) velocity.set(0, 0, 0); // Ignore floor resets/teleports, not wind.
    wind.current.lerp(velocity, 1 - Math.exp(-dt * 3));
    last.current.copy(camera.position);
    dust.uniforms.player.value.copy(camera.position);
    dust.uniforms.wind.value.copy(wind.current);
  });
  return (
    <group visible={active}>
      {/* Distant light/image only: the broken window still has solid sill/edges. */}
      <mesh
        position={[-12.5, 17.7, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={sky}
      >
        <planeGeometry args={[17, 8]} />
      </mesh>
      <mesh geometry={cracks} material={glow} />
      <points geometry={particles} material={dust} frustumCulled={false} />
      <pointLight
        position={[-8.5, 17.5, 0]}
        color="#6c76c1"
        intensity={32}
        distance={18}
      />
      <pointLight
        position={[7, 18, -1]}
        color="#71628e"
        intensity={10}
        distance={11}
      />
    </group>
  );
}
