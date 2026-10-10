import type { StageEnvironmentId } from "@/game/stageEnvironments";
import { getEnvironmentVisualProfile } from "@/game/environmentVisuals";

type Props = {
  environmentId: StageEnvironmentId;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  index: number;
};

function Mat({ color, emissive }: { color: string; emissive?: string }) {
  if (emissive) {
    return (
      <meshStandardMaterial
        color={color}
        flatShading
        emissive={emissive}
        emissiveIntensity={0.2}
      />
    );
  }
  return <meshStandardMaterial color={color} flatShading />;
}

function Shell({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <Mat color={color} />
    </mesh>
  );
}

function Roof({
  w, d, y, color, sides = 4,
}: {
  w: number; d: number; y: number; color: string; sides?: 4 | 6 | 8;
}) {
  return (
    <mesh position={[0, y, 0]} rotation-y={sides === 4 ? Math.PI / 4 : 0} castShadow>
      <coneGeometry args={[Math.min(w, d) * 0.62, 0.5, sides]} />
      <Mat color={color} />
    </mesh>
  );
}

function GabledRoof({ w, d, y, color }: { w: number; d: number; y: number; color: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[-w * 0.22, 0.12, 0]} rotation-z={0.42} castShadow>
        <boxGeometry args={[w * 0.62, 0.18, d * 1.10]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[w * 0.22, 0.12, 0]} rotation-z={-0.42} castShadow>
        <boxGeometry args={[w * 0.62, 0.18, d * 1.10]} />
        <Mat color={color} />
      </mesh>
    </group>
  );
}

