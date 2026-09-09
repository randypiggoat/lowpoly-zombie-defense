import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BUILD_SPOTS,
  PATH,
  PATH_LENGTH,
  TOWER_INFO,
  game,
  pointAt,
  towerLevel,
  towerRange,
  type Tower,
} from "@/game/engine";

const MAX_ZOMBIES = 60;
const MAX_BULLETS = 80;
const MAX_GIBS = 160;

const ZOMBIE_COLORS = ["#7fa86b", "#9ec46f", "#6f8f5a"];
const CLOTH_COLORS = ["#3f4b5c", "#5c3f4b", "#42513f"];
const GIB_COLORS = ["#8c2b2b", "#a83c3c", "#6f8f5a"];

export type Selection = { kind: "tower"; id: number } | { kind: "spot"; index: number } | null;

/* ---------------- ground, path, props ---------------- */

function Ground() {
  const segments = useMemo(() => {
    const out: { x: number; z: number; rot: number; len: number }[] = [];
    for (let i = 1; i < PATH.length; i++) {
      const a = PATH[i - 1]!;
      const b = PATH[i]!;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      out.push({
        x: (a.x + b.x) / 2,
        z: (a.z + b.z) / 2,
        rot: Math.atan2(b.x - a.x, b.z - a.z),
        len: len + 2.6,
      });
    }
    return out;
  }, []);

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
        <meshStandardMaterial color="#5e8a52" flatShading />
      </mesh>
      {facets.map(({ a, r, i }) => (
        <mesh
          key={i}
          position={[Math.cos(a) * r, 0.02 + (i % 3) * 0.02, Math.sin(a) * r]}
          rotation={[-Math.PI / 2, 0, a]}
          receiveShadow
        >
          <circleGeometry args={[2.2 + (i % 4) * 0.9, 5]} />
          <meshStandardMaterial color={i % 2 ? "#688f56" : "#547e4b"} flatShading />
        </mesh>
      ))}
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0.07, s.z]} rotation-y={s.rot} receiveShadow>
          <boxGeometry args={[2.6, 0.14, s.len]} />
          <meshStandardMaterial color="#a58a63" flatShading />
        </mesh>
      ))}
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

function Scenery() {
  const items = useMemo(() => {
    const trees: [number, number, number][] = [];
    const rocks: [number, number, number][] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 46; i++) {
      const x = (rnd() - 0.5) * 56;
      const z = (rnd() - 0.5) * 60 - 4;
      let ok = true;
      for (let d = 0; d < PATH_LENGTH; d += 1.2) {
        const p = pointAt(d);
        if (Math.hypot(p.x - x, p.z - z) < 3.4) ok = false;
      }
      for (const s of BUILD_SPOTS) {
        if (Math.hypot(s.x - x, s.z - z) < 3.4) ok = false;
      }
      if (Math.hypot(x + 4, z - 12) < 6) ok = false;
      if (!ok) continue;
      if (rnd() > 0.25) trees.push([x, 0, z]);
      else rocks.push([x, 0.4, z]);
    }
    return { trees, rocks };
  }, []);

  return (
    <group>
      {items.trees.map((p, i) => (
        <Tree key={`t${i}`} position={p} scale={0.85 + ((i * 13) % 5) * 0.12} />
      ))}
      {items.rocks.map((p, i) => (
        <Rock key={`r${i}`} position={p} scale={0.6 + ((i * 7) % 4) * 0.2} />
      ))}
    </group>
  );
}

/* ---------------- base ---------------- */

function Base() {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.12;
    }
  });
  return (
    <group position={[-4, 0, 13.4]}>
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
    </group>
  );
}

/* ---------------- build pads ---------------- */

