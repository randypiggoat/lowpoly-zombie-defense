import { Canvas } from "@react-three/fiber";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Scene } from "./Scene";
import { HUD } from "./HUD";
import { game } from "@/game/engine";

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
  const [selected, setSelected] = useState<number | null>(1);

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2, 26, 30], fov: 40 }}
        onPointerMissed={() => setSelected(null)}
      >
        <Scene towers={state.towers} selected={selected} onSelect={setSelected} />
      </Canvas>
      <HUD state={state} selected={selected} onSelect={setSelected} />
    </div>
  );
}
