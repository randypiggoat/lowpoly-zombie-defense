import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cosmeticForTower } from "@/game/collection";
import { getStageTheme, type StageTheme } from "@/game/stageThemes";
import { getEnemyHealthBarPresentation } from "@/game/enemyPresentation";
import { getSceneRenderQuality } from "@/game/renderQuality";
import { canPlaceTower, distanceToPath, getStageMapByStageId, getPathLength, pointAtPath, snapBuildPosition } from "@/game/maps";
import { gorePartBit, type GorePart } from "@/game/enemyGore";
import { profile } from "@/game/profile";
import { TowerModel } from "./TowerModel";
import { StageEnvironment } from "./StageEnvironment";
import { CombatVFX } from "./CombatVFX";
import {
  TOWER_INFO,
  MAX_ACTIVE_BULLETS,
  game,
  towerLevel,
  towerRange,
  type Tower,
} from "@/game/engine";

const MAX_ZOMBIES = 60;
const MAX_BULLETS = MAX_ACTIVE_BULLETS;
const MAX_GIBS = 96;

const GIB_COLORS = ["#8c2b2b", "#a83c3c", "#6f8f5a"];

const BOSS_SIGNATURE_COLORS: Record<number, string> = {
  2: "#ef7d43",
  3: "#f0c75e",
  4: "#ff8b45",
  5: "#70d6e3",
  6: "#d98adf",
  7: "#9ce06d",
};

const ZOMBIE_LOOKS = [
  { skin: "#6f9f55", cloth: "#42513f", legs: "#35404a" },
  { skin: "#e4ad37", cloth: "#c9662d", legs: "#6f452d" },
  { skin: "#8f332f", cloth: "#5d2428", legs: "#3f292d" },
  { skin: "#89a36c", cloth: "#53614a", legs: "#36443d" },
  { skin: "#c7b59b", cloth: "#8b4c35", legs: "#4c3940" },
  { skin: "#9bb4b7", cloth: "#3f5960", legs: "#2e3c43" },
  { skin: "#d49aa5", cloth: "#6a4d63", legs: "#40384d" },
  { skin: "#77b85b", cloth: "#35583d", legs: "#2e4035" },
] as const;

export type Selection =
  | { kind: "tower"; id: number }
  | { kind: "spot"; position: { x: number; z: number } }
  | null;

/* ---------------- ground, path, props ---------------- */

