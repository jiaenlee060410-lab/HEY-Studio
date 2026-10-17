import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/store'

const blockers = [
  {x:-5,z:0,w:.45,d:32},{x:5,z:0,w:.45,d:32},{x:0,z:-15,w:10,d:.45},{x:0,z:15,w:10,d:.45},
  ...[-9,-3,3,9].map(z=>({x:-3.9,z,w:.65,d:.65})),
  {x:1.8,z:4,w:5.6,d:.35},{x:-1.8,z:-4,w:5.6,d:.35}
]
const spawn = new THREE.Vector3(0,1.65,12)
export function Player({ onTarget }: {onTarget:(id:string|null)=>void}) {
  const controls = useRef<any>(null), keys = useRef(new Set<string>()), velocity = useRef(new THREE.Vector3())
  const { camera } = useThree(); const modal = useGame(s=>s.modal)
  useEffect(()=>{ camera.position.copy(spawn); const down=(e:KeyboardEvent)=>keys.current.add(e.code), up=(e:KeyboardEvent)=>keys.current.delete(e.code); window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}},[camera])
  useFrame((_,dt)=>{
    if (modal || !controls.current?.isLocked) { onTarget(null); return }
    const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y=0;forward.normalize(); const side = new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize()
    velocity.current.set(0,0,0); const speed=(keys.current.has('ShiftLeft')?5:3)*dt
    if(keys.current.has('KeyW'))velocity.current.addScaledVector(forward,speed); if(keys.current.has('KeyS'))velocity.current.addScaledVector(forward,-speed);if(keys.current.has('KeyA'))velocity.current.addScaledVector(side,-speed);if(keys.current.has('KeyD'))velocity.current.addScaledVector(side,speed)
    const next=camera.position.clone().add(velocity.current); const clear=blockers.every(b=>Math.abs(next.x-b.x)>b.w/2+.25||Math.abs(next.z-b.z)>b.d/2+.25);if(clear)camera.position.copy(next);camera.position.y=1.65
    const progress=useGame.getState()
    const targets=[
      ...(!progress.ticketCollected?[{id:'ticket',p:new THREE.Vector3(-2.9,1.18,9.4)}]:[]),
      {id:'seat',p:new THREE.Vector3(-1.5,1,2)},
      ...(!progress.boxUnlocked?[{id:'box',p:new THREE.Vector3(3.15,1.05,-8.2)}]:[]),
      ...(progress.boxUnlocked&&!progress.cinemaKeyCollected?[{id:'key',p:new THREE.Vector3(3.15,1.05,-8.2)}]:[]),
      {id:'door',p:new THREE.Vector3(0,1.65,-13.8)},
    ]
    // Low props such as the wooden box should be usable without pixel-perfect aim.
    let hit:string|null=null; let best=Infinity
    for(const t of targets){
      const offset=t.p.clone().sub(camera.position); const d=offset.length()
      offset.y=0; const horizontalDistance=offset.length(); const toward=offset.normalize()
      if(d<2.35&&horizontalDistance>0.01&&forward.dot(toward)>.55&&d<best){hit=t.id;best=d}
    }
    onTarget(hit)
  })
  return <PointerLockControls ref={controls} />
}