function BuildPads({
  occupied,
  selection,
  onSelectSpot,
}: {
  occupied: Set<number>;
  selection: Selection;
  onSelectSpot: (i: number) => void;
}) {
  const pulse = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pulse.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.06;
      pulse.current.scale.set(s, 1, s);
    }
  });

  return (
    <group>
      {BUILD_SPOTS.map((p, i) => {
        if (occupied.has(i)) return null;
        const active = selection?.kind === "spot" && selection.index === i;
        return (
          <group
            key={i}
            position={[p.x, 0, p.z]}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelectSpot(i);
            }}
          >
            <mesh position={[0, 0.09, 0]} receiveShadow>
              <cylinderGeometry args={[1.3, 1.5, 0.18, 6]} />
              <meshStandardMaterial
                color={active ? "#e9b44c" : "#7d7568"}
                transparent
                opacity={active ? 0.95 : 0.6}
                flatShading
              />
            </mesh>
            <group ref={active ? pulse : undefined}>
              <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, 0]}>
                <ringGeometry args={[1.05, 1.25, 6]} />
                <meshBasicMaterial
                  color={active ? "#ffe08a" : "#d9d2c4"}
                  transparent
                  opacity={active ? 0.9 : 0.45}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshBasicMaterial color="#f4ead6" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 0.55, 0]} rotation-z={Math.PI / 2}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshBasicMaterial color="#f4ead6" transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}
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
  const barrel = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const accent = TOWER_INFO[tower.kind].accent;
  const level = towerLevel(tower);

  useFrame(({ clock }, dt) => {
    if (turret.current) {
      const target = tower.aim;
      const cur = turret.current.rotation.y;
      let diff = target - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      turret.current.rotation.y = cur + diff * (1 - Math.exp(-10 * dt));
    }
    if (barrel.current) {
      barrel.current.position.z = 0.95 - tower.recoil * 0.22;
    }
    if (ring.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.02;
      ring.current.scale.setScalar(s);
    }
  });

  return (
    <group
      position={[tower.x, 0, tower.z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(tower.id);
      }}
    >
      {selected && (
        <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.12, 0]}>
          <ringGeometry args={[towerRange(tower) - 0.18, towerRange(tower), 40]} />
          <meshBasicMaterial color={accent} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.35, 1.6, 0.5, 6]} />
        <meshStandardMaterial color="#8b8478" flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.05, 0.9 + level * 0.12, 6]} />
        <meshStandardMaterial color="#d6cdbc" flatShading />
      </mesh>
      <group ref={turret} position={[0, 1.55 + level * 0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.6, 1.1]} />
          <meshStandardMaterial color={accent} flatShading />
        </mesh>
        <mesh ref={barrel} position={[0, 0.05, 0.95]} castShadow>
          <boxGeometry args={[0.26, 0.26, 1.3 + Math.min(level, 8) * 0.08]} />
          <meshStandardMaterial color="#4a4a52" flatShading />
        </mesh>
        {tower.kind === "tesla" && (
          <mesh position={[0, 0.55, 0]}>
            <icosahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} flatShading />
          </mesh>
        )}
      </group>
      {/* path pips: left = path A, right = path B */}
      {Array.from({ length: tower.a }, (_, i) => (
        <mesh key={`a${i}`} position={[-0.75, 0.5 + i * 0.24, 1.15]}>
          <boxGeometry args={[0.2, 0.15, 0.12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} flatShading />
        </mesh>
      ))}
      {Array.from({ length: tower.b }, (_, i) => (
        <mesh key={`b${i}`} position={[0.75, 0.5 + i * 0.24, 1.15]}>
          <boxGeometry args={[0.2, 0.15, 0.12]} />
          <meshStandardMaterial color="#f4ead6" emissive="#f4ead6" emissiveIntensity={0.35} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- pooled zombies, gibs & bullets ---------------- */

function Zombies() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const lastFlash = useRef<number[]>([]);

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
      const scale = z.kind === 2 ? 1.35 : z.kind === 1 ? 0.85 : 1;
      if (z.dead) {
        const f = Math.min(1, z.fade);
        g.position.set(z.x, 0.1 + z.y, z.z);
        g.rotation.x = -1.4 - z.tilt;
        g.rotation.z = z.roll;
        g.scale.setScalar(scale * (1 - f * 0.35));
      } else {
        g.position.set(z.x, 0.1 + Math.abs(Math.sin(z.wobble)) * 0.14, z.z);
        g.rotation.x = 0;
        g.rotation.z = Math.sin(z.wobble) * 0.16;
        g.scale.setScalar(scale);
        const nextPoint = pointAt(z.dist + 0.6);
        g.rotation.y = Math.atan2(nextPoint.x - z.x, nextPoint.z - z.z);
      }
      // damage flash
      const f = z.dead ? 0 : z.flash;
      if (lastFlash.current[i] !== f) {
        lastFlash.current[i] = f;
        g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.isMeshStandardMaterial) {
            m.emissive.setRGB(f * 0.9, 0, 0);
            m.emissiveIntensity = f * 1.6;
          }
        });
      }
      const l = legs.current[i];
      if (l && !z.dead) l.rotation.x = Math.sin(z.wobble * 2) * 0.5;
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_ZOMBIES }, (_, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.62, 0.85, 0.42]} />
            <meshStandardMaterial color={CLOTH_COLORS[i % 3]!} flatShading />
          </mesh>
          <mesh position={[0, 1.62, 0]} castShadow>
            <boxGeometry args={[0.46, 0.46, 0.46]} />
            <meshStandardMaterial color={ZOMBIE_COLORS[i % 3]!} flatShading />
          </mesh>
          {/* arms reaching forward */}
          <mesh position={[0.42, 1.15, 0.3]} rotation={[-1.2, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={ZOMBIE_COLORS[(i + 1) % 3]!} flatShading />
          </mesh>
          <mesh position={[-0.42, 1.15, 0.3]} rotation={[-1.35, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={ZOMBIE_COLORS[(i + 2) % 3]!} flatShading />
          </mesh>
          <group ref={(el) => void (legs.current[i] = el)} position={[0, 0.5, 0]}>
            <mesh position={[0.17, -0.25, 0]} castShadow>
              <boxGeometry args={[0.22, 0.6, 0.22]} />
              <meshStandardMaterial color="#3a4250" flatShading />
            </mesh>
            <mesh position={[-0.17, -0.25, 0]} castShadow>
              <boxGeometry args={[0.22, 0.6, 0.22]} />
              <meshStandardMaterial color="#333b48" flatShading />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Gibs() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
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
      const fade = Math.max(0, 1 - Math.max(0, g.life - 2.2) / 1);
      m.scale.setScalar(g.size * 6 * fade);
      (m.material as THREE.MeshStandardMaterial).color.set(GIB_COLORS[g.tint % 3]!);
    }
  });
  return (
    <group>
      {Array.from({ length: MAX_GIBS }, (_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} visible={false} castShadow>
          <tetrahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#8c2b2b" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Bullets() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const list = game.state.bullets;
    for (let i = 0; i < MAX_BULLETS; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const b = list[i];
      if (!b) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(b.x, b.y, b.z);
      const c = TOWER_INFO[b.kind].accent;
      (m.material as THREE.MeshBasicMaterial).color.set(b.crit ? "#fff3c4" : c);
      m.scale.setScalar((b.kind === "cannon" ? 1.7 : 1) * (b.crit ? 1.5 : 1));
    }
  });
  return (
    <group>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} visible={false}>
          <icosahedronGeometry args={[0.14, 0]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- scene root ---------------- */

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const portrait = size.height / Math.max(size.width, 1) > 1.4;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = portrait ? 44 : 38;
    cam.position.set(0, portrait ? 38 : 34, portrait ? 15 : 26);
    cam.lookAt(0, 0, portrait ? -3 : -2);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function Simulation() {
  useFrame((_, dt) => game.tick(dt));
  return null;
}

export function Scene({
  towers,
  selection,
  onSelectTower,
  onSelectSpot,
}: {
  towers: Tower[];
  selection: Selection;
  onSelectTower: (id: number) => void;
  onSelectSpot: (i: number) => void;
}) {
  const occupied = useMemo(() => new Set(towers.map((t) => t.spot)), [towers]);
  return (
    <>
      <color attach="background" args={["#8fc4d8"]} />
      <fog attach="fog" args={["#8fc4d8", 46, 95]} />
      <hemisphereLight args={["#bfe3f2", "#5e8a52", 0.85]} />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />
      <CameraRig />
      <Simulation />
      <group scale={0.74} position={[0, 0, -7]}>
        <Ground />
        <Scenery />
        <Base />
        <BuildPads occupied={occupied} selection={selection} onSelectSpot={onSelectSpot} />
        {towers.map((t) => (
          <TowerMesh
            key={t.id}
            tower={t}
            selected={selection?.kind === "tower" && selection.id === t.id}
            onSelect={onSelectTower}
          />
        ))}
        <Zombies />
        <Gibs />
        <Bullets />
      </group>
    </>
  );
}
