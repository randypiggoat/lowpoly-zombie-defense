import type { MapRect, StageMap } from "@/game/maps";
import { getEnvironmentVisualProfile } from "@/game/environmentVisuals";

function Crack({
  x, z, rotation, length,
}: {
  x: number; z: number; rotation: number; length: number;
}) {
  return (
    <mesh position={[x, 0.11, z]} rotation-z={-0.05} rotation-y={rotation}>
      <boxGeometry args={[0.045, 0.025, length]} />
      <meshBasicMaterial color="#4f7780" transparent opacity={0.85} />
    </mesh>
  );
}

function BrokenIce({ zone }: { zone: MapRect }) {
  const points: Array<[number, number, number]> = [
    [-0.24, -0.24, 0.25],
    [0.17, -0.08, -0.5],
    [-0.12, 0.24, 0.82],
    [0.30, 0.28, 1.18],
  ];
  return (
    <group position={[zone.x, 0, zone.z]}>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[zone.width, 0.11, zone.depth]} />
        <meshStandardMaterial color="#718f96" flatShading />
      </mesh>
      {points.map(([x, z, rotation], index) => (
        <Crack
          key={index}
          x={x * zone.width}
          z={z * zone.depth}
          rotation={rotation}
          length={Math.min(zone.width, zone.depth) * 0.46}
        />
      ))}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry
          args={[
            Math.max(zone.width, zone.depth) * 0.18,
            Math.max(zone.width, zone.depth) * 0.22,
            0.08,
            7,
          ]}
        />
        <meshStandardMaterial color="#a9d9df" transparent opacity={0.7} flatShading />
      </mesh>
    </group>
  );
}

export function MapSpecialTerrain({ map }: { map: StageMap }) {
  const zones = map.blockedZones ?? [];
  if (zones.length === 0) return null;
  const profile = getEnvironmentVisualProfile(map.environmentId);
  return (
    <group>
      {profile.roadStyle === "ice"
        ? zones.map((zone, index) => <BrokenIce key={zone.label + index} zone={zone} />)
        : null}
    </group>
  );
}
