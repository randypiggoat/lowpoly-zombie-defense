import { Canvas } from "@react-three/fiber";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Scene, type Selection } from "./Scene";
import { HUD } from "./HUD";
import { game } from "@/game/engine";
import { unlockAudio } from "@/game/audio";

function useGameSnapshot() {
  const [, force] = useState(0);
  // engine emits on gold/wave/hp changes; poll lightly for smooth counters
  useSyncExternalStore(
    (cb) => game.subscribe(cb),
    () => game.state.gold + game.state.wave * 1000,
    () => 0,
  );
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);
  return game.state;
}

export function GameCanvas() {
  const state = useGameSnapshot();
  const [selection, setSelection] = useState<Selection>(null);

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky" onPointerDown={() => unlockAudio()}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2, 26, 30], fov: 40 }}
        onPointerMissed={() => setSelection(null)}
      >
        <Scene
          towers={state.towers}
          selection={selection}
          onSelectTower={(id) => setSelection({ kind: "tower", id })}
          onSelectSpot={(index) => setSelection({ kind: "spot", index })}
        />
      </Canvas>
      <HUD state={state} selection={selection} onSelect={setSelection} />
    </div>
  );
}
