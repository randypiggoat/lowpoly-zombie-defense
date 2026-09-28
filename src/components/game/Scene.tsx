import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cosmeticForTower } from "@/game/collection";
import { getStageTheme, type StageTheme } from "@/game/stageThemes";
import { getEnemyHealthBarPresentation } from "@/game/enemyPresentation";
import { getSceneRenderQuality } from "@/game/renderQuality";
import { profile } from "@/game/profile";
import { TowerModel } from "./TowerModel";
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

export type Selection = { kind: "tower"; id: number } | { kind: "spot"; index: number } | null;

/* ---------------- ground, path, props ---------------- */

function Ground({ theme }: { theme: StageTheme }) {
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
            <boxGeometry args={[2.6, 0.14, s.len]} />
            <meshStandardMaterial color={theme.path} flatShading />
          </mesh>
          <mesh position={[s.x, 0.15, s.z]} rotation-y={s.rot}>
            <boxGeometry args={[0.18, 0.025, s.len * 0.82]} />
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

function Scenery({ count = 46 }: { count?: number }) {
  const items = useMemo(() => {
    const trees: [number, number, number][] = [];
    const rocks: [number, number, number][] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < count; i++) {
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
  }, [count]);

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
      turret.current.rotation.y = cur + diff * (1 - Math.exp(-10 * dt));
    }
    if (ring.current) {
      ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.2 + tower.id) * 0.025);
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
      <group ref={turret} position={[0, 1.18 + level * 0.1, 0]}>
        <TowerModel tower={tower} accent={accent} level={level} bodyColor={bodyColor} />
      </group>
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
          if (bossAura) bossAura.visible = z.boss;
          if (bossCrown) bossCrown.visible = z.boss;
          if (bossCore) bossCore.visible = z.boss;
          if (bossSignature) bossSignature.visible = z.boss;
          lastBoss.current[i] = z.boss;
        }
        if (z.boss) {
          if (bossSignature) bossSignature.visible = true;
          if (bruteMark) bruteMark.visible = z.kind === 2;
          if (splitterMark) splitterMark.visible = z.kind === 3;
          if (bomberMark) bomberMark.visible = z.kind === 4;
          if (guardianMark) guardianMark.visible = z.kind === 5;
          if (healerMark) healerMark.visible = z.kind === 6;
          if (swarmMark) swarmMark.visible = z.kind === 7;
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
        g.scale.setScalar(scale * (z.boss ? 1.16 : 1));
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
  const group = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Mesh>(null);
  const impact = useRef<THREE.Mesh>(null);
  const text = useRef<THREE.Object3D & {
    text?: string;
    material?: THREE.Material & { opacity?: number; transparent?: boolean };
  }>(null);

  useFrame(({ clock }) => {
    const root = group.current;
    if (!root) return;

    const life = popup.life;
    const intro = Math.min(1, life / 0.09);
    const fade = Math.max(0, 1 - life / 0.9);
    const bob = Math.sin(clock.elapsedTime * 12 + popup.id) * 0.035;

    root.position.set(
      popup.x,
      popup.y + Math.min(0.75, life * 1.45) + bob,
      popup.z,
    );

    if (impact.current) {
      const impactAge = Math.min(1, life / 0.18);
      impact.current.scale.setScalar(0.55 + impactAge * 0.9);
      const impactMaterial = impact.current.material as THREE.MeshBasicMaterial;
      impactMaterial.opacity = Math.max(0, 1 - impactAge);
      impactMaterial.transparent = true;
      impact.current.visible = popup.gold <= 0 && life < 0.2;
    }

    if (popup.gold > 0) {
      const coinScale = life < 0.12 ? 0.55 + intro * 0.7 : 1.05 - Math.min(0.2, life * 0.16);
      if (coin.current) {
        coin.current.rotation.y += 0.18;
        coin.current.rotation.z = Math.sin(clock.elapsedTime * 8 + popup.id) * 0.08;
        coin.current.scale.setScalar(coinScale);
      }
      if (text.current) {
        text.current.position.set(0, 0.02, 0.02);
        text.current.scale.setScalar(0.82 + intro * 0.28);
        text.current.text = `+${popup.gold} SCRAP`;
        const material = text.current.material;
        if (material) {
          material.transparent = true;
          material.opacity = fade;
        }
      }
    } else if (text.current) {
      text.current.scale.setScalar(popup.crit ? 1.35 : 1);
      text.current.text = `${popup.value}`;
      const material = text.current.material;
      if (material) {
        material.transparent = true;
        material.opacity = fade;
      }
    }
  });

  return (
    <group ref={group}>
      {popup.gold <= 0 && (
        <mesh ref={impact} rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <ringGeometry args={[0.12, 0.18, 8]} />
          <meshBasicMaterial
            color={popup.crit ? "#fff3c4" : "#ffffff"}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {popup.gold > 0 && (
        <>
          <mesh ref={coin} position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.09, 12]} />
            <meshStandardMaterial
              color="#e9b44c"
              emissive="#e9b44c"
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.38}
              flatShading
            />
          </mesh>
          <mesh position={[0, 0.095, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.08, 0.13, 10]} />
            <meshBasicMaterial color="#fff0ae" transparent opacity={0.75} />
          </mesh>
        </>
      )}
      <Text
        ref={(el) => {
          text.current = el as typeof text.current;
        }}
        position={popup.gold > 0 ? [0, -0.32, 0] : [0, 0, 0]}
        fontSize={popup.gold > 0 ? 0.25 : 0.42}
        color={popup.gold > 0 ? "#ffd86b" : popup.crit ? "#fff3c4" : "#ffffff"}
        outlineColor="#111111"
        outlineWidth={0.045}
        anchorX="center"
        anchorY="middle"
        depthOffset={-2}
      >
        0
      </Text>
    </group>
  );
}
function Bullets() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const trailMeshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
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
      const c = TOWER_INFO[b.kind].accent;
      const distance = Math.max(0.1, Math.hypot(b.tx - b.x, b.tz - b.z));
      const trail = trailMeshes.current[i];
      if (trail) {
        trail.visible = true;
        trail.position.set(b.x, b.y, b.z);
        trail.lookAt(b.tx, b.y, b.tz);
        trail.scale.set(
          0.45,
          0.45,
          Math.min(1.4, 0.22 + distance * 0.08),
        );
        (trail.material as THREE.MeshBasicMaterial).color.set(c);
      }
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
        <group key={i}>
          <mesh ref={(el) => void (meshes.current[i] = el)} visible={false}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshBasicMaterial color="#ffffff" />
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
  onSelectTower,
  onSelectSpot,
  paused = false,
  reducedMotion = false,
}: {
  stageId: number;
  endlessMode?: boolean;
  bossTrial?: boolean;
  towers: Tower[];
  selection: Selection;
  onSelectTower: (id: number) => void;
  onSelectSpot: (i: number) => void;
  paused?: boolean;
  reducedMotion?: boolean;
}) {
  const occupied = useMemo(() => new Set(towers.map((t) => t.spot)), [towers]);
  const { size } = useThree();
  const renderQuality = useMemo(() => getSceneRenderQuality(size.width), [size.width]);
  const theme = useMemo(() => getStageTheme(stageId, endlessMode, bossTrial), [stageId, endlessMode, bossTrial]);
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
        <Ground theme={theme} />
        <Scenery count={renderQuality.sceneryCount} />
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