function Ground({ theme, map }: { theme: StageTheme; map: ReturnType<typeof getStageMapByStageId> }) {
  const segments = useMemo(() => {
    const out: { x: number; z: number; rot: number; len: number }[] = [];
    for (let i = 1; i < map.path.length; i++) {
      const a = map.path[i - 1]!;
      const b = map.path[i]!;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      out.push({
        x: (a.x + b.x) / 2,
        z: (a.z + b.z) / 2,
        rot: Math.atan2(b.x - a.x, b.z - a.z),
        len: len + map.pathWidth,
      });
    }
    return out;
  }, [map]);

  const facets = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + i;
        const r = 12 + ((i * 7) % 22);
        return { a, r, i };
      }),
    [],
  );

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={theme.ground} flatShading />
      </mesh>
      {facets.map(({ a, r, i }) => (
        <mesh
          key={i}
          position={[Math.cos(a) * r, 0.02 + (i % 3) * 0.02, Math.sin(a) * r]}
          rotation={[-Math.PI / 2, 0, a]}
          receiveShadow
        >
          <circleGeometry args={[2.2 + (i % 4) * 0.9, 5]} />
          <meshStandardMaterial color={i % 2 ? theme.groundAlt : theme.ground} flatShading />
        </mesh>
      ))}
      {segments.map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, 0.07, s.z]} rotation-y={s.rot} receiveShadow>
            <boxGeometry args={[map.pathWidth, 0.14, s.len]} />
            <meshStandardMaterial color={theme.path} flatShading />
          </mesh>
          <mesh position={[s.x, 0.15, s.z]} rotation-y={s.rot}>
            <boxGeometry args={[0.18, 0.025, Math.max(1, s.len - 0.7)]} />
            <meshStandardMaterial color={theme.pathEdge} transparent opacity={0.72} flatShading />
          </mesh>
          {Array.from({ length: Math.max(1, Math.floor(s.len / 4)) }, (_, markerIndex) => {
            const directionX = Math.sin(s.rot);
            const directionZ = Math.cos(s.rot);
            const offset = (markerIndex + 0.5) * 4 - s.len * 0.5;
            return (
              <mesh
                key={markerIndex}
                position={[
                  s.x + directionX * offset,
                  0.17,
                  s.z + directionZ * offset,
                ]}
                rotation-y={s.rot}
              >
                <boxGeometry args={[0.32, 0.025, 1.15]} />
                <meshStandardMaterial color={theme.marker} flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function MapObstacles({ map }: { map: ReturnType<typeof getStageMapByStageId> }) {
  return (
    <group>
      {map.obstacles.map((obstacle, index) => {
        const label = obstacle.label.toLowerCase();
        const x = obstacle.x;
        const z = obstacle.z;
        const w = obstacle.width;
        const d = obstacle.depth;
        const h = obstacle.height;

        if (label.includes("house")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#b96d52" flatShading />
              </mesh>
              <mesh position={[0, h / 2 + 0.32, 0]} rotation-y={Math.PI / 4} castShadow>
                <coneGeometry args={[Math.min(w, d) * 0.66, 0.68, 4]} />
                <meshStandardMaterial color="#5c3f3d" flatShading />
              </mesh>
              <mesh position={[0, h * 0.5, d / 2 + 0.02]}>
                <boxGeometry args={[w * 0.24, h * 0.32, 0.04]} />
                <meshStandardMaterial color="#8fd2d8" emissive="#8fd2d8" emissiveIntensity={0.18} flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("garage")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#7a7e83" flatShading />
              </mesh>
              <mesh position={[0, -h * 0.06, d / 2 + 0.03]}>
                <boxGeometry args={[w * 0.7, h * 0.58, 0.06]} />
                <meshStandardMaterial color="#3f454c" flatShading />
              </mesh>
              <mesh position={[0, h / 2 + 0.24, 0]} rotation-y={Math.PI / 4}>
                <coneGeometry args={[Math.min(w, d) * 0.62, 0.46, 4]} />
                <meshStandardMaterial color="#4b5057" flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("garden")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d * 0.55]} />
                <meshStandardMaterial color="#a29a87" flatShading />
              </mesh>
              {[-0.3, 0.3].map((offset) => (
                <mesh key={offset} position={[offset * w, h + 0.24, 0]} castShadow>
                  <coneGeometry args={[0.32, 0.52, 6]} />
                  <meshStandardMaterial color="#3e7f52" flatShading />
                </mesh>
              ))}
            </group>
          );
        }

        if (label.includes("canopy")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, 0, z]}>
              <mesh position={[0, h, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, 0.14, d]} />
                <meshStandardMaterial color="#d8d0bd" flatShading />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * w * 0.38, h / 2, 0]} castShadow>
                  <boxGeometry args={[0.12, h, 0.12]} />
                  <meshStandardMaterial color="#a24c3e" flatShading />
                </mesh>
              ))}
              <mesh position={[0, h + 0.34, 0]} castShadow>
                <boxGeometry args={[1.65, 0.24, 0.42]} />
                <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.18} flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("pump")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, 0, z]}>
              <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, 0.28, d]} />
                <meshStandardMaterial color="#cfc7b5" flatShading />
              </mesh>
              {[-0.34, 0.34].map((px) => (
                <group key={px} position={[px, 0.7, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.28, 1.05, 0.18]} />
                    <meshStandardMaterial color="#d8d4c9" flatShading />
                  </mesh>
                  <mesh position={[0, 0.16, 0.1]}>
                    <boxGeometry args={[0.14, 0.18, 0.03]} />
                    <meshStandardMaterial color="#63a9bb" emissive="#63a9bb" emissiveIntensity={0.35} flatShading />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }

        if (label.includes("storefront") || label.includes("shop") || label.includes("kiosk") || label.includes("food court")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#66747d" flatShading />
              </mesh>
              <mesh position={[0, h * 0.1, d / 2 + 0.04]}>
                <boxGeometry args={[w * 0.56, h * 0.42, 0.05]} />
                <meshStandardMaterial color="#9dd7dc" emissive="#9dd7dc" emissiveIntensity={0.16} flatShading />
              </mesh>
              <mesh position={[0, h * 0.64, d / 2 + 0.12]} castShadow>
                <boxGeometry args={[w * 0.82, 0.16, 0.5]} />
                <meshStandardMaterial color={label.includes("food") || label.includes("kiosk") ? "#e9b44c" : "#a04c42"} flatShading />
              </mesh>
              <mesh position={[0, h + 0.2, 0]} rotation-y={Math.PI / 4} castShadow>
                <coneGeometry args={[Math.min(w, d) * 0.58, 0.36, 4]} />
                <meshStandardMaterial color="#4d5660" flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("police station")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#5d6870" flatShading />
              </mesh>
              <mesh position={[0, h * 0.18, d / 2 + 0.05]}>
                <boxGeometry args={[w * 0.22, h * 0.56, 0.08]} />
                <meshStandardMaterial color="#2d3640" flatShading />
              </mesh>
              <mesh position={[0, h * 0.72, d / 2 + 0.08]}>
                <boxGeometry args={[w * 0.55, 0.2, 0.12]} />
                <meshStandardMaterial color="#4f9fcb" emissive="#4f9fcb" emissiveIntensity={0.3} flatShading />
              </mesh>
              <mesh position={[0, h + 0.32, 0]} rotation-y={Math.PI / 4}>
                <coneGeometry args={[Math.min(w, d) * 0.62, 0.48, 4]} />
                <meshStandardMaterial color="#3c4851" flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("impound")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#6d6f70" flatShading />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * w * 0.42, h + 0.34, d / 2]} castShadow>
                  <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
                  <meshStandardMaterial color="#a2a6a6" flatShading />
                </mesh>
              ))}
              <mesh position={[0, h + 0.56, d / 2]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.03, 0.03, w * 0.8, 6]} />
                <meshStandardMaterial color="#a2a6a6" flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("evidence")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#8d806b" flatShading />
              </mesh>
              {[[-0.35, -0.34], [0.35, 0.34]].map(([px, pz]) => (
                <mesh key={px + "-" + pz} position={[px * w, h + 0.16, pz * d]} castShadow>
                  <boxGeometry args={[0.35, 0.32, 0.35]} />
                  <meshStandardMaterial color="#ad6e48" flatShading />
                </mesh>
              ))}
              <mesh position={[0, h + 0.22, 0]} rotation-y={Math.PI / 4}>
                <coneGeometry args={[Math.min(w, d) * 0.55, 0.3, 4]} />
                <meshStandardMaterial color="#5f574e" flatShading />
              </mesh>
            </group>
          );
        }

        if (label.includes("median") || label.includes("jersey")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#8e9394" flatShading />
              </mesh>
              {[-1, 0, 1].map((side) => (
                <mesh key={side} position={[side * w * 0.3, h + 0.08, 0]}>
                  <boxGeometry args={[0.12, 0.09, d * 0.72]} />
                  <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.14} flatShading />
                </mesh>
              ))}
            </group>
          );
        }

        if (label.includes("service depot")) {
          return (
            <group key={obstacle.label + "-" + index} position={[x, h / 2, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#765d49" flatShading />
              </mesh>
              <mesh position={[0, h * 0.55, d / 2 + 0.04]}>
                <boxGeometry args={[w * 0.56, h * 0.34, 0.06]} />
                <meshStandardMaterial color="#4b5258" flatShading />
              </mesh>
              {[-0.35, 0.35].map((px) => (
                <mesh key={px} position={[px * w, h + 0.25, 0]} castShadow>
                  <cylinderGeometry args={[0.14, 0.14, 0.4, 8]} />
                  <meshStandardMaterial color="#d55c43" flatShading />
                </mesh>
              ))}
            </group>
          );
        }

        return (
          <mesh key={obstacle.label + "-" + index} position={[x, h / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#6f6b63" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1, 5]} />
        <meshStandardMaterial color="#6b4a33" flatShading />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.95, 1.7, 6]} />
        <meshStandardMaterial color="#2f6b45" flatShading />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <coneGeometry args={[0.7, 1.3, 6]} />
        <meshStandardMaterial color="#3a7d51" flatShading />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[0.3, position[0], 0.2]} castShadow>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#8d8f94" flatShading />
    </mesh>
  );
}

function Scenery({ count = 46, map }: { count?: number; map: ReturnType<typeof getStageMapByStageId> }) {
  const items = useMemo(() => {
    const trees: [number, number, number][] = [];
    const rocks: [number, number, number][] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < count; i++) {
      const x = (rnd() - 0.5) * 56;
      const z = (rnd() - 0.5) * 60 - 4;
      const clear =
        distanceToPath(map, { x, z }) >= 3.4 &&
        Math.hypot(x - map.base.x, z - map.base.z) >= 6 &&
        !map.obstacles.some((obstacle) =>
          x >= obstacle.x - obstacle.width / 2 - 2 &&
          x <= obstacle.x + obstacle.width / 2 + 2 &&
          z >= obstacle.z - obstacle.depth / 2 - 2 &&
          z <= obstacle.z + obstacle.depth / 2 + 2,
        );
      if (!clear) continue;
      if (rnd() > 0.25) trees.push([x, 0, z]);
      else rocks.push([x, 0.4, z]);
    }
    return { trees, rocks };
  }, [count, map]);

  return (
    <group>
      {items.trees.map((p, i) => (
        <Tree key={'t' + i} position={p} scale={0.85 + ((i * 13) % 5) * 0.12} />
      ))}
      {items.rocks.map((p, i) => (
        <Rock key={'r' + i} position={p} scale={0.6 + ((i * 7) % 4) * 0.2} />
      ))}
    </group>
  );
}

/* ---------------- base ---------------- */

