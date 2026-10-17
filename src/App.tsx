import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Cinema } from './scene/Cinema'
import { Player } from './scene/Player'
import { Interface } from './ui/Interface'
import { emitGameEvent } from './game/events'
import { useGame } from './game/store'
export function App(){const [target,setTarget]=useState<string|null>(null);useEffect(()=>{localStorage.removeItem('recall-memory-sync-floor2');useGame.getState().reset();emitGameEvent('floor2_enter')},[]);return <main><Canvas shadows camera={{fov:68,near:.1,far:60}} dpr={[1,1.5]}><Suspense fallback={null}><Cinema/><Player onTarget={setTarget}/></Suspense></Canvas><Interface target={target}/><div className="enter">화면을点击以开始探索</div></main>}
