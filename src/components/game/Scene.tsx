import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
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

const GIB_COLORS = ["#8c2b2b", "#a83c3c", "#6f8f5a"];

const ZOMBIE_LOOKS = [
  { skin: "#6f9f55", cloth: "#42513f", legs: "#35404a" },
  { skin: "#e4ad37", cloth: "#c9662d", legs: "#6f452d" },
  { skin: "#8f332f", cloth: "#5d2428", legs: "#3f292d" },
] as const;

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
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
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
            <group ref={active ? pulse : null}>
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

function WeaponAssembly({
  kind,
  level,
  accent,
}: {
  kind: Tower["kind"];
  level: number;
  accent: string;
}) {
  const length = 1.3 + Math.min(level, 8) * 0.08;

  if (kind === "shotgunner") {
    return (
      <>
        {[-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0.05, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 0.26, length * 0.88]} />
              <meshStandardMaterial color="#4a3d38" flatShading />
            </mesh>
            <mesh position={[0, 0, length * 0.44]} rotation-x={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.14, 0.2, 0.15, 6]} />
              <meshStandardMaterial color={accent} flatShading />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.12, -0.22]} castShadow>
          <boxGeometry args={[0.72, 0.18, 0.62]} />
          <meshStandardMaterial color={accent} flatShading />
        </mesh>
      </>
    );
  }

  if (kind === "sniper") {
    return (
      <>
        <mesh position={[0, 0.04, 0.32]} castShadow>
          <boxGeometry args={[0.14, 0.16, length * 1.65]} />
          <meshStandardMaterial color="#35443b" flatShading />
        </mesh>
        <mesh position={[0, 0.19, 0.15]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.5, 8]} />
          <meshStandardMaterial color={accent} flatShading />
        </mesh>
        <mesh position={[0, -0.1, -0.45]} castShadow>
          <boxGeometry args={[0.38, 0.28, 0.58]} />
          <meshStandardMaterial color={accent} flatShading />
        </mesh>
      </>
    );
  }

  if (kind === "flamethrower") {
    return (
      <>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.48, 0.28, length * 0.78]} />
          <meshStandardMaterial color="#5a443a" flatShading />
        </mesh>
        <mesh position={[0, 0.02, length * 0.4]} rotation-x={Math.PI / 2} castShadow>
          <coneGeometry args={[0.34, 0.48, 6]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.35}
            flatShading
          />
        </mesh>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, -0.12, -0.22]} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.7, 6]} />
            <meshStandardMaterial color={accent} flatShading />
          </mesh>
        ))}
      </>
    );
  }

  if (kind === "freezer") {
    return (
      <>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.42, 0.34, length * 0.72]} />
          <meshStandardMaterial color="#466878" flatShading />
        </mesh>
        <mesh position={[0, 0.02, length * 0.35]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.28, 0.18, 0.45, 6]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} flatShading />
        </mesh>
        <mesh position={[0, 0.38, -0.3]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.62, 6]} />
          <meshStandardMaterial color="#a9e4f1" flatShading />
        </mesh>
      </>
    );
  }

  if (kind === "tesla") {
    return (
      <>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.23, 1.05, 6]} />
          <meshStandardMaterial color="#51475d" flatShading />
        </mesh>
        {[0.22, 0.42, 0.62].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.25 + y * 0.08, 0.055, 4, 8]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.92, 0]}>
          <icosahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.8}
            flatShading
          />
        </mesh>
      </>
    );
  }

  if (kind === "rocket") {
    return (
      <>
        <mesh position={[0, -0.06, -0.1]} castShadow>
          <boxGeometry args={[0.95, 0.25, 0.72]} />
          <meshStandardMaterial color="#5b4141" flatShading />
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.2, 0.28]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.2, 0.24, 1.15, 6]} />
            <meshStandardMaterial color={accent} flatShading />
          </mesh>
        ))}
      </>
    );
  }

  if (kind === "laser") {
    return (
      <>
        <mesh position={[0, 0.02, 0]} castShadow>
          <octahedronGeometry args={[0.56, 0]} />
          <meshStandardMaterial color="#385a58" flatShading />
        </mesh>
        <mesh position={[0, 0.02, 0.58]} castShadow>
          <boxGeometry args={[0.2, 0.2, length * 0.75]} />
          <meshStandardMaterial color="#364b4d" flatShading />
        </mesh>
        <mesh position={[0, 0.02, length * 0.48]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.32, 0.2, 0.16, 10]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.45}
            flatShading
          />
        </mesh>
      </>
    );
  }

  // Rifleman: compact receiver, one recognizable long rifle and a top sight.
  return (
    <>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.34, 0.3, 0.72]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0.72]} castShadow>
        <boxGeometry args={[0.16, 0.16, length]} />
        <meshStandardMaterial color="#41464b" flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0.12]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.3]} />
        <meshStandardMaterial color="#f4d675" flatShading />
      </mesh>
    </>
  );
}