function Base({ position }: { position: { x: number; z: number } }) {
  const flagRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.12;
    }
    if (beaconRef.current) beaconRef.current.rotation.y = clock.elapsedTime * 0.6;
    if (coreRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.1;
      coreRef.current.scale.setScalar(pulse);
    }
  });
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.4, 3.8, 0.7, 7]} />
        <meshStandardMaterial color="#9a9083" flatShading />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.9, 2.4, 6]} />
        <meshStandardMaterial color="#c9bfae" flatShading />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2.1, 1.5, 6]} />
        <meshStandardMaterial color="#b4553f" flatShading />
      </mesh>
      <mesh ref={flagRef} position={[0, 4.9, 0]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.08]} />
        <meshStandardMaterial color="#e9b44c" flatShading />
      </mesh>
      <group ref={beaconRef} position={[0, 3.78, 0]}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.52, 0.06, 5, 10]} />
          <meshStandardMaterial color="#79c7e3" emissive="#79c7e3" emissiveIntensity={0.45} transparent opacity={0.72} flatShading />
        </mesh>
        <mesh ref={coreRef} position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#79c7e3" emissive="#79c7e3" emissiveIntensity={1.1} flatShading />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.12, 0.42, 5]} />
          <meshStandardMaterial color="#cfeff4" flatShading />
        </mesh>
      </group>
      <mesh position={[0, 0.74, 1.58]} rotation-z={Math.PI / 2}>
        <boxGeometry args={[0.12, 0.08, 1.5]} />
        <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.18} flatShading />
      </mesh>
    </group>
  );
}

/* ---------------- free placement ---------------- */

function BuildSurface({
  map,
  selection,
  previewPosition,
  towers,
  onSelectPosition,
  onPreviewPosition,
}: {
  map: ReturnType<typeof getStageMapByStageId>;
  selection: Selection;
  previewPosition: { x: number; z: number } | null;
  towers: Tower[];
  onSelectPosition: (position: { x: number; z: number }) => void;
  onPreviewPosition: (position: { x: number; z: number } | null) => void;
}) {
  const surface = useRef<THREE.Group>(null);
  const mapRef = useRef(map);
  const previewCallbackRef = useRef(onPreviewPosition);
  const selectCallbackRef = useRef(onSelectPosition);
  mapRef.current = map;
  previewCallbackRef.current = onPreviewPosition;
  selectCallbackRef.current = onSelectPosition;

  const selected = selection?.kind === "spot" ? selection.position : null;
  const preview = previewPosition ?? selected;
  const placement = preview
    ? canPlaceTower(map, preview.x, preview.z, towers)
    : null;

  const { camera, gl, raycaster, pointer, scene } = useThree();

  const getMapPointFromClient = (clientX: number, clientY: number) => {
    if (!surface.current) return null;

    const rect = gl.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);

    const worldGround = surface.current.localToWorld(new THREE.Vector3(0, 0.012, 0));
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldGround.y);
    const hit = raycaster.ray.intersectPlane(ground, new THREE.Vector3());
    if (!hit) return null;

    const local = surface.current.worldToLocal(hit.clone());
    const activeMap = mapRef.current;
    if (
      local.x < activeMap.bounds.minX ||
      local.x > activeMap.bounds.maxX ||
      local.z < activeMap.bounds.minZ ||
      local.z > activeMap.bounds.maxZ
    ) {
      return null;
    }

    return snapBuildPosition(activeMap, local.x, local.z);
  };

  const rayHitsTower = () => {
    const hits = raycaster.intersectObjects(scene.children, true);
    return hits.some((hit) => {
      let object: THREE.Object3D | null = hit.object;
      while (object) {
        if (object.userData.rotwoodTowerId !== undefined) return true;
        object = object.parent;
      }
      return false;
    });
  };

  useEffect(() => {
    const element = gl.domElement;
    const previousTouchAction = element.style.touchAction;
    element.style.touchAction = "none";

    const handlePointerMove = (event: PointerEvent) => {
      previewCallbackRef.current(getMapPointFromClient(event.clientX, event.clientY));
    };

    const handlePointerDown = (event: PointerEvent) => {
      const point = getMapPointFromClient(event.clientX, event.clientY);
      if (!point || rayHitsTower()) return;
      previewCallbackRef.current(point);
      selectCallbackRef.current(point);
    };

    const handlePointerLeave = () => {
      previewCallbackRef.current(null);
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      element.style.touchAction = previousTouchAction;
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [camera, gl, pointer, raycaster, scene]);

  return (
    <group ref={surface}>
      <mesh
        position={[
          (map.bounds.minX + map.bounds.maxX) / 2,
          0.012,
          (map.bounds.minZ + map.bounds.maxZ) / 2,
        ]}
        // Keep the visual placement surface aligned to the playable XZ ground.
        // Pointer input is handled on the canvas so scenery cannot intercept it.
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[map.bounds.maxX - map.bounds.minX, map.bounds.maxZ - map.bounds.minZ]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {preview && placement && (
        <group position={[preview.x, 0.095, preview.z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.98, 24]} />
            <meshBasicMaterial
              color={placement.valid ? "#e9b44c" : "#e24b4b"}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.78, 0.96, 24]} />
            <meshBasicMaterial
              color={placement.valid ? "#f7d47c" : "#ff8b7e"}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.5, 0.62, 0.08, 8]} />
            <meshBasicMaterial
              color={placement.valid ? "#e9b44c" : "#e24b4b"}
              transparent
              opacity={placement.valid ? 0.22 : 0.12}
              flatShading
            />
          </mesh>
          {placement.valid ? (
            <mesh position={[0, 0.075, 0]}>
              <ringGeometry args={[0.34, 0.39, 16]} />
              <meshBasicMaterial color="#fff0ae" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          ) : (
            <>
              <mesh rotation-z={Math.PI / 4} position={[0, 0.12, 0]}>
                <boxGeometry args={[0.1, 0.05, 0.68]} />
                <meshBasicMaterial color="#ff8b7e" />
              </mesh>
              <mesh rotation-z={-Math.PI / 4} position={[0, 0.12, 0]}>
                <boxGeometry args={[0.1, 0.05, 0.68]} />
                <meshBasicMaterial color="#ff8b7e" />
              </mesh>
            </>
          )}
        </group>
      )}
    </group>
  );
}

/* ---------------- towers ---------------- */

function TowerMesh({
  tower,
  selected,
  onSelect,
}: {
  tower: Tower;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const turret = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const selectedCore = useRef<THREE.Mesh>(null);
  const equippedCosmetic = cosmeticForTower(
    tower.kind,
    profile.equippedTowerCosmetic(tower.kind),
  );
  const accent = equippedCosmetic?.accent || TOWER_INFO[tower.kind].accent;
  const bodyColor = equippedCosmetic?.body || "";
  const level = towerLevel(tower);

  useFrame(({ clock }, dt) => {
    if (turret.current) {
      const target = tower.aim;
      const cur = turret.current.rotation.y;
      let diff = target - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turnStep = diff * (1 - Math.exp(-10 * dt));
      turret.current.rotation.y = cur + turnStep;
      const turnRate = THREE.MathUtils.clamp(turnStep / Math.max(dt, 1 / 120), -1.6, 1.6);
      turret.current.rotation.z = THREE.MathUtils.damp(
        turret.current.rotation.z,
        -turnRate * 0.035,
        11,
        dt,
      );
    }
    if (ring.current) {
      ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3.2 + tower.id) * 0.035);
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.28 + Math.sin(clock.elapsedTime * 4 + tower.id) * 0.07;
    }
    if (selectedCore.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 5 + tower.id) * 0.12;
      selectedCore.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      position={[tower.x, 0, tower.z]}
      userData={{ rotwoodTowerId: tower.id }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(tower.id);
      }}
    >
      {selected && (
        <>
          <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.12, 0]}>
            <ringGeometry args={[towerRange(tower) - 0.18, towerRange(tower), 40]} />
            <meshBasicMaterial color={accent} transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.14, 0]}>
            <ringGeometry args={[0.66, 0.78, 20]} />
            <meshBasicMaterial color={accent} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={selectedCore} position={[0, 0.2, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color={accent} transparent opacity={0.95} />
          </mesh>
        </>
      )}
      <group ref={turret} position={[0, 1.18 + level * 0.1, 0]}>
        <TowerModel tower={tower} accent={accent} level={level} bodyColor={bodyColor} />
      </group>

    </group>
  );
}


