import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Tower } from "@/game/engine";

type TowerModelProps = {
  tower: Tower;
  accent: string;
  level: number;
  bodyColor: string;
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

export function TowerModel({ tower, accent, level, bodyColor }: TowerModelProps) {
  const rig = useRef<THREE.Group>(null);
  const weapon = useRef<THREE.Group>(null);
  const signature = useRef<THREE.Group>(null);
  const muzzle = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const idleSeed = tower.id * 0.71;

  const primary = bodyColor || "#6d7477";
  const secondary = bodyColor ? "#d8d2c5" : "#b5b0a3";
  const dark = "#384047";
  const deep = "#252c31";
  const height = 0.92 + Math.min(level, 8) * 0.08;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const bob = Math.sin(t * 2.1 + idleSeed) * 0.035;
    if (rig.current) rig.current.position.y = bob;
    if (weapon.current) {
      weapon.current.position.z = 0.82 - tower.recoil * 0.18;
      weapon.current.position.y = tower.recoil * 0.018;
    }
    if (signature.current) {
      signature.current.rotation.y = t * (tower.kind === "tesla" ? 0.5 : 0.08);
      signature.current.scale.setScalar(1 + Math.sin(t * 3.2 + idleSeed) * 0.025);
    }
    if (core.current) {
      const pulse = 1 + Math.sin(t * 5 + idleSeed) * 0.1;
      core.current.scale.setScalar(pulse);
      const material = core.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.7 + Math.max(0, tower.recoil) * 0.8;
    }
    if (muzzle.current) {
      muzzle.current.visible = tower.recoil > 0.12;
      const flash = Math.max(0, tower.recoil - 0.12) * 1.4;
      muzzle.current.scale.setScalar(0.45 + flash);
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
        <mesh position={[0, 0.17, 0.16]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.42]} />
          <AccentMaterial color={accent} glow={0.35} />
        </mesh>
        <mesh ref={muzzle} position={[0, 0, 1.58]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.16, 0.34, 6]} />
          <AccentMaterial color="#fff1bd" glow={1.1} />
        </mesh>
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
        <mesh key={x} position={[x, 0.66, -0.15]} rotation-x={Math.PI / 2} castShadow>
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
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} position={[x, 0, 0.72]} castShadow>
            <cylinderGeometry args={[0.09, 0.12, 1.42, 6]} />
            <meshStandardMaterial color={dark} flatShading metalness={0.4} roughness={0.44} />
          </mesh>
        ))}
        <mesh ref={muzzle} position={[0, 0, 1.48]} rotation-x={Math.PI / 2} visible={false}>
          <coneGeometry args={[0.28, 0.38, 7]} />
          <AccentMaterial color="#fff0bb" glow={1.15} />
        </mesh>
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
        {[-0.46, -0.15, 0.15, 0.46].map((x) => (
          <group key={x} position={[x, 0, 0.26]}>
            <mesh rotation-x={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.16, 0.2, 0.86, 6]} />
              <meshStandardMaterial color={dark} flatShading metalness={0.4} />
            </mesh>
            <mesh position={[0, -0.18, 0.56]} rotation-x={Math.PI / 2}>
              <coneGeometry args={[0.12, 0.3, 6]} />
              <AccentMaterial color={accent} glow={0.32} />
            </mesh>
          </group>
        ))}
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

  let model: React.ReactNode;
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
      <mesh position={[0, 0.48, -0.62]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.22]} />
        <AccentMaterial color={accent} glow={0.18} />
      </mesh>
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.05, 0.18, 8]} />
        <meshStandardMaterial color="#4b5052" flatShading roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.72, 0.84, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.24} side={THREE.DoubleSide} />
      </mesh>
      <Core color={tower.kind === "tesla" || tower.kind === "laser" || tower.kind === "freezer" ? accent : dark} size={0.01} />
    </group>
  );
}
