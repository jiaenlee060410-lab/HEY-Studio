import { Float, Html, RoundedBox, Sparkles } from '@react-three/drei'
import { useGame } from '../game/store'
import * as THREE from 'three'

const concrete = '#57534d', agedConcrete = '#3d3a35', velvet = '#4e1619', wood = '#2d1a11'

function Seat({ x, z, label, featured }: { x:number; z:number; label?:string; featured?:boolean }) {
  return <group position={[x,.38,z]} rotation={[0,(x % 2) * .025,0]}>
    <RoundedBox args={[1.02,.38,.72]} radius={.1} smoothness={4} castShadow receiveShadow><meshStandardMaterial color={velvet} roughness={.72}/></RoundedBox>
    <RoundedBox position={[0,.5,.24]} args={[1.02,.74,.14]} radius={.07} smoothness={4} castShadow><meshStandardMaterial color="#662126" roughness={.78}/></RoundedBox>
    {[-.4,.4].map(side=><mesh key={side} position={[side,.13,.18]} castShadow><cylinderGeometry args={[.032,.04,.42,8]}/><meshStandardMaterial color="#211c19" roughness={.58} metalness={.35}/></mesh>)}
    <RoundedBox position={[-.55,.32,.02]} args={[.08,.35,.55]} radius={.04} smoothness={3}><meshStandardMaterial color="#281313" roughness={.7}/></RoundedBox><RoundedBox position={[.55,.32,.02]} args={[.08,.35,.55]} radius={.04} smoothness={3}><meshStandardMaterial color="#281313" roughness={.7}/></RoundedBox>
    {label&&<Html position={[.58,.18,.15]} transform distanceFactor={8}><span className="seat-label">{label}</span></Html>}{featured&&<pointLight color="#f2a950" intensity={.75} distance={2.8}/>} 
  </group>
}
function Pillar({x,z}:{x:number;z:number}) { return <group position={[x,3,z]}><RoundedBox args={[.66,6,.66]} radius={.07} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={concrete} roughness={.92}/></RoundedBox><mesh position={[0,2.75,0]}><boxGeometry args={[.82,.15,.82]}/><meshStandardMaterial color="#686158" roughness={1}/></mesh></group> }
function WetPatch({x,z,scale=1}:{x:number;z:number;scale?:number}) { return <mesh position={[x,.012,z]} rotation={[-Math.PI/2,0,0]} scale={[scale,scale*.55,1]} receiveShadow><circleGeometry args={[1,32]}/><meshStandardMaterial color="#151a1a" transparent opacity={.55} roughness={.08} metalness={.75}/></mesh> }

