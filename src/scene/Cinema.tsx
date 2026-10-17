import { Float, Html, Sparkles } from '@react-three/drei'
import { useGame } from '../game/store'
import * as THREE from 'three'
const concrete='#4c4a45', velvet='#581b1d', wood='#382419'
function Seat({x,z,label,featured}:{x:number;z:number;label?:string;featured?:boolean}){return <group position={[x,.45,z]}><mesh castShadow receiveShadow><boxGeometry args={[1.05,.75,.8]}/><meshStandardMaterial color={velvet} roughness={.9}/></mesh><mesh position={[0,.65,.35]} castShadow><boxGeometry args={[1.05,.65,.16]}/><meshStandardMaterial color="#6f2927" roughness={.85}/></mesh>{label&&<Html position={[.58,.2,.15]} transform distanceFactor={8}><span className="seat-label">{label}</span></Html>}{featured&&<pointLight color="#ffb65a" intensity={1.1} distance={3}/>}</group>}
function Pillar({x,z}:{x:number;z:number}){return <mesh position={[x,3,z]} castShadow receiveShadow><boxGeometry args={[.7,6,.7]}/><meshStandardMaterial color={concrete} roughness={.92}/></mesh>}
export function Cinema(){const s=useGame();return <>
  <color attach="background" args={['#11100e']}/><fog attach="fog" args={['#11100e',9,31]}/><ambientLight intensity={.32}/><directionalLight position={[-7,8,7]} intensity={2.1} color="#ffb25d" castShadow shadow-mapSize={[2048,2048]}/><Sparkles count={100} scale={[9,5,28]} size={2} speed={.15} color="#e5b572"/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[10,30]}/><meshStandardMaterial color="#2b2925" roughness={.45} metalness={.22}/></mesh>
  <mesh position={[0,3,-15]} receiveShadow><boxGeometry args={[10,6,.4]}/><meshStandardMaterial color={concrete} roughness={.95}/></mesh><mesh position={[0,6,0]} receiveShadow><boxGeometry args={[10,.35,30]}/><meshStandardMaterial color="#373530" roughness={1}/></mesh>
  {[-9,-3,3,9].flatMap(z=>[<Pillar key={'a'+z} x={-4.65} z={z}/>,<Pillar key={'b'+z} x={4.65} z={z}/>])}
  {[-10,-6,-2,2,6,10].map(z=><group key={z} position={[-4.78,3,z]}><mesh><boxGeometry args={[.08,2.4,2.4]}/><meshStandardMaterial color="#e7ae5d" emissive="#9a5b20" emissiveIntensity={.3}/></mesh></group>)}
  <group>{[-1.5,0,1.5].flatMap(x=>[5,2,-1,-4].map(z=><Seat key={x+':'+z} x={x} z={z} label={x===1.5&&z===-1?'B12':undefined} featured={x===-1.5&&z===5}/>))}</group>
  {!s.ticketCollected&&<Float speed={1}><mesh position={[-1.5,1.18,5]} rotation={[-1.4,.2,0]} castShadow><boxGeometry args={[.48,.02,.24]}/><meshStandardMaterial color="#d3b88d" roughness={.7}/></mesh></Float>}
  <mesh position={[1.7,.48,-.1]} castShadow><boxGeometry args={[.75,.42,.5]}/><meshStandardMaterial color={wood} roughness={.75}/></mesh>
  {s.boxUnlocked&&!s.cinemaKeyCollected&&<Float><mesh position={[1.7,.92,-.1]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.07,.07,.55,12]}/><meshStandardMaterial color="#b5a17b" metalness={.85} roughness={.35}/></mesh></Float>}
  <group position={[0,1.8,-14.72]} rotation={[0,0,0]}>{!s.exitDoorUnlocked&&<mesh castShadow position={[0,0,.1]}><boxGeometry args={[2.2,3.8,.18]}/><meshStandardMaterial color="#2c1b12" roughness={.8}/></mesh>}<mesh position={[0,0,-.04]}><boxGeometry args={[2.5,4.2,.14]}/><meshStandardMaterial color="#58463a" roughness={.9}/></mesh></group>
  <Html position={[0,2.9,10]} center><div className="sign">2F · CINEMA<br/><small>MEMORY SYNC</small></div></Html>
</>}