function TowerBody({ kind, accent, level }: { kind: Tower["kind"]; accent: string; level: number }) {
  const height = 0.78 + level * 0.1;
  const isHeavy = kind === "shotgunner" || kind === "rocket" || kind === "flamethrower";
  const isTech = kind === "tesla" || kind === "laser" || kind === "freezer";
  return (
    <>
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[isHeavy ? 1.48 : 1.32, 1.6, 0.5, kind === "laser" ? 8 : 6]} />
        <meshStandardMaterial color={isTech ? "#66777b" : "#8b8478"} flatShading />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        {kind === "sniper" ? (
          <boxGeometry args={[0.78, height, 0.78]} />
        ) : kind === "tesla" ? (
          <cylinderGeometry args={[0.58, 0.9, height, 6]} />
        ) : kind === "laser" ? (
          <octahedronGeometry args={[0.88, 0]} />
        ) : (
          <cylinderGeometry args={[isHeavy ? 1 : 0.82, isHeavy ? 1.18 : 1.04, height, 6]} />
        )}
        <meshStandardMaterial color={isTech ? "#d1e0db" : "#d6cdbc"} flatShading />
      </mesh>
      {kind === "tesla" && (
        <mesh position={[0, 1.28, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.72, 0.1, 4, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} flatShading />
        </mesh>
      )}
      {kind === "flamethrower" &&
        [-0.72, 0.72].map((x) => (
          <mesh key={x} position={[x, 0.82, -0.18]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.72, 6]} />
            <meshStandardMaterial color={accent} flatShading />
          </mesh>
        ))}
      {kind === "freezer" && (
        <mesh position={[0, 0.88, -0.62]} castShadow>
          <dodecahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} flatShading />
        </mesh>
      )}
    </>
  );
}

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
  const barrel = useRef<THREE.Group>(null);
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
      <TowerBody kind={tower.kind} accent={accent} level={level} />
      <group ref={turret} position={[0, 1.55 + level * 0.12, 0]}>
        <mesh castShadow rotation-y={tower.kind === "laser" ? Math.PI / 4 : 0}>
          {tower.kind === "tesla" ? (
            <cylinderGeometry args={[0.58, 0.75, 0.62, 6]} />
          ) : tower.kind === "sniper" ? (
            <boxGeometry args={[0.75, 0.46, 1.22]} />
          ) : tower.kind === "rocket" ? (
            <boxGeometry args={[1.3, 0.52, 0.92]} />
          ) : tower.kind === "laser" ? (
            <octahedronGeometry args={[0.72, 0]} />
          ) : (
            <boxGeometry args={[tower.kind === "shotgunner" ? 1.3 : 1.05, 0.6, 1.05]} />
          )}
          <meshStandardMaterial color={accent} flatShading />
        </mesh>
        <group ref={barrel} position={[0, 0.05, 0.95]}>
          <WeaponAssembly kind={tower.kind} level={level} accent={accent} />
        </group>
      </group>
      {/* path pips: left = path A, right = path B */}
      {Array.from({ length: tower.a }, (_, i) => (
        <mesh key={`a${i}`} position={[-0.75, 0.5 + i * 0.24, 1.15]}>
          <boxGeometry args={[0.2, 0.15, 0.12]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.5}
            flatShading
          />
        </mesh>
      ))}
      {Array.from({ length: tower.b }, (_, i) => (
        <mesh key={`b${i}`} position={[0.75, 0.5 + i * 0.24, 1.15]}>
          <boxGeometry args={[0.2, 0.15, 0.12]} />
          <meshStandardMaterial
            color="#f4ead6"
            emissive="#f4ead6"
            emissiveIntensity={0.35}
            flatShading
          />
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
  const lastKind = useRef<number[]>([]);

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
      const scale = z.kind === 2 ? 1.24 : z.kind === 1 ? 0.88 : 1;
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
        if (body && head && leftArm && rightArm && leftLeg && rightLeg) {
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
      }
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
          <mesh name="body" position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.62, 0.85, 0.42]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].cloth} flatShading />
          </mesh>
          <mesh name="head" position={[0, 1.62, 0]} castShadow>
            <boxGeometry args={[0.46, 0.46, 0.46]} />
            <meshStandardMaterial color={ZOMBIE_LOOKS[0].skin} flatShading />
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
function DamagePopups() {
  const popups = game.state.damagePopups;

  return (
    <group>
      {popups.map((popup) => (
        <DamagePopup key={popup.id} popup={popup} />
      ))}
    </group>
  );
}

