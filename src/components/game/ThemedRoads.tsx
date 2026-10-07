import { useMemo } from "react";
import type { StageMap } from "@/game/maps";
import type { StageTheme } from "@/game/stageThemes";
import { getEnvironmentVisualProfile } from "@/game/environmentVisuals";

export function ThemedRoads({ map, theme }: { map: StageMap; theme: StageTheme }) {
  const profile = getEnvironmentVisualProfile(map.environmentId);
  const segments = useMemo(
    () => map.path.slice(1).map((b, i) => {
      const a = map.path[i]!;
      return {
        x: (a.x + b.x) / 2,
        z: (a.z + b.z) / 2,
        rot: Math.atan2(b.x - a.x, b.z - a.z),
        len: Math.hypot(b.x - a.x, b.z - a.z),
      };
    }),
    [map],
  );

  const urban =
    profile.roadStyle === "urban" ||
    profile.roadStyle === "industrial" ||
    profile.roadStyle === "military" ||
    profile.roadStyle === "blacksite";

  const marking =
    profile.roadStyle === "ice"
      ? "#dff8fa"
      : profile.roadStyle === "volcanic"
        ? "#e48b53"
        : profile.palette.roadAccent;

  return (
    <group>
      {map.path.map((point, index) => (
        <mesh key={"road-node-" + index} position={[point.x, 0.072, point.z]}>
          <cylinderGeometry args={[map.pathWidth * 0.58, map.pathWidth * 0.58, 0.08, 10]} />
          <meshStandardMaterial color={theme.path} flatShading />
        </mesh>
      ))}
      {segments.map((segment, index) => {
        const w = map.pathWidth;
        const bed = w + 0.36;
        const marks = urban ? Math.max(0, Math.floor(segment.len / 3.8)) : 0;
        return (
          <group
            key={"road-segment-" + index}
            position={[segment.x, 0, segment.z]}
            rotation-y={segment.rot}
          >
            <mesh position={[0, 0.055, 0]} receiveShadow>
              <boxGeometry args={[bed, 0.11, segment.len + 0.18]} />
              <meshStandardMaterial color={profile.palette.roadEdge} flatShading />
            </mesh>
            <mesh position={[0, 0.11, 0]} receiveShadow>
              <boxGeometry args={[w, 0.10, segment.len]} />
              <meshStandardMaterial color={theme.path} flatShading />
            </mesh>
            <mesh position={[-w / 2 - 0.07, 0.16, 0]}>
              <boxGeometry args={[0.12, 0.08, Math.max(0.5, segment.len - 0.18)]} />
              <meshStandardMaterial color={profile.palette.trim} flatShading />
            </mesh>
            <mesh position={[w / 2 + 0.07, 0.16, 0]}>
              <boxGeometry args={[0.12, 0.08, Math.max(0.5, segment.len - 0.18)]} />
              <meshStandardMaterial color={profile.palette.trim} flatShading />
            </mesh>
            {Array.from({ length: marks }, (_, markerIndex) => {
              const offset = (markerIndex + 0.5) * 3.8 - segment.len / 2;
              return (
                <mesh key={markerIndex} position={[0, 0.17, offset]}>
                  <boxGeometry args={[0.22, 0.025, 1.45]} />
                  <meshStandardMaterial color={marking} flatShading />
                </mesh>
              );
            })}
            {profile.roadStyle === "ice" && (
              <>
                <mesh position={[-0.12, 0.17, -segment.len * 0.18]} rotation-z={0.05}>
                  <boxGeometry args={[0.035, 0.02, Math.min(2.8, segment.len * 0.34)]} />
                  <meshStandardMaterial color={marking} transparent opacity={0.55} flatShading />
                </mesh>
                <mesh position={[0.12, 0.17, segment.len * 0.14]} rotation-z={-0.08}>
                  <boxGeometry args={[0.03, 0.02, Math.min(2.3, segment.len * 0.28)]} />
                  <meshStandardMaterial color={marking} transparent opacity={0.42} flatShading />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