export function Cinema(){ const s=useGame(); return <>
  <color attach="background" args={['#141311']}/><fog attach="fog" args={['#171512',10,33]}/><hemisphereLight args={['#d2c7b5','#171818',1.25]}/><ambientLight intensity={.22}/><directionalLight position={[-7,9,8]} intensity={2.8} color="#f7b65a" castShadow shadow-mapSize={[2048,2048]} shadow-camera-far={34}/><pointLight position={[0,4,-10]} color="#b69163" intensity={.35} distance={9}/><Sparkles count={150} scale={[9,5.4,28]} size={1.45} speed={.12} color="#efc183"/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[10,30]}/><meshStandardMaterial color="#373633" roughness={.38} metalness={.28}/></mesh><WetPatch x={-1.8} z={7} scale={1.4}/><WetPatch x={2.1} z={-5.5} scale={1.25}/><WetPatch x={-.5} z={-11} scale={.95}/>
  <mesh position={[0,6.15,0]} receiveShadow><boxGeometry args={[10,.3,30]}/><meshStandardMaterial color="#46433d" roughness={.96}/></mesh><mesh position={[0,3,-15]} receiveShadow><boxGeometry args={[10,6,.35]}/><meshStandardMaterial color={agedConcrete} roughness={.96}/></mesh><mesh position={[-4.9,3,0]} receiveShadow><boxGeometry args={[.2,6,30]}/><meshStandardMaterial color={agedConcrete} roughness={.95}/></mesh><mesh position={[4.9,3,0]} receiveShadow><boxGeometry args={[.2,6,30]}/><meshStandardMaterial color={agedConcrete} roughness={.95}/></mesh>
  {[-9,-3,3,9].flatMap(z=>[<Pillar key={'a'+z} x={-4.58} z={z}/>,<Pillar key={'b'+z} x={4.58} z={z}/>])}
  {[-10,-6,-2,2,6,10].map(z=><group key={z} position={[-4.77,3,z]}><mesh><boxGeometry args={[.05,2.55,2.25]}/><meshStandardMaterial color="#e8aa55" emissive="#b76625" emissiveIntensity={.45} transparent opacity={.72}/></mesh><mesh position={[.04,0,0]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.08,2.2,.06]}/><meshStandardMaterial color="#282521"/></mesh></group>)}
  <group>{[-1.5,0,1.5].flatMap(x=>[5,2,-1,-4].map(z=><Seat key={x+':'+z} x={x} z={z} label={s.ticketCollected&&x===-1.5&&z===2?'B12':undefined} featured={x===-1.5&&z===2}/>))}</group>
  <group position={[-2.9,.65,9.65]} rotation={[0,.22,0]}><RoundedBox args={[1.75,1.05,.55]} radius={.06} smoothness={3} castShadow><meshStandardMaterial color="#3a2820" roughness={.75}/></RoundedBox><mesh position={[0,.6,-.3]}><boxGeometry args={[1.5,.06,.05]}/><meshStandardMaterial color="#8b6b4b" roughness={.55}/></mesh></group>
  {!s.ticketCollected&&<Float speed={1.15} rotationIntensity={.1}><RoundedBox position={[-2.9,1.18,9.4]} rotation={[-1.45,.15,0]} args={[.5,.025,.25]} radius={.01} smoothness={2} castShadow><meshStandardMaterial color="#d6c19a" roughness={.66}/></RoundedBox></Float>}
  <group position={[3.15,.47,-8.2]}>{s.boxUnlocked&&<mesh position={[0,.47,-.22]} rotation={[-.55,0,0]} castShadow><boxGeometry args={[.76,.08,.5]}/><meshStandardMaterial color="#4b2d1c" roughness={.75}/></mesh>}<RoundedBox args={[.78,.42,.52]} radius={.045} smoothness={3} castShadow><meshStandardMaterial color={wood} roughness={.78}/></RoundedBox><mesh position={[0,.22,0]}><boxGeometry args={[.82,.025,.055]}/><meshStandardMaterial color="#876038" metalness={.3} roughness={.48}/></mesh><mesh position={[.7,.65,0]}><cylinderGeometry args={[.26,.26,1.5,16]}/><meshStandardMaterial color="#31302c" roughness={.7} metalness={.4}/></mesh></group>
  {s.boxUnlocked&&!s.cinemaKeyCollected&&<Float speed={1.2}><group position={[3.15,.98,-8.2]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.065,.065,.5,12]}/><meshStandardMaterial color="#bda876" metalness={.9} roughness={.28}/></mesh><mesh position={[0,.3,0]}><torusGeometry args={[.14,.03,8,16]}/><meshStandardMaterial color="#bda876" metalness={.9} roughness={.28}/></mesh></group></Float>}
  <group position={[0,1.8,-14.72]}>{!s.exitDoorUnlocked&&<RoundedBox castShadow position={[0,0,.1]} args={[2.15,3.75,.16]} radius={.04} smoothness={3}><meshStandardMaterial color="#2a1710" roughness={.72}/></RoundedBox>}<RoundedBox position={[0,0,-.04]} args={[2.5,4.15,.13]} radius={.05} smoothness={3}><meshStandardMaterial color="#5b5145" roughness={.92}/></RoundedBox></group>
  <Html position={[0,2.9,10]} center><div className="sign">2F · CINEMA<br/><small>MEMORY SYNC</small></div></Html>
</> }
