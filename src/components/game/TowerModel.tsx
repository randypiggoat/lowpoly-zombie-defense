import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Tower } from "@/game/engine";

type TowerModelProps = {
  tower: Tower;
  accent: string;
  level: number;
  bodyColor: string;
  reducedMotion?: boolean;
};

function AccentMaterial({ color, glow = 0.25 }: { color: string; glow?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={glow}
      flatShading
      roughness={0.72}
      metalness={0.08}
    />
  );
}

function Core({ color, size = 0.22 }: { color: string; size?: number }) {
  return (
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <AccentMaterial color={color} glow={0.85} />
    </mesh>
  );
}

type GearProps = { kind: string; a: number; b: number; accent: string; dark: string };

/** Per-tower upgrade hardware: each path tier visibly adds or changes parts. Kept to a few meshes per tower. */
function UpgradeGear({ kind, a, b, accent, dark }: GearProps) {
  const metal = <meshStandardMaterial color={dark} flatShading metalness={0.4} roughness={0.5} />;
  switch (kind) {
    case "rifleman":
      return (
        <>
          {a >= 1 && (
            <group position={[0, 1.08, 0.14]}>
              <mesh castShadow><boxGeometry args={[0.18, 0.12, 0.38]} />{metal}</mesh>
              <mesh position={[0, 0.13, 0.02]}><boxGeometry args={[0.11, 0.1, 0.08]} /><AccentMaterial color={accent} glow={0.45} /></mesh>
            </group>
          )}
          {a >= 2 && <mesh position={[0, 0.78, -0.1]} castShadow><boxGeometry args={[0.3, 0.28, 0.38]} />{metal}</mesh>}
          {a >= 3 && <mesh position={[0, 0.92, 0.56]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.13, 0.16, 0.18, 6]} />{metal}</mesh>}
          {a >= 4 && (
            <group position={[0, 1.22, -0.02]}>
              <mesh><cylinderGeometry args={[0.07, 0.07, 0.34, 6]} />{metal}</mesh>
              <mesh position={[0, 0.2, 0]}><icosahedronGeometry args={[0.11, 0]} /><AccentMaterial color={accent} glow={0.65} /></mesh>
            </group>
          )}
          {b >= 2 && (
            <group position={[-0.58, 0.82, -0.34]}>
              <mesh castShadow><boxGeometry args={[0.2, 0.24, 0.3]} />{metal}</mesh>
              <mesh position={[0, 0.2, -0.02]}><cylinderGeometry args={[0.035, 0.05, 0.3, 5]} />{metal}</mesh>
            </group>
          )}
          {b >= 3 && <mesh position={[0.55, 0.78, -0.3]} rotation-y={Math.PI / 4} castShadow><boxGeometry args={[0.28, 0.2, 0.18]} /><AccentMaterial color={accent} glow={0.28} /></mesh>}
        </>
      );
    case "shotgunner":
      return (
        <>
          {a >= 1 && (
            <mesh position={[0, 0.9, 1.5]} rotation-x={Math.PI / 2}>
              <coneGeometry args={[0.28 + a * 0.04, 0.3, 6]} />
              <AccentMaterial color={accent} glow={0.3} />
            </mesh>
          )}
          {b >= 2 && (
            <mesh position={[0, 0.55, 0.75]} castShadow>
              <boxGeometry args={[1.0, 0.5, 0.12]} />
              {metal}
            </mesh>
          )}
          {a >= 3 && <mesh position={[0, 1.08, 0.42]} castShadow><boxGeometry args={[0.56, 0.24, 0.46]} />{metal}</mesh>}
          {a >= 4 && <mesh position={[0, 1.04, 1.43]} rotation-x={Math.PI / 2}><torusGeometry args={[0.31, 0.055, 5, 8]} /><AccentMaterial color={accent} glow={0.32} /></mesh>}
          {b >= 1 && <mesh position={[0, 0.75, -0.62]} castShadow><boxGeometry args={[0.7, 0.2, 0.36]} />{metal}</mesh>}
          {b >= 3 && (
            <group position={[0.62, 0.92, -0.28]}>
              <mesh castShadow><boxGeometry args={[0.24, 0.32, 0.24]} />{metal}</mesh>
              <mesh position={[0, 0.23, 0]}><octahedronGeometry args={[0.09, 0]} /><AccentMaterial color={accent} glow={0.6} /></mesh>
            </group>
          )}
          {b >= 4 && <mesh position={[0, 0.4, 0.08]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.09, 0.09, 1.7, 6]} />{metal}</mesh>}
        </>
      );
    case "sniper":
      return (
        <>
          {a >= 1 && (
            <mesh position={[0.3, 1.12, -0.24]} castShadow>
              <boxGeometry args={[0.22, 0.3, 0.22]} />
              {metal}
            </mesh>
          )}
          {a >= 4 && (
            <mesh position={[0, 1.55, -0.2]} rotation-x={0.5}>
              <coneGeometry args={[0.3, 0.14, 6]} />
              <AccentMaterial color={accent} glow={0.7} />
            </mesh>
          )}
          {a >= 2 && <mesh position={[0, 1.48, 0.28]} castShadow><boxGeometry args={[0.42, 0.24, 0.55]} />{metal}</mesh>}
          {a >= 3 && <mesh position={[0, 1.72, 0.72]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.16, 0.22, 6]} />{metal}</mesh>}
          {b >= 1 && (
            <mesh position={[0, 0.95, 1.35]} castShadow>
              <boxGeometry args={[0.36, 0.22, 0.22]} />
              {metal}
            </mesh>
          )}
          {b >= 4 && (
            <group position={[0, 1.36, -0.24]}>
              <mesh position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 0.24, 5]} />
                {metal}
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <icosahedronGeometry args={[0.13, 0]} />
                <AccentMaterial color={accent} glow={0.75} />
              </mesh>
            </group>
          )}
          {b >= 2 && <mesh position={[-0.4, 1.25, -0.22]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.035, 0.045, 0.56, 5]} />{metal}</mesh>}
          {b >= 3 && <mesh position={[0.4, 1.23, -0.22]} castShadow><boxGeometry args={[0.32, 0.24, 0.3]} /><AccentMaterial color={accent} glow={0.3} /></mesh>}
        </>
      );
    case "tesla":
      return (
        <>
          {Array.from({ length: Math.min(3, a) }, (_, i) => (
            <mesh key={i} position={[0, 0.7 + i * 0.28, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.5 - i * 0.07, 0.04, 5, 10]} />
              <AccentMaterial color={accent} glow={0.7 + i * 0.1} />
            </mesh>
          ))}
          {b >= 2 && (
            <>
              <mesh position={[0.55, 0.45, 0.4]} castShadow>
                <boxGeometry args={[0.24, 0.4, 0.24]} />
                {metal}
              </mesh>
              <mesh position={[-0.55, 0.45, 0.4]} castShadow>
                <boxGeometry args={[0.24, 0.4, 0.24]} />
                {metal}
              </mesh>
            </>
          )}
          {b >= 1 && <mesh position={[0, 0.52, -0.52]} castShadow><boxGeometry args={[0.52, 0.3, 0.28]} />{metal}</mesh>}
          {b >= 3 && (
            <>
              <mesh position={[0.72, 0.55, -0.24]} rotation-z={-0.34} castShadow><boxGeometry args={[0.14, 0.55, 0.18]} />{metal}</mesh>
              <mesh position={[-0.72, 0.55, -0.24]} rotation-z={0.34} castShadow><boxGeometry args={[0.14, 0.55, 0.18]} />{metal}</mesh>
            </>
          )}
          {b >= 4 && <mesh position={[0, 1.54, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.56, 0.035, 5, 10]} /><AccentMaterial color={accent} glow={0.5} /></mesh>}
          {a >= 4 && <mesh position={[0, 1.84, 0]}><octahedronGeometry args={[0.2, 0]} /><AccentMaterial color={accent} glow={0.85} /></mesh>}
        </>
      );
    case "flamethrower":
      return (
        <>
          {a >= 1 && <mesh position={[-0.48, 1.42, -0.14]} rotation-x={Math.PI / 2}><torusGeometry args={[0.2, 0.045, 5, 8]} /><AccentMaterial color={accent} glow={0.3} /></mesh>}
          {a >= 2 && (
            <mesh position={[0, 0.6, -0.55]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.7, 6]} />
              <AccentMaterial color={accent} glow={0.3} />
            </mesh>
          )}
          {a >= 3 && <mesh position={[0, 1.3, 0.84]} rotation-x={Math.PI / 2} castShadow><cylinderGeometry args={[0.34, 0.4, 0.28, 6]} />{metal}</mesh>}
          {a >= 4 && <mesh position={[0.48, 1.48, -0.14]}><octahedronGeometry args={[0.16, 0]} /><AccentMaterial color={accent} glow={0.5} /></mesh>}
          {b >= 1 && <mesh position={[0, 1.3, 0.56]} rotation-x={Math.PI / 2}><torusGeometry args={[0.3, 0.045, 5, 8]} /><AccentMaterial color={accent} glow={0.32} /></mesh>}
          {b >= 2 && <mesh position={[0.48, 1.2, -0.14]} castShadow><boxGeometry args={[0.18, 0.4, 0.22]} />{metal}</mesh>}
          {b >= 3 && (
            <mesh position={[0.34, 0.92, -0.22]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.11, 0.025, 5, 8]} />
              <AccentMaterial color={accent} glow={0.5} />
            </mesh>
          )}
          {b >= 4 && <mesh position={[0, 1.3, 1.04]} rotation-x={Math.PI / 2}><coneGeometry args={[0.42, 0.22, 7]} /><AccentMaterial color={accent} glow={0.38} /></mesh>}
        </>
      );
    case "freezer":
      return (
        <>
          {a >= 1 && <mesh position={[-0.42, 1.0, 0.2]} rotation-z={0.3}><octahedronGeometry args={[0.17, 0]} /><AccentMaterial color="#cfefff" glow={0.55} /></mesh>}
          {a >= 2 && (
            <mesh position={[0.4, 1.0, 0.2]} rotation-z={-0.3}>
              <icosahedronGeometry args={[0.2, 0]} />
              <AccentMaterial color="#cfefff" glow={0.6} />
            </mesh>
          )}
          {a >= 3 && <mesh position={[0, 1.14, 0.68]} rotation-x={Math.PI / 2}><torusGeometry args={[0.24, 0.045, 5, 8]} /><AccentMaterial color="#cfefff" glow={0.45} /></mesh>}
          {a >= 4 && <mesh position={[0, 1.45, -0.35]}><icosahedronGeometry args={[0.2, 0]} /><AccentMaterial color="#cfefff" glow={0.7} /></mesh>}
          {b >= 1 && <mesh position={[0.5, 0.86, 0]} rotation-z={0.4}><boxGeometry args={[0.12, 0.7, 0.18]} />{metal}</mesh>}
          {b >= 2 && (
            <mesh position={[-0.4, 1.0, 0.2]} rotation-z={0.3}>
              <coneGeometry args={[0.14, 0.6, 5]} />
              <AccentMaterial color="#cfefff" glow={0.6} />
            </mesh>
          )}
          {b >= 3 && <mesh position={[-0.5, 0.86, 0]} rotation-z={-0.4}><boxGeometry args={[0.12, 0.7, 0.18]} />{metal}</mesh>}
          {b >= 4 && <mesh position={[0, 0.98, 0.78]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.25, 0.3, 0.24, 6]} /><AccentMaterial color={accent} glow={0.4} /></mesh>}
        </>
      );
    case "rocket":
      return (
        <>
          {a >= 1 && <mesh position={[0, 1.34, 0.26]} castShadow><boxGeometry args={[0.54, 0.16, 0.28]} />{metal}</mesh>}
          {a >= 2 && (
            <group position={[0.58, 0.82, -0.28]}>
              <mesh castShadow>
                <boxGeometry args={[0.36, 0.32, 0.38]} />
                {metal}
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <coneGeometry args={[0.1, 0.22, 5]} />
                <AccentMaterial color={accent} glow={0.25} />
              </mesh>
            </group>
          )}
          {a >= 3 && (
            <>
              <mesh position={[0.65, 0.65, -0.12]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.07, 0.07, 0.68, 5]} />{metal}</mesh>
              <mesh position={[-0.65, 0.65, -0.12]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.07, 0.07, 0.68, 5]} />{metal}</mesh>
            </>
          )}
          {a >= 4 && <mesh position={[0, 1.28, -0.58]} rotation-x={Math.PI / 2}><torusGeometry args={[0.34, 0.045, 5, 8]} /><AccentMaterial color={accent} glow={0.35} /></mesh>}
          {b >= 1 && <mesh position={[0, 0.7, -0.5]} castShadow><boxGeometry args={[1.2, 0.18, 0.22]} />{metal}</mesh>}
          {b >= 2 && <mesh position={[0, 0.98, 0.92]} rotation-x={Math.PI / 2}><torusGeometry args={[0.25, 0.05, 5, 8]} /><AccentMaterial color={accent} glow={0.25} /></mesh>}
          {b >= 3 && (
            <group position={[0, 1.3, -0.22]}>
              <mesh position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.24, 5]} />
                {metal}
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <octahedronGeometry args={[0.14, 0]} />
                <AccentMaterial color={accent} glow={0.8} />
              </mesh>
            </group>
          )}
          {b >= 4 && <mesh position={[0, 1.34, -0.3]}><octahedronGeometry args={[0.15, 0]} /><AccentMaterial color={accent} glow={0.72} /></mesh>}
        </>
      );
    case "laser":
      return (
        <>
          {a >= 1 && <mesh position={[0, 1.34, 0.78]} rotation-x={Math.PI / 2}><torusGeometry args={[0.3, 0.05, 5, 8]} /><AccentMaterial color={accent} glow={0.42} /></mesh>}
          {a >= 2 && <mesh position={[0, 1.48, 0.4]} rotation-y={Math.PI / 4}><octahedronGeometry args={[0.18, 0]} /><AccentMaterial color="#e8fbff" glow={0.65} /></mesh>}
          {a >= 3 && (
            <mesh position={[0, 1.2, 0.6]} rotation-y={Math.PI / 4}>
              <octahedronGeometry args={[0.2, 0]} />
              <AccentMaterial color={accent} glow={0.9} />
            </mesh>
          )}
          {a >= 4 && <mesh position={[0, 1.4, -0.32]} rotation-y={Math.PI / 4} castShadow><boxGeometry args={[0.66, 0.14, 0.18]} />{metal}</mesh>}
          {b >= 1 && <mesh position={[0, 1.18, 0.78]} rotation-x={Math.PI / 2}><torusGeometry args={[0.24, 0.035, 5, 8]} /><AccentMaterial color={accent} glow={0.38} /></mesh>}
          {b >= 2 && (
            <mesh position={[0, 0.9, 1.1]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.2, 0.03, 5, 8]} />
              <AccentMaterial color={accent} glow={0.7} />
            </mesh>
          )}
          {b >= 3 && (
            <>
              <mesh position={[0.65, 0.98, -0.08]}><octahedronGeometry args={[0.16, 0]} /><AccentMaterial color={accent} glow={0.55} /></mesh>
              <mesh position={[-0.65, 0.98, -0.08]}><octahedronGeometry args={[0.16, 0]} /><AccentMaterial color={accent} glow={0.55} /></mesh>
            </>
          )}
          {b >= 4 && <mesh position={[0, 1.52, -0.16]} rotation-x={Math.PI / 2}><torusGeometry args={[0.42, 0.035, 5, 10]} /><AccentMaterial color={accent} glow={0.55} /></mesh>}
        </>
      );
    default:
      return null;
  }
}