/* ---------------- pooled zombies, gibs & bullets ---------------- */

function Zombies({ map }: { map: ReturnType<typeof getStageMapByStageId> }) {
  const bodyGeometries = useMemo(() => ({
    0: new THREE.BoxGeometry(0.62, 0.85, 0.42),
    1: new THREE.BoxGeometry(0.5, 0.9, 0.34),
    2: new THREE.DodecahedronGeometry(0.55, 0),
    3: new THREE.OctahedronGeometry(0.52, 0),
    4: new THREE.BoxGeometry(0.7, 0.8, 0.5),
    5: new THREE.CylinderGeometry(0.52, 0.62, 0.95, 6),
    6: new THREE.IcosahedronGeometry(0.5, 0),
    7: new THREE.TetrahedronGeometry(0.52, 0),
  } as Record<number, THREE.BufferGeometry>), []);
  const headGeometries = useMemo(() => ({
    0: new THREE.BoxGeometry(0.46, 0.46, 0.46),
    1: new THREE.IcosahedronGeometry(0.3, 0),
    2: new THREE.DodecahedronGeometry(0.34, 0),
    3: new THREE.OctahedronGeometry(0.33, 0),
    4: new THREE.BoxGeometry(0.5, 0.42, 0.44),
    5: new THREE.OctahedronGeometry(0.34, 0),
    6: new THREE.IcosahedronGeometry(0.34, 0),
    7: new THREE.TetrahedronGeometry(0.35, 0),
  } as Record<number, THREE.BufferGeometry>), []);
  useEffect(
    () => () => {
      Object.values(bodyGeometries).forEach((geometry) => geometry.dispose());
      Object.values(headGeometries).forEach((geometry) => geometry.dispose());
    },
    [bodyGeometries, headGeometries],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const lastFlash = useRef<number[]>([]);
  const lastHealFlash = useRef<number[]>([]);
  const lastKind = useRef<number[]>([]);
  const lastBoss = useRef<boolean[]>([]);

  useFrame(() => {
    const list = game.state.zombies;
    for (let i = 0; i < MAX_ZOMBIES; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const z = list[i];
      if (!z || z.dist < 0 || z.gibbed) {
        g.visible = false;
        continue;
      }
      g.visible = true;
      const look = ZOMBIE_LOOKS[z.kind];
      const goreMask = z.gibMask ?? 0;
      const isBroken = (part: GorePart) => (goreMask & gorePartBit(part)) !== 0;
      const statusMark = g.getObjectByName("status-mark");
      const statusStun = g.getObjectByName("status-stun");
      if (statusMark) {
        statusMark.visible = z.markTime > 0 && !z.dead;
        if (statusMark.visible) {
          statusMark.rotation.y += 0.03;
          statusMark.position.y = 1.1 + Math.sin(performance.now() * 0.008 + i) * 0.025;
        }
      }
      if (statusStun) {
        statusStun.visible = (z.stun ?? 0) > 0 && !z.dead;
        if (statusStun.visible) {
          statusStun.rotation.y -= 0.05;
          statusStun.scale.setScalar(0.85 + Math.sin(performance.now() * 0.012 + i) * 0.08);
        }
      }
      const bossChanged = lastBoss.current[i] !== z.boss;
      if (bossChanged || z.boss) {
        const bossAura = g.getObjectByName("boss-aura") as THREE.Group | undefined;
        const bossCrown = g.getObjectByName("boss-crown") as THREE.Group | undefined;
        const bossCore = g.getObjectByName("boss-core") as THREE.Mesh | undefined;
        const bossSignature = g.getObjectByName("boss-signature") as THREE.Group | undefined;
        const bruteMark = g.getObjectByName("boss-mark-brute") as THREE.Group | undefined;
        const splitterMark = g.getObjectByName("boss-mark-splitter") as THREE.Group | undefined;
        const bomberMark = g.getObjectByName("boss-mark-bomber") as THREE.Group | undefined;
        const guardianMark = g.getObjectByName("boss-mark-guardian") as THREE.Group | undefined;
        const healerMark = g.getObjectByName("boss-mark-healer") as THREE.Group | undefined;
        const swarmMark = g.getObjectByName("boss-mark-swarm") as THREE.Group | undefined;
        const now = performance.now();
        if (bossChanged) {
          lastBoss.current[i] = z.boss;
        }
        // These groups are pooled and can be reused for a different enemy.
        // Set visibility every frame so a former boss cannot leak a signature
        // onto a normal zombie when the pool slot is recycled.
        if (bossAura) bossAura.visible = z.boss;
        if (bossCrown) bossCrown.visible = z.boss;
        if (bossCore) bossCore.visible = z.boss;
        if (bossSignature) bossSignature.visible = z.boss;
        if (bruteMark) bruteMark.visible = z.boss && z.kind === 2;
        if (splitterMark) splitterMark.visible = z.boss && z.kind === 3;
        if (bomberMark) bomberMark.visible = z.boss && z.kind === 4;
        if (guardianMark) guardianMark.visible = z.boss && z.kind === 5;
        if (healerMark) healerMark.visible = z.boss && z.kind === 6;
        if (swarmMark) swarmMark.visible = z.boss && z.kind === 7;
        if (z.boss) {
          if (bossAura) {
            bossAura.rotation.y += z.bossEnraged ? 0.032 : 0.018;
            const pulse = 1 + Math.sin(now * 0.006 + i) * (z.bossEnraged ? 0.12 : 0.055);
            bossAura.scale.setScalar(pulse);
          }
          if (bossCrown) {
            bossCrown.rotation.y += z.bossEnraged ? 0.026 : 0.012;
            bossCrown.position.y = 1.95 + Math.sin(now * 0.004 + i) * 0.025;
          }
          if (bossSignature) {
            bossSignature.rotation.y += 0.01 + z.kind * 0.0015;
            bossSignature.scale.setScalar(1 + Math.sin(now * 0.004 + i) * 0.03);
          }
          if (bruteMark) bruteMark.rotation.z = Math.sin(now * 0.004 + i) * 0.16;
          if (splitterMark) splitterMark.rotation.y += 0.035;
          if (bomberMark) {
            bomberMark.rotation.z += 0.026;
            bomberMark.scale.setScalar(1 + Math.sin(now * 0.009 + i) * 0.09);
          }
          if (guardianMark) guardianMark.rotation.y += 0.022;
          if (healerMark) {
            healerMark.rotation.z += 0.018;
            healerMark.scale.setScalar(1 + Math.sin(now * 0.006 + i) * 0.05);
          }
          if (swarmMark) {
            swarmMark.rotation.y += 0.05;
            swarmMark.rotation.x = Math.sin(now * 0.005 + i) * 0.18;
          }
          if (bossCore) {
            const material = bossCore.material as THREE.MeshStandardMaterial;
            const baseBossColor = BOSS_SIGNATURE_COLORS[z.kind] ?? "#e9b44c";
            const bossColor = z.bossEnraged ? "#ff6b4a" : baseBossColor;
            material.color.set(bossColor);
            material.emissive.set(z.bossEnraged ? "#ff4f36" : baseBossColor);
            material.emissiveIntensity = z.bossEnraged ? 1.25 : 0.85;
            bossCore.scale.setScalar(z.bossEnraged ? 1.15 + Math.sin(now * 0.01) * 0.12 : 1);
          }
        }
      }
      const scale =
        z.kind === 2
          ? 1.24
          : z.kind === 1
            ? 0.88
            : z.kind === 5
              ? 1.18
              : z.kind === 7
                ? 0.72
                : z.kind === 4
                  ? 1.06
                  : z.kind === 3
                    ? 1.02
                    : z.kind === 6
                      ? 0.9
                      : 1;
      if (lastKind.current[i] !== z.kind) {
        lastKind.current[i] = z.kind;
        const body = g.getObjectByName("body") as THREE.Mesh | undefined;
        const head = g.getObjectByName("head") as THREE.Mesh | undefined;
        const leftArm = g.getObjectByName("left-arm") as THREE.Mesh | undefined;
        const rightArm = g.getObjectByName("right-arm") as THREE.Mesh | undefined;
        const leftLeg = g.getObjectByName("left-leg") as THREE.Mesh | undefined;
        const rightLeg = g.getObjectByName("right-leg") as THREE.Mesh | undefined;
        const leftShoulder = g.getObjectByName("left-shoulder") as THREE.Mesh | undefined;
        const rightShoulder = g.getObjectByName("right-shoulder") as THREE.Mesh | undefined;
        const runnerCrest = g.getObjectByName("runner-crest") as THREE.Mesh | undefined;
        const splitterCore = g.getObjectByName("splitter-core") as THREE.Mesh | undefined;
        const bomberPack = g.getObjectByName("bomber-pack") as THREE.Mesh | undefined;
        const guardianShield = g.getObjectByName("guardian-shield") as THREE.Mesh | undefined;
        const healerAura = g.getObjectByName("healer-aura") as THREE.Mesh | undefined;
        const swarmCrest = g.getObjectByName("swarm-crest") as THREE.Mesh | undefined;
        if (body && head && leftArm && rightArm && leftLeg && rightLeg) {
          body.geometry = bodyGeometries[z.kind] ?? bodyGeometries[0]!;
          head.geometry = headGeometries[z.kind] ?? headGeometries[0]!;
          if (z.kind === 1) {
            body.position.set(0, 0.9, 0.08);
            body.scale.set(0.68, 1.06, 0.72);
            head.position.set(0, 1.55, 0.12);
            head.scale.set(0.78, 0.86, 0.82);
            leftArm.position.set(0.3, 1.1, 0.42);
            rightArm.position.set(-0.3, 1.1, 0.42);
            leftArm.scale.set(0.65, 1.12, 0.65);
            rightArm.scale.copy(leftArm.scale);
            leftLeg.scale.set(0.68, 1.15, 0.68);
            rightLeg.scale.copy(leftLeg.scale);
          } else if (z.kind === 2) {
            body.position.set(0, 1.05, 0);
            body.scale.set(1.42, 1.28, 1.25);
            head.position.set(0, 1.83, 0.02);
            head.scale.set(1.22, 1.1, 1.15);
            leftArm.position.set(0.58, 1.2, 0.28);
            rightArm.position.set(-0.58, 1.2, 0.28);
            leftArm.scale.set(1.35, 1.32, 1.35);
            rightArm.scale.copy(leftArm.scale);
            leftLeg.scale.set(1.3, 1.12, 1.3);
            rightLeg.scale.copy(leftLeg.scale);
          } else {
            body.position.set(0, 0.95, 0);
            body.scale.set(1, 1, 1);
            head.position.set(0, 1.62, 0);
            head.scale.set(1, 1, 1);
            leftArm.position.set(0.42, 1.15, 0.3);
            rightArm.position.set(-0.42, 1.15, 0.3);
            leftArm.scale.set(1, 1, 1);
            rightArm.scale.set(1, 1, 1);
            leftLeg.scale.set(1, 1, 1);
            rightLeg.scale.set(1, 1, 1);
          }
          for (const mesh of [head, leftArm, rightArm]) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(look.skin);
          }
          (body.material as THREE.MeshStandardMaterial).color.set(look.cloth);
          (leftLeg.material as THREE.MeshStandardMaterial).color.set(look.legs);
          (rightLeg.material as THREE.MeshStandardMaterial).color.set(look.legs);
        }
        if (leftShoulder && rightShoulder) {
          leftShoulder.visible = z.kind === 2;
          rightShoulder.visible = z.kind === 2;
        }
        if (runnerCrest) runnerCrest.visible = z.kind === 1;
        if (splitterCore) splitterCore.visible = z.kind === 3;
        if (bomberPack) bomberPack.visible = z.kind === 4;
        if (guardianShield) guardianShield.visible = z.kind === 5;
        if (healerAura) healerAura.visible = z.kind === 6;
        if (swarmCrest) swarmCrest.visible = z.kind === 7;
      }
      if (z.dead) {
        const f = Math.min(1, z.fade);
        g.position.set(z.x, 0.1 + z.y, z.z);
        g.rotation.x = -1.4 - z.tilt;
        g.rotation.z = z.roll;
        g.scale.setScalar(scale * (z.boss ? 1.16 : 1) * (1 - f * 0.35));
      } else {
        g.position.set(z.x, 0.1 + Math.abs(Math.sin(z.wobble)) * 0.14, z.z);
        g.rotation.x = 0;
        g.rotation.z = Math.sin(z.wobble) * 0.16;
        const hitPulse = Math.max(0, z.flash);
        const hitDirection = Math.sin(z.id * 12.73);
        g.scale.set(
          scale * (z.boss ? 1.16 : 1) * (1 + hitPulse * 0.045),
          scale * (z.boss ? 1.16 : 1) * (1 - hitPulse * 0.035),
          scale * (z.boss ? 1.16 : 1) * (1 + hitPulse * 0.045),
        );
        g.rotation.y += hitPulse * hitDirection * 0.055;
        const nextPoint = pointAtPath(map.path, Math.min(getPathLength(map.path), z.dist + 0.6));
        g.rotation.y = Math.atan2(nextPoint.x - z.x, nextPoint.z - z.z);
      }
      // damage flash
      const f = z.dead ? 0 : z.flash;
      if (lastFlash.current[i] !== f) {
        lastFlash.current[i] = f;
        g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.isMeshStandardMaterial) {
            const heal = z.dead ? 0 : (z.healFlash ?? 0);
            m.emissive.setRGB(f * 0.9 + heal * 0.1, heal * 0.8, 0);
            m.emissiveIntensity = Math.max(f * 1.6, heal * 0.8);
          }
        });
      }
      const heal = z.dead ? 0 : (z.healFlash ?? 0);
      if (lastHealFlash.current[i] !== heal) {
        lastHealFlash.current[i] = heal;
        g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.isMeshStandardMaterial) {
            m.emissive.setRGB(f * 0.9 + heal * 0.1, heal * 0.8, 0);
            m.emissiveIntensity = Math.max(f * 1.6, heal * 0.8);
          }
        });
      }
      const hiddenGoreParts: Array<[string, GorePart]> = [
        ["head", "head"],
        ["left-arm", "left-arm"],
        ["right-arm", "right-arm"],
        ["left-leg", "left-leg"],
        ["right-leg", "right-leg"],
        ["left-shoulder", "left-shoulder"],
        ["right-shoulder", "right-shoulder"],
        ["runner-crest", "runner-crest"],
        ["splitter-core", "splitter-core"],
        ["bomber-pack", "bomber-pack"],
        ["guardian-shield", "guardian-shield"],
        ["healer-aura", "healer-aura"],
        ["swarm-crest", "swarm-crest"],
      ];
      for (const [name, part] of hiddenGoreParts) {
        const object = g.getObjectByName(name);
        if (!object) continue;
        const kindRequired =
          name === "left-shoulder" || name === "right-shoulder" ? z.kind === 2 :
          name === "runner-crest" ? z.kind === 1 :
          name === "splitter-core" ? z.kind === 3 :
          name === "bomber-pack" ? z.kind === 4 :
          name === "guardian-shield" ? z.kind === 5 :
          name === "healer-aura" ? z.kind === 6 :
          name === "swarm-crest" ? z.kind === 7 : true;
        object.visible = kindRequired && !isBroken(part);
      }

      const hpBackground = g.getObjectByName("hp-background") as THREE.Mesh | undefined;
      const hpFill = g.getObjectByName("hp-fill") as THREE.Mesh | undefined;
      const healthBar = getEnemyHealthBarPresentation(z.kind, z.hp, z.maxHp, z.boss);
      const showHealth = healthBar.show && !z.dead;
      if (hpBackground && hpFill) {
        hpBackground.visible = showHealth;
        hpFill.visible = showHealth;
        if (showHealth) {
          const ratio = Math.max(0.04, Math.min(1, z.hp / Math.max(1, z.maxHp)));
          hpBackground.scale.x = healthBar.widthMultiplier;
          hpFill.scale.x = ratio * healthBar.widthMultiplier;
          hpFill.position.x = (ratio - 1) * 0.45 * healthBar.widthMultiplier;
          const material = hpFill.material as THREE.MeshBasicMaterial;
          material.color.set(z.boss ? "#e9b44c" : "#e24b4b");
        }
      }

      const l = legs.current[i];
      if (l && !z.dead) l.rotation.x = Math.sin(z.wobble * 2) * 0.5;
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_ZOMBIES }, (_, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh name="body" position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.62, 0.85, 0.42]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].cloth} flatShading />
          </mesh>
          <mesh name="head" position={[0, 1.62, 0]} castShadow>
            <boxGeometry args={[0.46, 0.46, 0.46]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].skin} flatShading />
          </mesh>

          <group name="boss-aura" visible={false} position={[0, 1.1, 0]}>
            <mesh rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.72, 0.07, 5, 12]} />
              <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.75} transparent opacity={0.62} flatShading />
            </mesh>
          </group>
          <group name="boss-crown" visible={false} position={[0, 1.95, 0]}>
            {[-0.34, -0.11, 0.11, 0.34].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <coneGeometry args={[0.11, 0.38, 4]} />
                <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.45} flatShading />
              </mesh>
            ))}
          </group>
          <group name="boss-signature" visible={false}>
            <group name="boss-mark-brute" position={[0, 1.52, 0]}>
              <mesh position={[-0.44, 0.1, 0]} rotation-z={-0.22} castShadow>
                <coneGeometry args={[0.2, 0.62, 5]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[2]} emissive={BOSS_SIGNATURE_COLORS[2]} emissiveIntensity={0.5} flatShading />
              </mesh>
              <mesh position={[0.44, 0.1, 0]} rotation-z={0.22} castShadow>
                <coneGeometry args={[0.2, 0.62, 5]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[2]} emissive={BOSS_SIGNATURE_COLORS[2]} emissiveIntensity={0.5} flatShading />
              </mesh>
            </group>
            <group name="boss-mark-splitter" position={[0, 1.15, 0]}>
              <mesh rotation-x={Math.PI / 2}>
                <torusGeometry args={[0.56, 0.065, 5, 8]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[3]} emissive={BOSS_SIGNATURE_COLORS[3]} emissiveIntensity={0.9} flatShading />
              </mesh>
              <mesh position={[0, 0, 0.58]}>
                <octahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[3]} emissive={BOSS_SIGNATURE_COLORS[3]} emissiveIntensity={0.7} flatShading />
              </mesh>
            </group>
            <group name="boss-mark-bomber" position={[0, 1.25, -0.45]}>
              {[0, 1, 2].map((index) => (
                <mesh key={index} position={[Math.cos(index * Math.PI * 2 / 3) * 0.28, Math.sin(index * Math.PI * 2 / 3) * 0.28, 0]}>
                  <dodecahedronGeometry args={[0.16, 0]} />
                  <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[4]} emissive={BOSS_SIGNATURE_COLORS[4]} emissiveIntensity={0.55} flatShading />
                </mesh>
              ))}
            </group>
            <group name="boss-mark-guardian" position={[0, 1.05, 0]}>
              <mesh rotation-x={Math.PI / 2}>
                <torusGeometry args={[0.92, 0.1, 6, 12]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[5]} emissive={BOSS_SIGNATURE_COLORS[5]} emissiveIntensity={0.7} transparent opacity={0.72} flatShading />
              </mesh>
              <mesh position={[0, 0, 0.78]} rotation-x={Math.PI / 2}>
                <circleGeometry args={[0.26, 6]} />
                <meshBasicMaterial color={BOSS_SIGNATURE_COLORS[5]} transparent opacity={0.42} />
              </mesh>
            </group>
            <group name="boss-mark-healer" position={[0, 1.7, 0]}>
              <mesh rotation-z={Math.PI / 4}>
                <boxGeometry args={[0.15, 0.8, 0.1]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[6]} emissive={BOSS_SIGNATURE_COLORS[6]} emissiveIntensity={0.65} flatShading />
              </mesh>
              <mesh rotation-z={-Math.PI / 4}>
                <boxGeometry args={[0.15, 0.8, 0.1]} />
                <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[6]} emissive={BOSS_SIGNATURE_COLORS[6]} emissiveIntensity={0.65} flatShading />
              </mesh>
            </group>
            <group name="boss-mark-swarm" position={[0, 1.55, 0]}>
              {[-1, 0, 1].map((x) => (
                <mesh key={x} position={[x * 0.32, Math.abs(x) * 0.08, 0]} rotation-z={x * 0.28}>
                  <tetrahedronGeometry args={[0.16, 0]} />
                  <meshStandardMaterial color={BOSS_SIGNATURE_COLORS[7]} emissive={BOSS_SIGNATURE_COLORS[7]} emissiveIntensity={0.7} flatShading />
                </mesh>
              ))}
            </group>
          </group>
          <mesh name="boss-core" visible={false} position={[0, 1.94, 0.18]}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#e9b44c" emissive="#e9b44c" emissiveIntensity={0.85} flatShading />
          </mesh>
          <mesh name="status-mark" visible={false} position={[0, 1.1, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.52, 0.035, 5, 10]} />
            <meshBasicMaterial color="#e9b44c" transparent opacity={0.8} />
          </mesh>
          <mesh name="status-stun" visible={false} position={[0, 2.0, 0]}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshBasicMaterial color="#fff1a8" transparent opacity={0.88} />
          </mesh>
          <mesh name="hp-background" position={[0, 2.3, 0.02]} visible={false}>
            <planeGeometry args={[0.9, 0.09]} />
            <meshBasicMaterial color="#25191a" />
          </mesh>
          <mesh name="hp-fill" position={[0, 2.3, 0.025]} visible={false}>
            <planeGeometry args={[0.9, 0.07]} />
            <meshBasicMaterial color="#e24b4b" />
          </mesh>
          {/* arms reaching forward */}
          <mesh name="left-arm" position={[0.42, 1.15, 0.3]} rotation={[-1.2, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].skin} flatShading />
          </mesh>
          <mesh name="right-arm" position={[-0.42, 1.15, 0.3]} rotation={[-1.35, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].skin} flatShading />
          </mesh>
          <mesh name="left-shoulder" position={[0.54, 1.48, 0]} visible={false} castShadow>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#4d2024" flatShading />
          </mesh>
          <mesh name="right-shoulder" position={[-0.54, 1.48, 0]} visible={false} castShadow>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#4d2024" flatShading />
          </mesh>
          <mesh name="runner-crest" position={[0, 1.93, -0.05]} visible={false} castShadow>
            <coneGeometry args={[0.18, 0.48, 4]} />
            <meshStandardMaterial color="#f1c84a" flatShading />
          </mesh>
          <mesh name="splitter-core" position={[0, 1.05, 0.42]} visible={false}>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#e1a04f" emissive="#e1a04f" emissiveIntensity={0.3} flatShading />
          </mesh>
          <mesh name="bomber-pack" position={[0, 0.92, -0.36]} visible={false} castShadow>
            <boxGeometry args={[0.5, 0.6, 0.34]} />
            <meshStandardMaterial color="#d55c43" flatShading />
          </mesh>
          <mesh name="guardian-shield" position={[0, 1.05, 0]} rotation-x={Math.PI / 2} visible={false}>
            <torusGeometry args={[0.82, 0.08, 6, 12]} />
            <meshStandardMaterial color="#83c8d1" emissive="#83c8d1" emissiveIntensity={0.45} flatShading />
          </mesh>
          <mesh name="healer-aura" position={[0, 0.12, 0]} rotation-x={-Math.PI / 2} visible={false}>
            <ringGeometry args={[0.45, 0.7, 12]} />
            <meshStandardMaterial color="#c886d4" emissive="#c886d4" emissiveIntensity={0.65} transparent opacity={0.7} flatShading />
          </mesh>
          <mesh name="swarm-crest" position={[0, 1.96, 0]} visible={false} castShadow>
            <coneGeometry args={[0.16, 0.5, 5]} />
            <meshStandardMaterial color="#9ce06d" flatShading />
          </mesh>
          <group ref={(el) => void (legs.current[i] = el)} position={[0, 0.5, 0]}>
            <mesh name="left-leg" position={[0.17, -0.25, 0]} castShadow>
              <boxGeometry args={[0.22, 0.6, 0.22]} />
              <meshStandardMaterial color={ZOMBIE_LOOKS[0].legs} flatShading />
            </mesh>
            <mesh name="right-leg" position={[-0.17, -0.25, 0]} castShadow>
              <boxGeometry args={[0.22, 0.6, 0.22]} />
              <meshStandardMaterial color={ZOMBIE_LOOKS[0].legs} flatShading />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Gibs() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const geometries = useMemo(() => ({
    shard: new THREE.TetrahedronGeometry(0.1, 0),
    head: new THREE.IcosahedronGeometry(0.12, 0),
    limb: new THREE.BoxGeometry(0.11, 0.28, 0.11),
    core: new THREE.DodecahedronGeometry(0.12, 0),
    ring: new THREE.TorusGeometry(0.14, 0.035, 5, 8),
  }), []);
  useEffect(
    () => () => Object.values(geometries).forEach((geometry) => geometry.dispose()),
    [geometries],
  );

  useFrame(() => {
    const list = game.state.gibs;
    for (let i = 0; i < MAX_GIBS; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const g = list[i];
      if (!g) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(g.x, g.y, g.z);
      m.rotation.set(g.rx, g.ry, g.rx * 0.6);
      const fade = Math.max(0, 1 - Math.max(0, g.life - 1.05) / 0.7);
      m.scale.setScalar(g.size * 5.2 * fade);
      const part = g.part ?? "splitter-core";
      m.geometry =
        part === "head" ? geometries.head :
        part.includes("arm") || part.includes("leg") ? geometries.limb :
        part.includes("shield") || part.includes("aura") ? geometries.ring :
        part.includes("core") ? geometries.core :
        geometries.shard;
      const material = m.material as THREE.MeshBasicMaterial;
      material.color.set(
        part === "head" ? "#7a2b2f" :
        part.includes("shield") ? "#70c5d6" :
        part.includes("core") ? "#d3a452" :
        GIB_COLORS[g.tint % GIB_COLORS.length]!,
      );
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_GIBS }, (_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} visible={false}>
          <tetrahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#8c2b2b" />
        </mesh>
      ))}
    </group>
  );
}