export function ThemedBuilding({ environmentId, label, x, z, width, depth, height, index }: Props) {
  const profile = getEnvironmentVisualProfile(environmentId);
  const style = profile.buildingStyle;
  const w = Math.max(1.1, width);
  const d = Math.max(1.1, depth);
  const h =
    style === "city"
      ? Math.max(4.2, height * 2.15)
      : style === "industrial" || style === "foundry" || style === "blacksite"
        ? Math.max(1.35, height * 1.12)
        : Math.max(0.9, height);

  // Alternate two coordinated facade colors so neighboring structures do not look cloned.
  const shell = index % 2 === 0 ? profile.palette.building : profile.palette.buildingAlt;
  const alt = index % 2 === 0 ? profile.palette.buildingAlt : profile.palette.building;
  const trim = profile.palette.trim;
  const roof = profile.palette.roof;
  const glass = profile.palette.glass;
  const key = environmentId + "-" + label + "-" + index;

  if (style === "city") {
    return (
      <group key={key} position={[x, 0, z]}>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[w + 0.18, 0.16, d + 0.18]} />
          <Mat color={profile.palette.roadEdge} />
        </mesh>
        <Shell w={w} h={h} d={d} color={shell} />
        {/* Individual window panes read more clearly than broad glass bands at phone scale. */}
        {[0, 1, 2].flatMap((column) =>
          [0.21, 0.42, 0.63, 0.84].map((ratio) => (
            <mesh key={`front-window-${column}-${ratio}`} position={[(column - 1) * w * 0.26, h * ratio, d / 2 + 0.035]}>
              <boxGeometry args={[Math.max(0.16, w * 0.15), Math.max(0.13, h * 0.035), 0.05]} />
              <Mat color={glass} emissive={glass} />
            </mesh>
          )),
        )}
        {[0, 1].flatMap((column) =>
          [0.34, 0.62].map((ratio) => (
            <mesh key={`side-window-${column}-${ratio}`} position={[w / 2 + 0.035, h * ratio, (column - 0.5) * d * 0.42]} rotation-y={Math.PI / 2}>
              <boxGeometry args={[Math.max(0.16, d * 0.14), Math.max(0.14, h * 0.045), 0.05]} />
              <Mat color={glass} emissive={glass} />
            </mesh>
          )),
        )}
        <mesh position={[0, h + 0.045, 0]} castShadow>
          <boxGeometry args={[w + 0.08, 0.14, d + 0.08]} />
          <Mat color={trim} />
        </mesh>
        <mesh position={[-w * 0.24, h + 0.24, -d * 0.18]} castShadow>
          <boxGeometry args={[Math.max(0.28, w * 0.22), 0.22, Math.max(0.28, d * 0.24)]} />
          <Mat color={alt} />
        </mesh>
        <mesh position={[w * 0.22, h + 0.26, -d * 0.18]} castShadow>
          <boxGeometry args={[Math.max(0.22, w * 0.17), 0.26, Math.max(0.22, d * 0.18)]} />
          <Mat color={trim} />
        </mesh>
        <mesh position={[-w * 0.18, h + 0.55, 0]} castShadow>
          <boxGeometry args={[0.16, 0.78, 0.16]} />
          <Mat color={trim} />
        </mesh>
      </group>
    );
  }

  if (style === "market" || style === "desert") {
    return (
      <group key={key} position={[x, 0, z]}>
        <mesh position={[0, 0.07, 0]} receiveShadow>
          <boxGeometry args={[w + 0.16, 0.14, d + 0.16]} />
          <Mat color={profile.palette.roadEdge} />
        </mesh>
        <Shell w={w} h={h} d={d} color={shell} />
        <mesh position={[0, h * 0.58, d / 2 + 0.08]} castShadow>
          <boxGeometry args={[w * 0.90, 0.18, 0.52]} />
          <Mat color={trim} />
        </mesh>
        {[-1, 0, 1].map((slot) => (
          <mesh key={slot} position={[slot * w * 0.25, h * 0.58, d / 2 + 0.35]}>
            <boxGeometry args={[Math.max(0.16, w * 0.20), 0.16, 0.035]} />
            <Mat color={slot === 0 ? alt : (slot < 0 ? trim : roof)} />
          </mesh>
        ))}
        <mesh position={[0, h * 0.34, d / 2 + 0.04]}>
          <boxGeometry args={[w * 0.58, h * 0.34, 0.05]} />
          <Mat color={glass} emissive={glass} />
        </mesh>
        <mesh position={[-w * 0.32, h * 0.30, d / 2 + 0.18]}>
          <boxGeometry args={[0.08, Math.max(0.3, h * 0.48), 0.08]} />
          <Mat color={trim} />
        </mesh>
        <mesh position={[w * 0.32, h * 0.30, d / 2 + 0.18]}>
          <boxGeometry args={[0.08, Math.max(0.3, h * 0.48), 0.08]} />
          <Mat color={trim} />
        </mesh>
        <Roof w={w} d={d} y={h + 0.28} color={roof} />
        {style === "desert" && (
          <>
            <mesh position={[-w * 0.34, h * 0.52, 0]}>
              <boxGeometry args={[0.10, 0.9, 0.10]} />
              <Mat color={trim} />
            </mesh>
            <mesh position={[w * 0.34, h * 0.52, 0]}>
              <boxGeometry args={[0.10, 0.9, 0.10]} />
              <Mat color={trim} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (style === "residential" || style === "farm" || style === "forest") {
    return (
      <group key={key} position={[x, 0, z]}>
        <mesh position={[0, 0.07, 0]} receiveShadow>
          <boxGeometry args={[w + 0.16, 0.14, d + 0.16]} />
          <Mat color={profile.palette.roadEdge} />
        </mesh>
        <Shell w={w} h={h} d={d} color={shell} />
        {/* Door, paired windows, porch and gabled roof form a readable house silhouette. */}
        <mesh position={[0, Math.max(0.32, h * 0.25), d / 2 + 0.045]}>
          <boxGeometry args={[Math.max(0.23, w * 0.22), Math.max(0.48, h * 0.48), 0.07]} />
          <Mat color={alt} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * w * 0.28, h * 0.63, d / 2 + 0.045]}>
            <boxGeometry args={[Math.max(0.22, w * 0.17), Math.max(0.18, h * 0.17), 0.06]} />
            <Mat color={glass} emissive={glass} />
          </mesh>
        ))}
        <mesh position={[0, h * 0.52, d / 2 + 0.13]} castShadow>
          <boxGeometry args={[Math.max(0.58, w * 0.42), 0.10, 0.34]} />
          <Mat color={roof} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * w * 0.17, h * 0.31, d / 2 + 0.22]}>
            <boxGeometry args={[0.07, Math.max(0.28, h * 0.34), 0.07]} />
            <Mat color={trim} />
          </mesh>
        ))}
        <mesh position={[0, 0.14, d / 2 + 0.15]} receiveShadow>
          <boxGeometry args={[Math.max(0.68, w * 0.54), 0.14, 0.44]} />
          <Mat color={trim} />
        </mesh>
        <GabledRoof w={w} d={d} y={h + 0.20} color={roof} />
        {style === "farm" && (
          <mesh position={[-w * 0.25, h + 0.62, 0]}>
            <coneGeometry args={[0.12, 0.85, 6]} />
            <Mat color={trim} />
          </mesh>
        )}
        {style === "forest" && (
          <mesh position={[0, h + 0.52, -d * 0.18]}>
            <coneGeometry args={[0.20, 0.82, 6]} />
            <Mat color={trim} />
          </mesh>
        )}
      </group>
    );
  }

  if (style === "river" || style === "mangrove" || style === "harbor") {
    const raisedH = Math.max(0.85, h * 0.76);
    return (
      <group key={key} position={[x, 0, z]}>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={sx + ":" + sz} position={[sx * w * 0.38, h * 0.18, sz * d * 0.34]}>
              <boxGeometry args={[0.16, Math.max(0.65, h * 0.55), 0.16]} />
              <Mat color={trim} />
            </mesh>
          )),
        )}
        <mesh position={[0, h * 0.18 + raisedH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, raisedH, d]} />
          <Mat color={shell} />
        </mesh>
        <mesh position={[0, h * 0.18 + raisedH * 0.55, d / 2 + 0.035]}>
          <boxGeometry args={[w * 0.58, raisedH * 0.30, 0.05]} />
          <Mat color={glass} emissive={glass} />
        </mesh>
        <Roof w={w} d={d} y={h * 0.18 + raisedH + 0.25} color={roof} />
      </group>
    );
  }

  if (style === "ice-lab" || style === "cavern") {
    return (
      <group key={key} position={[x, 0, z]}>
        <Shell w={w} h={h} d={d} color={shell} />
        <mesh position={[0, h * 0.52, d / 2 + 0.035]}>
          <boxGeometry args={[w * 0.64, h * 0.34, 0.05]} />
          <Mat color={glass} emissive={glass} />
        </mesh>
        {style === "ice-lab" ? (
          <Roof w={w} d={d} y={h + 0.30} color={roof} />
        ) : (
          <>
            <mesh position={[0, h + 0.30, 0]} rotation-y={Math.PI / 4}>
              <coneGeometry args={[Math.min(w, d) * 0.68, 0.62, 6]} />
              <Mat color={trim} />
            </mesh>
            <mesh position={[0, h + 0.76, 0]} rotation-y={Math.PI / 4}>
              <coneGeometry args={[Math.min(w, d) * 0.42, 0.48, 6]} />
              <Mat color={alt} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (style === "ruins" || style === "graveyard" || style === "canyon" || style === "mine" || style === "volcano") {
    const stone = style === "canyon" || style === "volcano" ? alt : shell;
    return (
      <group key={key} position={[x, 0, z]}>
        <Shell w={w} h={h} d={d} color={stone} />
        <mesh position={[0, h * 0.55, d / 2 + 0.04]}>
          <boxGeometry args={[w * 0.44, h * 0.50, 0.06]} />
          <Mat color={trim} />
        </mesh>
        {style === "graveyard" ? (
          <>
            <Roof w={w * 0.86} d={d * 0.72} y={h + 0.50} color={roof} />
            <mesh position={[0, h + 1.02, 0]}>
              <coneGeometry args={[0.22, 0.9, 5]} />
              <Mat color={trim} />
            </mesh>
          </>
        ) : (
          <Roof w={w} d={d} y={h + 0.28} color={roof} sides={style === "canyon" || style === "volcano" ? 6 : 4} />
        )}
      </group>
    );
  }

  if (style === "military" || style === "industrial" || style === "foundry" || style === "blacksite") {
    return (
      <group key={key} position={[x, 0, z]}>
        <Shell w={w} h={h} d={d} color={shell} />
        <mesh position={[0, h * 0.27, d / 2 + 0.04]}>
          <boxGeometry args={[w * 0.62, Math.max(0.24, h * 0.34), 0.05]} />
          <Mat color={glass} emissive={glass} />
        </mesh>
        <mesh position={[0, h + 0.12, 0]}>
          <boxGeometry args={[w * 0.86, 0.22, d * 0.82]} />
          <Mat color={roof} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * w * 0.28, h + 0.34, 0]}>
            <cylinderGeometry args={[0.08, 0.11, 0.45, 6]} />
            <Mat color={trim} />
          </mesh>
        ))}
        {style === "blacksite" && (
          <mesh position={[0, h + 0.48, 0]}>
            <cylinderGeometry args={[Math.min(w, d) * 0.12, Math.min(w, d) * 0.12, 0.18, 8]} />
            <Mat color={trim} emissive={trim} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group key={key} position={[x, 0, z]}>
      <Shell w={w} h={h} d={d} color={shell} />
      <Roof w={w} d={d} y={h + 0.25} color={roof} />
    </group>
  );
}