export function TowerModel({
  tower,
  accent,
  level,
  bodyColor,
  reducedMotion = false,
}: TowerModelProps) {
  const rig = useRef<THREE.Group>(null);
  const weapon = useRef<THREE.Group>(null);
  const weaponBasePosition = useRef<THREE.Vector3 | null>(null);
  const signature = useRef<THREE.Group>(null);
  const muzzle = useRef<THREE.Mesh>(null);
  const muzzleSecondary = useRef<THREE.Mesh>(null);
  const muzzleTertiary = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const identityCore = useRef<THREE.Mesh>(null);
  const identityHalo = useRef<THREE.Mesh>(null);
  const idleSeed = tower.id * 0.71;
  const baseScale = 1 + Math.min(level - 1, 8) * 0.025;
  const signatureSpin =
    tower.kind === "tesla" ? 0.52 : tower.kind === "laser" ? -0.24 : tower.kind === "freezer" ? 0.18 :
    tower.kind === "rocket" ? -0.12 : tower.kind === "flamethrower" ? 0.1 : 0.07;
  const recoilTravel =
    tower.kind === "shotgunner" ? 0.3 : tower.kind === "rocket" ? 0.24 :
      tower.kind === "sniper" ? 0.15 : tower.kind === "laser" ? 0.045 : 0.12;
  const recoilPitch =
    tower.kind === "shotgunner" ? 0.09 :
    tower.kind === "rocket" ? 0.075 :
    tower.kind === "sniper" ? 0.06 : 0.025;
  const heavyChassis = tower.kind === "shotgunner" || tower.kind === "rocket";
  const energyTower = tower.kind === "tesla" || tower.kind === "freezer" || tower.kind === "laser";

  const primary = bodyColor || "#6d7477";
  const secondary = bodyColor ? "#d8d2c5" : "#b5b0a3";
  const dark = "#384047";
  const deep = "#252c31";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const motionScale = reducedMotion ? 0 : 1;
    const bob = Math.sin(t * 2.1 + idleSeed) * 0.035 * motionScale;
    if (rig.current) {
      const punch = Math.max(0, tower.recoil) * motionScale;
      // Keep the chassis planted and reserve most of the shot response for the weapon assembly.
      rig.current.position.y = bob + punch * 0.012;
      rig.current.scale.set(
        baseScale * (1 + punch * (heavyChassis ? 0.016 : 0.01)),
        baseScale * (1 - punch * (heavyChassis ? 0.028 : 0.018)),
        baseScale * (1 + punch * (heavyChassis ? 0.016 : 0.01)),
      );
      rig.current.rotation.z = Math.sin(t * 13 + idleSeed) * punch * (heavyChassis ? 0.045 : 0.022) * motionScale;
    }
    if (weapon.current) {
      if (!weaponBasePosition.current) weaponBasePosition.current = weapon.current.position.clone();
      const base = weaponBasePosition.current;
      const kick = Math.max(0, tower.recoil) * motionScale;
      weapon.current.position.set(base.x, base.y + kick * 0.012, base.z - kick * recoilTravel);
      weapon.current.rotation.x = -kick * recoilPitch;
    }
    if (signature.current) {
      signature.current.rotation.y = t * signatureSpin * motionScale;
      signature.current.scale.setScalar(1 + Math.sin(t * 3.2 + idleSeed) * 0.025 * motionScale);
    }
    if (core.current) {
      const pulse = 1 + Math.sin(t * 5 + idleSeed) * 0.1 * motionScale;
      core.current.scale.setScalar(pulse);
      const material = core.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.7 + Math.max(0, tower.recoil) * 0.8 + ((tower.surge ?? 0) > 0 ? 0.6 : 0);
    }
    if (identityCore.current) {
      const pulse = 1 + Math.sin(t * 4.5 + idleSeed) * 0.08 * motionScale;
      identityCore.current.scale.setScalar(pulse);
      const material = identityCore.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.7 + Math.max(0, tower.recoil) * 0.55;
    }
    if (identityHalo.current) {
      identityHalo.current.rotation.z = t * 0.5 * motionScale + idleSeed;
      identityHalo.current.scale.setScalar(1 + Math.sin(t * 2.8 + idleSeed) * 0.04 * motionScale);
    }
    const flash = Math.max(0, tower.recoil - 0.12) * 1.4;
    if (muzzle.current) {
      muzzle.current.visible = tower.recoil > 0.12;
      muzzle.current.scale.setScalar(0.45 + flash);
    }
    if (muzzleSecondary.current) {
      const active = tower.recoil > 0.12 && ((tower.kind === "rifleman" && tower.b >= 1) || (tower.kind === "shotgunner" && tower.a >= 2));
      muzzleSecondary.current.visible = active;
      muzzleSecondary.current.scale.setScalar(0.45 + flash);
    }
    if (muzzleTertiary.current) {
      const active = tower.recoil > 0.12 && tower.kind === "rifleman" && tower.b >= 4;
      muzzleTertiary.current.visible = active;
      muzzleTertiary.current.scale.setScalar(0.45 + flash);
    }
  });

  const renderRifleman = () => (
    <>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.55, 0.42, 1.28]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.78} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <dodecahedronGeometry args={[0.68, 0]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.66} />
      </mesh>
      <mesh position={[-0.82, 0.35, 0]} rotation-z={-0.18} castShadow>
        <boxGeometry args={[0.18, 0.68, 0.78]} />
        <AccentMaterial color={accent} glow={0.22} />
      </mesh>
      <mesh position={[0.82, 0.35, 0]} rotation-z={0.18} castShadow>
        <boxGeometry args={[0.18, 0.68, 0.78]} />
        <AccentMaterial color={accent} glow={0.22} />
      </mesh>
      <group ref={weapon} position={[0, 0.9, 0]}>
        <mesh position={[0, 0, 0.72]} castShadow>
          <boxGeometry args={[0.18, 0.18, 1.72]} />
          <meshStandardMaterial color={dark} flatShading metalness={0.38} roughness={0.45} />
        </mesh>
        {tower.b >= 1 && (
          <mesh position={[0.22, 0, 0.68]} castShadow>
            <boxGeometry args={[0.1, 0.1, 1.62]} />
            <meshStandardMaterial color={dark} flatShading metalness={0.38} roughness={0.45} />
          </mesh>
        )}
        {tower.b >= 4 && (
          <mesh position={[-0.22, 0, 0.68]} castShadow>
            <boxGeometry args={[0.1, 0.1, 1.62]} />
            <meshStandardMaterial color={dark} flatShading metalness={0.38} roughness={0.45} />
          </mesh>
        )}
        {tower.a >= 1 && (
          <mesh position={[0, 0.17, 0.16]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.42]} />
            <AccentMaterial color={accent} glow={0.35} />
          </mesh>
        )}
        {tower.a >= 4 && (
          <mesh position={[0, 0.02, 1.37]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.13, 0.025, 5, 8]} />
            <AccentMaterial color={accent} glow={0.65} />
          </mesh>
        )}
        <mesh ref={muzzle} position={[0, 0, 1.58]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.16, 0.34, 6]} />
          <AccentMaterial color="#fff1bd" glow={1.1} />
        </mesh>
        {tower.b >= 1 && (
          <mesh ref={muzzleSecondary} position={[0.22, 0, 1.48]} rotation-x={Math.PI / 2} visible={false}>
            <coneGeometry args={[0.11, 0.28, 6]} />
            <AccentMaterial color="#fff1bd" glow={1.1} />
          </mesh>
        )}
        {tower.b >= 4 && (
          <mesh ref={muzzleTertiary} position={[-0.22, 0, 1.48]} rotation-x={Math.PI / 2} visible={false}>
            <coneGeometry args={[0.11, 0.28, 6]} />
            <AccentMaterial color="#fff1bd" glow={1.1} />
          </mesh>
        )}
      </group>
    </>
  );

  const renderShotgunner = () => (
    <>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.56, 1.36]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.74} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.63, 0]} castShadow>
        <boxGeometry args={[1.28, 0.54, 0.98]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.66} />
      </mesh>
      {[-0.44, 0.44].map((x) => (
        <mesh key={x} position={[x, 0.66, -0.15]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 0.72, 6]} />
          <AccentMaterial color={accent} glow={0.35} />
        </mesh>
      ))}
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.15]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.46, 8]} />
          <meshStandardMaterial color={deep} flatShading />
        </mesh>
      ))}
      <group ref={weapon} position={[0, 1.02, 0]}>
        {tower.a >= 2 ? (
          <>
            {[-0.24, 0.24].map((x) => (
              <mesh key={x} position={[x, 0, 0.72]} castShadow>
                <cylinderGeometry args={[0.09, 0.12, 1.42, 6]} />
                <meshStandardMaterial color={dark} flatShading metalness={0.4} roughness={0.44} />
              </mesh>
            ))}
          </>
        ) : (
          <mesh position={[0, 0, 0.72]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 1.42, 6]} />
            <meshStandardMaterial color={dark} flatShading metalness={0.4} roughness={0.44} />
          </mesh>
        )}
        <mesh ref={muzzle} position={tower.a >= 2 ? [-0.24, 0, 1.48] : [0, 0, 1.48]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.28, 0.38, 7]} />
          <AccentMaterial color="#fff0bb" glow={1.15} />
        </mesh>
        {tower.a >= 2 && (
          <mesh ref={muzzleSecondary} position={[0.24, 0, 1.48]} rotation-x={Math.PI / 2} visible={false}>
            <coneGeometry args={[0.28, 0.38, 7]} />
            <AccentMaterial color="#fff0bb" glow={1.15} />
          </mesh>
        )}
      </group>
    </>
  );

  const renderSniper = () => (
    <>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[1.18, 1.4, 0.42, 8]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.76} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.7, 1.45, 0.7]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.68} />
      </mesh>
      <mesh position={[0.44, 0.92, 0.18]} rotation-z={-0.28} castShadow>
        <boxGeometry args={[0.16, 0.94, 0.16]} />
        <meshStandardMaterial color={dark} flatShading />
      </mesh>
      <group ref={weapon} position={[0, 1.66, 0.08]}>
        <mesh position={[0, 0.05, 0.78]} castShadow>
          <boxGeometry args={[0.12, 0.16, 2.08]} />
          <meshStandardMaterial color={dark} flatShading metalness={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0.36]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.62, 8]} />
          <AccentMaterial color={accent} glow={0.25} />
        </mesh>
        {tower.a >= 1 && (
          <mesh position={[0.22, 0.25, 0.42]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.42, 6]} />
            <AccentMaterial color={accent} glow={0.5} />
          </mesh>
        )}
        <mesh ref={muzzle} position={[0, 0.05, 1.83]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.12, 0.3, 6]} />
          <AccentMaterial color="#fff4ce" glow={1.2} />
        </mesh>
      </group>
      <mesh position={[0, 1.98, 0.36]}>
        <boxGeometry args={[0.26, 0.08, 0.54]} />
        <AccentMaterial color={accent} glow={0.5} />
      </mesh>
    </>
  );

  const renderFreezer = () => (
    <>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[1.28, 1.48, 0.42, 8]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <dodecahedronGeometry args={[0.92, 0]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.96, 0.55]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.38, 8]} />
        <AccentMaterial color={accent} glow={0.58} />
      </mesh>
      <group ref={signature} position={[0, 0.98, -0.55]}>
        <Core color={accent} size={0.42} />
        <mesh position={[0, 0.1, 0]} rotation-z={0.72}>
          <octahedronGeometry args={[0.58, 0]} />
          <meshStandardMaterial color="#d7f5ff" emissive={accent} emissiveIntensity={0.32} flatShading roughness={0.35} />
        </mesh>
      </group>
      <mesh ref={core} position={[0, 1.42, 0.02]}>
        <octahedronGeometry args={[0.2, 0]} />
        <AccentMaterial color={accent} glow={0.95} />
      </mesh>
    </>
  );

  const renderTesla = () => (
    <>
      <mesh position={[0, 0.23, 0]} castShadow>
        <cylinderGeometry args={[1.18, 1.46, 0.46, 8]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.66} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.72, 1.34, 8]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.56} />
      </mesh>
      <group ref={signature} position={[0, 0.85, 0]}>
        {[0.2, 0.46, 0.72, 0.98].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.38 + y * 0.08, 0.055, 5, 10]} />
            <AccentMaterial color={accent} glow={0.68} />
          </mesh>
        ))}
      </group>
      <mesh ref={core} position={[0, 1.74, 0]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <AccentMaterial color={accent} glow={1.1} />
      </mesh>
    </>
  );

  const renderFlamethrower = () => (
    <>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.64, 0.48, 1.32]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.72} metalness={0.12} />
      </mesh>
      {[-0.48, 0.48].map((x) => (
        <group key={x} position={[x, 0.88, -0.14]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.4, 1.14, 8]} />
            <meshStandardMaterial color={secondary} flatShading roughness={0.55} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.4, 0.12]}>
            <torusGeometry args={[0.28, 0.045, 5, 10]} />
            <AccentMaterial color={accent} glow={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.24, 0.08]} castShadow>
        <dodecahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color={dark} flatShading metalness={0.25} />
      </mesh>
      <group ref={weapon} position={[0, 1.3, 0.12]}>
        <mesh position={[0, 0, 0.6]} castShadow>
          <cylinderGeometry args={[0.22, 0.32, 0.78, 6]} />
          <meshStandardMaterial color={deep} flatShading />
        </mesh>
        <mesh ref={muzzle} position={[0, 0, 1.12]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.3, 0.5, 7]} />
          <AccentMaterial color="#ffcc5b" glow={1.2} />
        </mesh>
        <mesh position={[0, 0, 1.04]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.15, 0.26, 6]} />
          <meshStandardMaterial color="#fff0ad" emissive="#ff873c" emissiveIntensity={0.7} flatShading />
        </mesh>
      </group>
    </>
  );

  const renderRocket = () => (
    <>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[1.88, 0.5, 1.4]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.72} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.22, 0.5, 1.04]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.62} />
      </mesh>
      <group ref={weapon} position={[0, 1.02, 0]}>
        <group position={[0, 0, 0.26]}>
          <mesh rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.21, 0.24, 0.86, 6]} />
            <meshStandardMaterial color={dark} flatShading metalness={0.4} />
          </mesh>
          <mesh position={[0, -0.18, 0.56]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.15, 0.34, 6]} />
            <AccentMaterial color={accent} glow={0.32} />
          </mesh>
        </group>
        <mesh ref={muzzle} position={[0, 0, 0.82]} rotation-x={Math.PI / 2} visible={false}>
          <ringGeometry args={[0.32, 0.5, 8]} />
          <meshBasicMaterial color="#ffe6a8" transparent opacity={0.95} />
        </mesh>
      </group>
      <mesh position={[0, 0.78, -0.54]} rotation-x={0.38}>
        <boxGeometry args={[1.15, 0.08, 0.35]} />
        <AccentMaterial color={accent} glow={0.28} />
      </mesh>
    </>
  );

  const renderLaser = () => (
    <>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.48, 0.42, 8]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.62} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation-y={Math.PI / 4} castShadow>
        <boxGeometry args={[1.05, 1.18, 1.05]} />
        <meshStandardMaterial color={secondary} flatShading roughness={0.5} metalness={0.28} />
      </mesh>
      <group ref={weapon} position={[0, 1.42, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.52, 0.64, 0.38, 8]} />
          <meshStandardMaterial color={dark} flatShading metalness={0.38} />
        </mesh>
        <mesh position={[0, 0, 0.35]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.46, 0.08, 5, 10]} />
          <AccentMaterial color={accent} glow={0.8} />
        </mesh>
        <mesh ref={muzzle} position={[0, 0, 0.56]} rotation-x={Math.PI / 2} visible={false}>
          <cylinderGeometry args={[0.24, 0.36, 0.2, 8]} />
          <AccentMaterial color="#ecfdff" glow={1.25} />
        </mesh>
      </group>
      <mesh ref={core} position={[0, 1.48, 0.03]}>
        <icosahedronGeometry args={[0.22, 0]} />
        <AccentMaterial color={accent} glow={1.1} />
      </mesh>
    </>
  );

  let model: ReactNode;
  switch (tower.kind) {
    case "shotgunner":
      model = renderShotgunner();
      break;
    case "sniper":
      model = renderSniper();
      break;
    case "freezer":
      model = renderFreezer();
      break;
    case "tesla":
      model = renderTesla();
      break;
    case "flamethrower":
      model = renderFlamethrower();
      break;
    case "rocket":
      model = renderRocket();
      break;
    case "laser":
      model = renderLaser();
      break;
    default:
      model = renderRifleman();
      break;
  }

  return (
    <group ref={rig} position={[0, 0, 0]} scale={1 + Math.min(level - 1, 8) * 0.025}>
      {model}
      <group position={[0, 0.48, -0.62]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.12, 0.22]} />
          <AccentMaterial color={accent} glow={0.18} />
        </mesh>
        <mesh position={[0, 0.02, -0.07]} rotation-x={Math.PI / 2}>
          <ringGeometry args={[0.14, 0.19, 6]} />
          <meshBasicMaterial color={accent} transparent opacity={0.42} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.05, 0.18, 8]} />
        <meshStandardMaterial color="#343a3e" flatShading roughness={0.82} metalness={0.12} />
      </mesh>
      {/* A raised octagonal bearing and low skids ground the turret like a physical defense platform. */}
      <mesh position={[0, 0.215, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.92, 1.02, 0.09, 8]} />
        <meshStandardMaterial color="#56616a" flatShading roughness={0.52} metalness={0.32} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.13, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.12, 1.34]} />
          <meshStandardMaterial color="#252c31" flatShading roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      <mesh ref={identityHalo} position={[0, 0.24, 0]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.68, 0.84, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={energyTower ? 0.22 : 0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={identityCore} visible={energyTower} position={[0, 0.31, -0.08]}>
        <icosahedronGeometry args={[0.16, 0]} />
        <AccentMaterial color={accent} glow={0.9} />
      </mesh>
      <UpgradeGear kind={tower.kind} a={tower.a} b={tower.b} accent={accent} dark={dark} />
      {level >= 3 && (
        <>
          <mesh position={[-0.62, 0.3, -0.05]} rotation-z={0.18} castShadow>
            <boxGeometry args={[0.12, 0.34, 0.16]} />
            <AccentMaterial color={accent} glow={0.28} />
          </mesh>
          <mesh position={[0.62, 0.3, -0.05]} rotation-z={-0.18} castShadow>
            <boxGeometry args={[0.12, 0.34, 0.16]} />
            <AccentMaterial color={accent} glow={0.28} />
          </mesh>
        </>
      )}
      {level >= 5 && (
        <mesh position={[0, 0.46, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.38, 0.035, 5, 10]} />
          <AccentMaterial color={accent} glow={0.48} />
        </mesh>
      )}
    </group>
  );
}
