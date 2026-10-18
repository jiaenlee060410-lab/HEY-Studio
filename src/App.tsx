import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, Component, type ReactNode } from "react";
import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";
import { Cinema } from "./scene/Cinema";
import { Player } from "./scene/Player";
import { UpperFloors } from "./scene/UpperFloors";
import { Interface } from "./ui/Interface";
import { useGame } from "./game/store";
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal">
        3D 장면을 불러올 수 없습니다. Chrome의 하드웨어 가속을 켜고 새로 고침해
        주세요.
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  useEffect(() => {
    try {
      localStorage.removeItem("recall-memory-sync-floor2");
    } catch {
      /* Storage-disabled browsers still play. */
    }
    useGame.getState().resetGame();
  }, []);
  return (
    <main>
      <SceneBoundary>
        <Canvas
          shadows
          camera={{ fov: 65, near: 0.05, far: 95, position: [0, 1.65, 18] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = PCFSoftShadowMap;
            gl.toneMappingExposure = 1.1;
          }}
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
              <Cinema />
              <UpperFloors />
              <Player />
            </Physics>
          </Suspense>
        </Canvas>
      </SceneBoundary>
      <Interface />
    </main>
  );
}
