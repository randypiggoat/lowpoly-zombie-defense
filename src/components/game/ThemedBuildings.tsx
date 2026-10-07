import type { StageEnvironmentId } from "@/game/stageEnvironments";
import { getEnvironmentVisualProfile } from "@/game/environmentVisuals";

type Props = {
  environmentId: StageEnvironmentId;
  label: string;
  width: number;
  depth: number;
  height: number;
  index: number;
};

function Mat({ color, emissive }: { color: string; emissive?: string }) {
  return (
    <meshStandardMaterial
      color={color}
      flatShading
      emissive={emissive}
      emissiveIntensity={emissive ? 0.2 : 0}
    />
  );
}

function Shell({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  return (
    <mesh castShadow receiveShadow>
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

export function ThemedBuilding({ environmentId, label, width, depth, height, index }: Props) {
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

  const shell = profile.palette.building;
  const alt = profile.palette.buildingAlt;
  const trim = profile.palette.trim;
  const roof = profile.palette.roof;
  const glass = profile.palette.glass;
  const key = environmentId + "-" + label + "-" + index;

  if (style === "city") {
    return (
      <group key={key}>
        <Shell w={w} h={h} d={d} color={shell} />
        {[0.24, 0.45, 0.66, 0.87].map((ratio) => (
          <mesh key={ratio} position={[0, h * ratio, d / 2 + 0.025]}>
            <boxGeometry args={[Math.max(0.55, w * 0.76), 0.10, 0.05]} />
            <Mat color={glass} emissive={glass} />
          </mesh>
        ))}
        <mesh position={[w * 0.15, h + 0.17, 0]} castShadow>
          <boxGeometry args={[w * 0.72, 0.30, d * 0.76]} />
          <Mat color={alt} />
        </mesh>
        <mesh position={[-w * 0.2, h + 0.55, 0]}>
          <boxGeometry args={[0.20, 0.82, 0.20]} />
          <Mat color={trim} />
        </mesh>
      </group>
    );
  }

  if (style === "market" || style === "desert") {
    return (
      <group key={key}>
        <Shell w={w} h={h} d={d} color={shell} />
        <mesh position={[0, h * 0.58, d / 2 + 0.08]}>
          <boxGeometry args={[w * 0.84, 0.18, 0.52]} />
          <Mat color={trim} />
        </mesh>
        <mesh position={[0, h * 0.34, d / 2 + 0.04]}>
          <boxGeometry args={[w * 0.58, h * 0.34, 0.05]} />
          <Mat color={glass} emissive={glass} />
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
      <group key={key}>
        <Shell w={w} h={h} d={d} color={shell} />
        <mesh position={[w * 0.23, h * 0.30, d / 2 + 0.03]}>
          <boxGeometry args={[Math.max(0.24, w * 0.18), Math.max(0.35, h * 0.45), 0.06]} />
          <Mat color={trim} />
        </mesh>
        <mesh position={[-w * 0.22, h * 0.58, d / 2 + 0.035]}>
          <boxGeometry args={[Math.max(0.26, w * 0.18), Math.max(0.18, h * 0.18), 0.05]} />
          <Mat color={glass} emissive={glass} />
        </mesh>
        <Roof w={w} d={d} y={h + 0.28} color={roof} />
        {style === "farm" && (
          <mesh position={[-w * 0.25, h + 0.58, 0]}>
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
      <group key={key}>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={sx + ":" + sz} position={[sx * w * 0.38, h * 0.18, sz * d * 0.34]}>
              <boxGeometry args={[0.16, Math.max(0.65, h * 0.55), 0.16]} />
              <Mat color={trim} />
            </mesh>
          )),
        )}
        <mesh position={[0, h * 0.18, 0]} castShadow receiveShadow>
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
      <group key={key}>
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
      <group key={key}>
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
      <group key={key}>
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
    <group key={key}>
      <Shell w={w} h={h} d={d} color={shell} />
      <Roof w={w} d={d} y={h + 0.25} color={roof} />
    </group>
  );
}