function DamagePopup({
  popup,
}: {
  popup: {
    id: number;
    x: number;
    y: number;
    z: number;
    value: number;
    life: number;
    crit: boolean;
    gold: number;
  };
}) {
  const text = useRef<THREE.Object3D & {
    text?: string;
    material?: THREE.Material & { opacity?: number; transparent?: boolean };
  }>(null);

  useFrame(() => {
    const object = text.current;
    if (!object) return;

    object.position.set(popup.x, popup.y, popup.z);

    const age = popup.life / 0.9;
    const fade = Math.max(0, 1 - age);

    object.scale.setScalar(popup.crit ? 1.35 : 1);
    object.text = popup.gold > 0 ? `+${popup.gold}` : `${popup.value}`;

    const material = object.material;
    if (material) {
      material.transparent = true;
      material.opacity = fade;
    }
  });

  return (
    <Text
      ref={(el) => {
        text.current = el as typeof text.current;
      }}
      fontSize={0.42}
      color="#ffffff"
      outlineColor="#111111"
      outlineWidth={0.045}
      anchorX="center"
      anchorY="middle"
      depthOffset={-2}
    >
      0
    </Text>
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
      m.lookAt(b.tx, b.y, b.tz);
      const c = TOWER_INFO[b.kind].accent;
      (m.material as THREE.MeshBasicMaterial).color.set(b.crit ? "#fff3c4" : c);
      const critScale = b.crit ? 1.5 : 1;
      if (b.kind === "shotgunner")
        m.scale.set(0.28 * critScale, 0.28 * critScale, 0.28 * critScale);
      else if (b.kind === "rocket")
        m.scale.set(0.34 * critScale, 0.34 * critScale, 0.8 * critScale);
      else if (b.kind === "laser")
        m.scale.set(0.18 * critScale, 0.18 * critScale, 1.15 * critScale);
      else if (b.kind === "tesla") m.scale.set(0.22 * critScale, 0.22 * critScale, 0.6 * critScale);
      else if (b.kind === "flamethrower")
        m.scale.set(0.3 * critScale, 0.16 * critScale, 0.5 * critScale);
      else m.scale.setScalar(critScale);
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

function Simulation({ paused }: { paused: boolean }) {
  useFrame((_, dt) => {
    if (paused) return;
    game.tick(dt);
  });
  return null;
}

export function Scene({
  towers,
  selection,
  onSelectTower,
  onSelectSpot,
  paused = false,
}: {
  towers: Tower[];
  selection: Selection;
  onSelectTower: (id: number) => void;
  onSelectSpot: (i: number) => void;
  paused?: boolean;
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
      <Simulation paused={paused} />
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
        <DamagePopups/>
        <Bullets />
      </group>
    </>
  );
}