function DamagePopups() {
  const popups = game.state.damagePopups;

  return (
    <group>
      {popups.map((popup) =>
        popup.gold > 0 ? <GoldPickup key={popup.id} popup={popup} /> : null,
      )}
    </group>
  );
}

function GoldPickup({
  popup,
}: {
  popup: {
    id: number;
    x: number;
    y: number;
    z: number;
    gold: number;
    life: number;
  };
}) {
  const group = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Mesh>(null);
  const glint = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const root = group.current;
    if (!root) return;

    const life = popup.life;
    const intro = Math.min(1, life / 0.14);
    const fade = Math.max(0, 1 - life / 0.9);
    const bounce = Math.sin(Math.min(1, life / 0.45) * Math.PI) * 0.18;

    root.position.set(
      popup.x,
      popup.y + Math.min(1.1, life * 1.45) + bounce,
      popup.z,
    );

    if (coin.current) {
      coin.current.rotation.y += 0.22;
      coin.current.rotation.z = Math.sin(clock.elapsedTime * 8 + popup.id) * 0.06;
      coin.current.scale.setScalar(0.45 + intro * 0.72 - Math.max(0, life - 0.55) * 0.2);
      (coin.current.material as THREE.MeshStandardMaterial).opacity = fade;
    }

    if (glint.current) {
      glint.current.rotation.z = clock.elapsedTime * 3.2 + popup.id;
      glint.current.scale.setScalar(0.5 + intro * 0.8);
      (glint.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, fade * 0.8);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={coin} position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.09, 12]} />
        <meshStandardMaterial
          color="#e9b44c"
          emissive="#e9b44c"
          emissiveIntensity={0.72}
          metalness={0.35}
          roughness={0.32}
          transparent
          opacity={1}
          flatShading
        />
      </mesh>
      <mesh ref={glint} position={[0, 0.12, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.08, 0.16, 4]} />
        <meshBasicMaterial
          color="#fff0ae"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Bullets() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const glowMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const trailMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const lastKind = useRef<string[]>([]);
  const geometries = useMemo(() => {
    const rocket = new THREE.ConeGeometry(0.14, 0.5, 6);
    rocket.rotateX(Math.PI / 2);
    const laser = new THREE.CylinderGeometry(0.07, 0.07, 0.62, 6);
    laser.rotateX(Math.PI / 2);
    const sniper = new THREE.BoxGeometry(0.06, 0.06, 0.62);
    return {
      rifleman: new THREE.IcosahedronGeometry(0.14, 0),
      shotgunner: new THREE.OctahedronGeometry(0.16, 0),
      sniper,
      tesla: new THREE.DodecahedronGeometry(0.15, 0),
      flamethrower: new THREE.TetrahedronGeometry(0.18, 0),
      freezer: new THREE.OctahedronGeometry(0.18, 0),
      rocket,
      laser,
    } as const;
  }, []);
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose());
    };
  }, [geometries]);
  useFrame(({ clock }) => {
    const list = game.state.bullets;
    for (let i = 0; i < MAX_BULLETS; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const b = list[i];
      if (!b) {
        m.visible = false;
        const trail = trailMeshes.current[i];
        if (trail) trail.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(b.x, b.y, b.z);
      m.lookAt(b.tx, b.y, b.tz);
      if (lastKind.current[i] !== b.kind) {
        lastKind.current[i] = b.kind;
        m.geometry = geometries[b.kind];
      }
      const c = TOWER_INFO[b.kind].accent;
      const distance = Math.max(0.1, Math.hypot(b.tx - b.x, b.tz - b.z));
      const trail = trailMeshes.current[i];
      if (trail) {
        trail.visible = true;
        trail.position.set(b.x, b.y, b.z);
        trail.lookAt(b.tx, b.y, b.tz);
        const trailWidth =
          b.kind === "laser"
            ? 0.32
            : b.kind === "rocket"
              ? 0.52
              : b.kind === "shotgunner"
                ? 0.28
                : b.kind === "flamethrower"
                  ? 0.4
                  : 0.45;
        trail.scale.set(
          trailWidth,
          trailWidth,
          Math.min(
            b.kind === "sniper" || b.kind === "laser" ? 1.8 : 1.4,
            0.18 + distance * 0.085,
          ),
        );
        const trailMaterial = trail.material as THREE.MeshBasicMaterial;
        trailMaterial.color.set(c);
        trailMaterial.opacity =
          b.kind === "laser"
            ? 0.38
            : b.kind === "flamethrower"
              ? 0.32
              : 0.22;
      }
      (m.material as THREE.MeshBasicMaterial).color.set(b.crit ? "#fff3c4" : c);
      const critScale = b.crit ? 1.5 : 1;
      switch (b.kind) {
        case "shotgunner":
          m.scale.setScalar(1.45 * critScale);
          break;
        case "sniper":
          m.scale.set(1.1 * critScale, 1.1 * critScale, 1.35 * critScale);
          break;
        case "rocket":
          m.scale.set(1.35 * critScale, 1.35 * critScale, 1.25 * critScale);
          break;
        case "laser":
          m.scale.set(1.15 * critScale, 1.15 * critScale, 1.5 * critScale);
          break;
        case "tesla":
          m.scale.setScalar(1.35 * critScale);
          break;
        case "flamethrower":
          m.scale.set(1.45 * critScale, 1.05 * critScale, 1.75 * critScale);
          break;
        case "freezer":
          m.scale.setScalar(1.35 * critScale);
          break;
        default:
          m.scale.setScalar(critScale);
      }
    }
  });
  return (
    <group>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <group key={i}>
          <mesh ref={(el) => void (meshes.current[i] = el)} visible={false}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh
            ref={(el) => void (glowMeshes.current[i] = el)}
            visible={false}
          >
            <sphereGeometry args={[0.18, 6, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.14} depthWrite={false} />
          </mesh>
          <mesh
            ref={(el) => void (trailMeshes.current[i] = el)}
            visible={false}
            rotation-x={Math.PI / 2}
          >
            <cylinderGeometry args={[0.045, 0.12, 0.7, 5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------- scene root ---------------- */

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const basePosition = useRef(new THREE.Vector3());
  const baseTarget = useRef(new THREE.Vector3());
  useEffect(() => {
    const portrait = size.height / Math.max(size.width, 1) > 1.4;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = portrait ? 44 : 38;
    cam.position.set(0, portrait ? 38 : 34, portrait ? 15 : 26);
    basePosition.current.copy(cam.position);
    baseTarget.current.set(0, 0, portrait ? -3 : -2);
    cam.lookAt(baseTarget.current);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame(({ clock }) => {
    const shake = reducedMotion ? 0 : Math.min(1, game.state.screenShake);
    if (shake <= 0.001) {
      camera.position.lerp(basePosition.current, 0.35);
      camera.lookAt(baseTarget.current);
      return;
    }
    const t = clock.elapsedTime * 54;
    const amplitude = shake * 0.28;
    camera.position.copy(basePosition.current);
    camera.position.x += Math.sin(t * 1.7) * amplitude;
    camera.position.y += Math.cos(t * 1.3) * amplitude * 0.7;
    camera.position.z += Math.sin(t * 2.1) * amplitude * 0.5;
    camera.lookAt(baseTarget.current);
  });
  return null;
}

function Simulation({ paused }: { paused: boolean }) {
  useFrame((_, dt) => {
    if (paused) return;
    game.tick(dt);
  });
  return null;
}

export function Scene({
  stageId,
  endlessMode = false,
  bossTrial = false,
  towers,
  selection,
  previewPosition,
  onSelectTower,
  onSelectPosition,
  onPreviewPosition,
  paused = false,
  reducedMotion = false,
}: {
  stageId: number;
  endlessMode?: boolean;
  bossTrial?: boolean;
  towers: Tower[];
  selection: Selection;
  previewPosition: { x: number; z: number } | null;
  onSelectTower: (id: number) => void;
  onSelectPosition: (position: { x: number; z: number }) => void;
  onPreviewPosition: (position: { x: number; z: number } | null) => void;
  paused?: boolean;
  reducedMotion?: boolean;
}) {
  const { size } = useThree();
  const renderQuality = useMemo(() => getSceneRenderQuality(size.width), [size.width]);
  const theme = useMemo(() => getStageTheme(stageId, endlessMode, bossTrial), [stageId, endlessMode, bossTrial]);
  const map = useMemo(() => getStageMapByStageId(stageId), [stageId]);
  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.fog, theme.night ? 34 : 46, theme.night ? 82 : 95]} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, theme.night ? 0.72 : 0.85]} />
      <directionalLight
        color={theme.light}
        position={[12, 18, 8]}
        intensity={theme.lightIntensity}
        castShadow
        shadow-mapSize-width={renderQuality.shadowMapSize}
        shadow-mapSize-height={renderQuality.shadowMapSize}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />
      <CameraRig reducedMotion={reducedMotion} />
      <Simulation paused={paused} />
      <group scale={0.74} position={[0, 0, -7]}>
        <Ground theme={theme} map={map} />
        <StageEnvironment environmentId={map.environmentId} />
        <MapObstacles map={map} />
        <Scenery count={renderQuality.sceneryCount} map={map} />
        <Base position={map.base} />
        <BuildSurface
          map={map}
          selection={selection}
          previewPosition={previewPosition}
          towers={towers}
          onSelectPosition={onSelectPosition}
          onPreviewPosition={onPreviewPosition}
        />
        {towers.map((t) => (
          <TowerMesh
            key={t.id}
            tower={t}
            selected={selection?.kind === "tower" && selection.id === t.id}
            onSelect={onSelectTower}
          />
        ))}
        <Zombies map={map} />
        <Gibs />
        <DamagePopups />
        <Bullets />
        <CombatVFX reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
