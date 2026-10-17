import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Cinema } from './scene/Cinema'
import { Player } from './scene/Player'
import { Interface } from './ui/Interface'
import { emitGameEvent } from './game/events'
export function App(){const [target,setTarget]=useState<string|null>(null);useEffect(()=>{emitGameEvent('floor2_enter')},[]);return <main><Canvas shadows camera={{fov:68,near:.1,far:60}}><Suspense fallback={null}><Cinema/><Player onTarget={setTarget}/></Suspense></Canvas><Interface target={target}/><div className="enter">화면을 클릭하여 탐색 시작</div></main>}
