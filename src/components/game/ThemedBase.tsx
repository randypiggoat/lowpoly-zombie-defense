import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import type { StageEnvironmentId } from "@/game/stageEnvironments";
import { getEnvironmentVisualProfile } from "@/game/environmentVisuals";
import { game } from "@/game/engine";

export function ThemedBase({
  position,
  environmentId,
}: {
  position: { x: number; z: number };
  environmentId: StageEnvironmentId;
}) {
  const profile = getEnvironmentVisualProfile(environmentId);
  const beacon = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Mesh>(null);
  const damageOne = useRef<THREE.Mesh>(null);
  const damageTwo = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const maxHp = Math.max(1, game.state.baseMaxHp || 1);
    const ratio = Math.max(0, Math.min(1, game.state.baseHp / maxHp));
    const damaged = ratio < 0.72;
    const critical = ratio < 0.34;

    if (damageOne.current) damageOne.current.visible = damaged;
    if (damageTwo.current) damageTwo.current.visible = critical;
    if (beacon.current) {
      beacon.current.rotation.y = clock.elapsedTime * 0.75;
      beacon.current.visible = ratio > 0;
      beacon.current.scale.setScalar(
        critical ? 1.08 + Math.sin(clock.elapsedTime * 8) * 0.08 : 1,
      );
    }
    if (core.current) {
      core.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * (critical ? 7 : 4)) * (critical ? 0.13 : 0.06),
      );
    }
    if (body.current) {
      const material = body.current.material as THREE.MeshStandardMaterial;
      material.color.set(critical ? profile.palette.buildingAlt : profile.palette.base);
    }
  });

  const b = profile.palette.base;
  const a = profile.palette.baseAccent;
  const s = profile.baseStyle;

  if (s === "city") {
    return (
      <group position={[position.x, 0, position.z]}>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.2, 0.68, 4.8]} />
          <meshStandardMaterial color={profile.palette.roadEdge} flatShading />
        </mesh>
        <mesh ref={body} position={[0, 1.55, 0]} castShadow>
          <boxGeometry args={[3.8, 2.1, 3]} />
          <meshStandardMaterial color={b} flatShading />
        </mesh>
        <mesh position={[0, 2.72, 0]} castShadow>
          <boxGeometry args={[2.1, 0.42, 2]} />
          <meshStandardMaterial color={profile.palette.buildingAlt} flatShading />
        </mesh>
        <mesh position={[0, 3.1, 1.52]}>
          <boxGeometry args={[2.2, 0.35, 0.06]} />
          <meshStandardMaterial
            color={profile.palette.glass}
            emissive={profile.palette.glass}
            emissiveIntensity={0.28}
            flatShading
          />
        </mesh>
        <Damage ref={damageOne} visible={false} position={[-1.5, 2.1, 1.54]} rotation={-0.2} color="#2a2220" />
        <Damage ref={damageTwo} visible={false} position={[1.1, 1.35, 1.54]} rotation={0.5} color="#201a19" />
        <Beacon beacon={beacon} core={core} color={a} y={3.35} />
      </group>
    );
  }

  if (s === "ice-lab" || s === "cavern") {
    return (
      <group position={[position.x, 0, position.z]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[3.3, 3.6, 0.6, 10]} />
          <meshStandardMaterial color={profile.palette.roadEdge} flatShading />
        </mesh>
        <mesh ref={body} position={[0, 1.42, 0]} castShadow>
          <sphereGeometry args={[2.35, 10, 6]} />
          <meshStandardMaterial color={b} flatShading />
        </mesh>
        <mesh position={[0, 1.55, 1.72]}>
          <sphereGeometry args={[0.5, 7, 4]} />
          <meshStandardMaterial
            color={profile.palette.glass}
            emissive={profile.palette.glass}
            emissiveIntensity={0.28}
            flatShading
          />
        </mesh>
        <Damage ref={damageOne} visible={false} position={[-1.4, 1.55, 1.88]} rotation={-0.32} color="#33515a" />
        <Damage ref={damageTwo} visible={false} position={[0.95, 0.95, 1.72]} rotation={0.4} color="#2a4650" />
        <Beacon beacon={beacon} core={core} color={a} y={3.35} />
      </group>
    );
  }

  if (s === "military" || s === "blacksite" || s === "industrial" || s === "foundry") {
    return (
      <group position={[position.x, 0, position.z]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[6.4, 0.64, 5]} />
          <meshStandardMaterial color={profile.palette.roadEdge} flatShading />
        </mesh>
        <mesh ref={body} position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[4.3, 1.95, 3.2]} />
          <meshStandardMaterial color={b} flatShading />
        </mesh>
        <mesh position={[0, 2.55, 0]}>
          <boxGeometry args={[3.2, 0.32, 2.25]} />
          <meshStandardMaterial color={profile.palette.roof} flatShading />
        </mesh>
        <mesh position={[0, 2.86, 1.64]}>
          <boxGeometry args={[2.4, 0.34, 0.05]} />
          <meshStandardMaterial
            color={profile.palette.glass}
            emissive={profile.palette.glass}
            emissiveIntensity={0.25}
            flatShading
          />
        </mesh>
        <Damage ref={damageOne} visible={false} position={[-1.25, 1.65, 1.65]} rotation={-0.35} color="#2b2421" />
        <Damage ref={damageTwo} visible={false} position={[1.05, 1.15, 1.65]} rotation={0.55} color="#1f1b1a" />
        <Beacon beacon={beacon} core={core} color={a} y={3.15} />
      </group>
    );
  }

  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.3, 3.7, 0.64, 9]} />
        <meshStandardMaterial color={profile.palette.roadEdge} flatShading />
      </mesh>
      <mesh ref={body} position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[1.85, 2.15, 2.2, 7]} />
        <meshStandardMaterial color={b} flatShading />
      </mesh>
      <mesh position={[0, 2.92, 0]} castShadow>
        <coneGeometry args={[2.15, 1.25, 7]} />
        <meshStandardMaterial color={profile.palette.roof} flatShading />
      </mesh>
      <mesh position={[0, 1.65, 2.02]}>
        <boxGeometry args={[1, 0.8, 0.05]} />
        <meshStandardMaterial
          color={profile.palette.glass}
          emissive={profile.palette.glass}
          emissiveIntensity={0.2}
          flatShading
        />
      </mesh>
      <Damage ref={damageOne} visible={false} position={[-0.9, 1.45, 2.03]} rotation={-0.28} color="#2d2522" />
      <Damage ref={damageTwo} visible={false} position={[0.8, 1.1, 2.03]} rotation={0.42} color="#211d1c" />
      <Beacon beacon={beacon} core={core} color={a} y={3.55} />
    </group>
  );
}

function Damage({
  ref,
  visible,
  position,
  rotation,
  color,
}: {
  ref: RefObject<THREE.Mesh | null>;
  visible: boolean;
  position: [number, number, number];
  rotation: number;
  color: string;
}) {
  return (
    <mesh ref={ref} visible={visible} position={position} rotation-z={rotation}>
      <boxGeometry args={[0.65, 0.08, 0.04]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Beacon({
  beacon,
  core,
  color,
  y,
}: {
  beacon: RefObject<THREE.Group | null>;
  core: RefObject<THREE.Mesh | null>;
  color: string;
  y: number;
}) {
  return (
    <group ref={beacon} position={[0, y, 0]}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.55, 0.06, 5, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.76}
          flatShading
        />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} flatShading />
      </mesh>
    </group>
  );
}
