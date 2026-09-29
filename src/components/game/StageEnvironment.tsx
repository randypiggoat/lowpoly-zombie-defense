import type { ReactNode } from "react";
import type {
  EnvironmentLandmark,
  EnvironmentProp,
  EnvironmentPropKind,
  StageEnvironmentId,
} from "@/game/stageEnvironments";
import { getStageEnvironment } from "@/game/stageEnvironments";

const C = {
  wood: "#6f4c35",
  wood2: "#a67a4c",
  leaf: "#2f6b45",
  leaf2: "#4d8b56",
  pine: "#28513d",
  stone: "#77776f",
  stone2: "#4e504d",
  snow: "#e8eff2",
  ice: "#79b9ca",
  ice2: "#b6e2ea",
  sand: "#c89b61",
  metal: "#56616a",
  metal2: "#30363c",
  hazard: "#c86b45",
  gold: "#e3b550",
  water: "#4f9bb3",
  glass: "#8fc9d6",
  brick: "#71433d",
  bone: "#d3c5a5",
  dark: "#20252a",
  neon: "#8bd3cf",
  lava: "#db6847",
  lava2: "#f0a34b",
  sandbag: "#9a8a63",
};

function Mat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} flatShading />;
}

function Tree({ pine = false, dead = false }: { pine?: boolean; dead?: boolean }) {
  return (
    <>
      <mesh position={[0, pine ? 1 : 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, pine ? 2 : 1.2, 6]} />
        <Mat color={C.wood} />
      </mesh>
      {dead ? (
        <>
          <mesh position={[0.55, 2, 0]} rotation-z={0.65} castShadow>
            <cylinderGeometry args={[0.08, 0.11, 1.1, 5]} />
            <Mat color={C.wood} />
          </mesh>
          <mesh position={[-0.5, 1.8, 0]} rotation-z={-0.65} castShadow>
            <cylinderGeometry args={[0.08, 0.11, 1, 5]} />
            <Mat color={C.wood} />
          </mesh>
        </>
      ) : pine ? (
        <>
          <mesh position={[0, 2, 0]} castShadow><coneGeometry args={[0.95, 1.8, 6]} /><Mat color={C.pine} /></mesh>
          <mesh position={[0, 2.75, 0]} castShadow><coneGeometry args={[0.72, 1.35, 6]} /><Mat color={C.leaf} /></mesh>
          <mesh position={[0, 3.35, 0]} castShadow><coneGeometry args={[0.45, 0.95, 6]} /><Mat color={C.leaf2} /></mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.55, 0]} castShadow><coneGeometry args={[1.05, 1.8, 6]} /><Mat color={C.leaf} /></mesh>
          <mesh position={[0, 2.3, 0]} castShadow><coneGeometry args={[0.75, 1.25, 6]} /><Mat color={C.leaf2} /></mesh>
        </>
      )}
    </>
  );
}

function Palm() {
  return (
    <>
      <mesh position={[0, 1.15, 0]} rotation-z={-0.12} castShadow>
        <cylinderGeometry args={[0.11, 0.2, 2.25, 6]} />
        <Mat color={C.wood2} />
      </mesh>
      {[-0.8, -0.25, 0.35, 0.8].map((x) => (
        <mesh key={x} position={[x * 0.48, 2.35 + Math.abs(x) * 0.08, 0]} rotation-z={x * -0.45} castShadow>
          <coneGeometry args={[0.16, 1.25, 5]} />
          <Mat color={C.leaf2} />
        </mesh>
      ))}
    </>
  );
}

function Rock({ big = false, crystal = false, ice = false }: { big?: boolean; crystal?: boolean; ice?: boolean }) {
  return (
    <mesh rotation={[0.2, 0.6, 0.08]} castShadow>
      {crystal ? <coneGeometry args={[0.55, 1.8, 5]} /> : <dodecahedronGeometry args={[big ? 0.9 : 0.58, 0]} />}
      <Mat color={crystal ? C.ice2 : ice ? C.ice : C.stone} />
    </mesh>
  );
}

function Cactus() {
  return (
    <>
      <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.22, 0.28, 1.9, 6]} /><Mat color="#4f7f51" /></mesh>
      <mesh position={[0.42, 0.95, 0]} rotation-z={-Math.PI / 2} castShadow><cylinderGeometry args={[0.13, 0.16, 0.75, 6]} /><Mat color="#4f7f51" /></mesh>
      <mesh position={[-0.4, 0.65, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.12, 0.15, 0.65, 6]} /><Mat color="#4f7f51" /></mesh>
    </>
  );
}

function BoxProp({ barrel = false, color = C.wood2 }: { barrel?: boolean; color?: string }) {
  return barrel ? (
    <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.46, 0.5, 0.9, 10]} /><Mat color={C.wood} /></mesh>
  ) : (
    <mesh position={[0, 0.48, 0]} rotation-y={0.18} castShadow><boxGeometry args={[0.88, 0.96, 0.88]} /><Mat color={color} /></mesh>
  );
}

function Fence() {
  return (
    <>
      {[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 0.75, 0]} castShadow><boxGeometry args={[0.13, 1.5, 0.13]} /><Mat color={C.wood} /></mesh>)}
      <mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[1.75, 0.12, 0.12]} /><Mat color={C.wood2} /></mesh>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.75, 0.12, 0.12]} /><Mat color={C.wood2} /></mesh>
    </>
  );
}

function Lamp() {
  return (
    <>
      <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 3.1, 6]} /><Mat color={C.metal2} /></mesh>
      <mesh position={[0, 3.12, 0]} castShadow><boxGeometry args={[0.4, 0.18, 0.4]} /><Mat color={C.gold} /></mesh>
    </>
  );
}

function Car() {
  return (
    <group rotation-y={Math.PI / 2}>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[2.2, 0.55, 1.05]} /><Mat color="#516875" /></mesh>
      <mesh position={[0.22, 0.92, 0]} castShadow><boxGeometry args={[1.1, 0.35, 0.86]} /><Mat color={C.glass} /></mesh>
      {[-0.78, 0.78].flatMap((x) => [-0.5, 0.5].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.33, z]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.22, 0.22, 0.12, 8]} /><Mat color={C.dark} /></mesh>))}
    </group>
  );
}

function Industrial({ kind }: { kind: EnvironmentPropKind }) {
  switch (kind) {
    case "container": return <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[2.2, 1.5, 1]} /><Mat color={C.metal} /></mesh>;
    case "ice": return <Rock ice />;
    case "crystal": return <Rock crystal />;
    case "dock": return <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[2.2, 0.22, 1.3]} /><Mat color={C.wood} /></mesh>;
    case "boat": return <mesh position={[0, 0.35, 0]} rotation-y={Math.PI / 2} castShadow><coneGeometry args={[0.9, 2.4, 4]} /><Mat color={C.wood2} /></mesh>;
    case "mine-cart": return <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.25, 0.65, 1]} /><Mat color={C.metal} /></mesh>;
    case "ore": return <Rock big />;
    case "sandbag": return <><mesh position={[-0.55, 0.28, 0]} castShadow><boxGeometry args={[0.62, 0.45, 0.42]} /><Mat color={C.sandbag} /></mesh><mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.62, 0.45, 0.42]} /><Mat color={C.sandbag} /></mesh><mesh position={[0.55, 0.28, 0]} castShadow><boxGeometry args={[0.62, 0.45, 0.42]} /><Mat color={C.sandbag} /></mesh></>;
    case "tombstone": return <group><mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.65, 1, 0.18]} /><Mat color={C.bone} /></mesh><mesh position={[0, 1, 0]} castShadow><coneGeometry args={[0.32, 0.35, 4]} /><Mat color={C.bone} /></mesh></group>;
    case "rubble": return <><mesh position={[-0.35, 0.28, 0]} castShadow><dodecahedronGeometry args={[0.42, 0]} /><Mat color="#676c6e" /></mesh><mesh position={[0.3, 0.2, 0.15]} castShadow><dodecahedronGeometry args={[0.34, 0]} /><Mat color={C.stone2} /></mesh></>;
    case "pipe": return <mesh position={[0, 0.45, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.14, 0.14, 2.1, 8]} /><Mat color={C.metal} /></mesh>;
    case "vent": return <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.42, 0.5, 0.5, 10]} /><Mat color={C.metal2} /></mesh>;
    case "antenna": return <><mesh position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 2.6, 6]} /><Mat color={C.metal} /></mesh><mesh position={[0, 2.6, 0]} castShadow><sphereGeometry args={[0.14, 6, 4]} /><Mat color={C.hazard} /></mesh></>;
    case "barrier": return <mesh position={[0, 0.45, 0]} rotation-y={Math.PI / 2} castShadow><boxGeometry args={[2.2, 0.5, 0.22]} /><Mat color={C.hazard} /></mesh>;
    case "hay-bale": return <mesh position={[0, 0.5, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.5, 0.5, 0.9, 8]} /><Mat color={C.sand} /></mesh>;
    case "shed": return <group><mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.7, 1.1, 1.4]} /><Mat color={C.brick} /></mesh><mesh position={[0, 1.35, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[1.2, 0.6, 4]} /><Mat color={C.wood} /></mesh></group>;
    default: return null;
  }
}

function PropMesh({ item }: { item: EnvironmentProp }) {
  let node: ReactNode;
  switch (item.kind) {
    case "tree": node = <Tree />; break;
    case "pine": node = <Tree pine />; break;
    case "palm": node = <Palm />; break;
    case "dead-tree": node = <Tree dead />; break;
    case "rock": node = <Rock />; break;
    case "boulder": node = <Rock big />; break;
    case "cactus": node = <Cactus />; break;
    case "shrub": node = <mesh position={[0, 0.35, 0]} scale={[1.2, 0.7, 1]} castShadow><icosahedronGeometry args={[0.6, 0]} /><Mat color={C.leaf2} /></mesh>; break;
    case "crate": node = <BoxProp />; break;
    case "barrel": node = <BoxProp barrel />; break;
    case "fence": node = <Fence />; break;
    case "lamp": node = <Lamp />; break;
    case "car": node = <Car />; break;
    default: node = <Industrial kind={item.kind} />;
  }
  return <group position={item.position} rotation-y={item.rotation} scale={item.scale}>{node}</group>;
}

function LandmarkMesh({ item }: { item: EnvironmentLandmark }) {
  const common = { position: item.position, rotation: [0, item.rotation, 0] as [number, number, number], scale: item.scale };
  switch (item.kind) {
    case "windmill": return <group {...common}><mesh position={[0,1.7,0]} castShadow><coneGeometry args={[0.65,3.4,6]} /><Mat color={C.stone}/></mesh><mesh position={[0,3.25,0.4]} rotation-x={Math.PI/2} castShadow><cylinderGeometry args={[0.22,0.22,0.18,8]}/><Mat color={C.metal2}/></mesh>{[0,1.57,3.14,4.71].map(r=><mesh key={r} position={[Math.sin(r)*0.85,3.25+Math.cos(r)*0.85,0.4]} rotation-z={r} castShadow><boxGeometry args={[0.12,1.6,0.08]}/><Mat color={C.wood2}/></mesh>)}</group>;
    case "giant-tree":
    case "redwood-giant": return <group {...common}><mesh position={[0,3.2,0]} castShadow><cylinderGeometry args={[0.55,0.85,6.4,8]}/><Mat color={C.wood}/></mesh><mesh position={[0,6.1,0]} castShadow><coneGeometry args={[2.6,4.4,7]}/><Mat color={C.leaf}/></mesh><mesh position={[0,7.6,0]} castShadow><coneGeometry args={[1.8,3.1,7]}/><Mat color={C.leaf2}/></mesh></group>;
    case "market-arcade": return <group {...common}>{[-2.1,0,2.1].map(x=><mesh key={x} position={[x,1.4,0]} castShadow><boxGeometry args={[0.45,2.8,0.45]}/><Mat color={C.stone}/></mesh>)}<mesh position={[0,2.95,0]} castShadow><boxGeometry args={[5,0.38,1.35]}/><Mat color={C.wood2}/></mesh></group>;
    case "rail-signal": return <group {...common}><mesh position={[0,1.8,0]} castShadow><cylinderGeometry args={[0.09,0.12,3.6,6]}/><Mat color={C.metal2}/></mesh><mesh position={[0,3.2,0]} castShadow><boxGeometry args={[0.7,1.1,0.24]}/><Mat color={C.metal}/></mesh><mesh position={[0,3.3,-0.15]} castShadow><sphereGeometry args={[0.1,6,4]}/><Mat color={C.hazard}/></mesh></group>;
    case "water-tower": return <group {...common}>{[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}-${z}`} position={[x*0.9,1.5,z*0.9]} castShadow><boxGeometry args={[0.18,3,0.18]}/><Mat color={C.metal2}/></mesh>))}<mesh position={[0,3.15,0]} castShadow><cylinderGeometry args={[1.35,1.05,1.2,10]}/><Mat color={C.metal}/></mesh><mesh position={[0,3.82,0]} castShadow><coneGeometry args={[0.98,0.55,10]}/><Mat color={C.metal2}/></mesh></group>;
    case "jungle-gate": return <group {...common}>{[-1.5,1.5].map(x=><mesh key={x} position={[x,1.5,0]} castShadow><boxGeometry args={[0.6,3,0.7]}/><Mat color={C.stone2}/></mesh>)}<mesh position={[0,3,0]} castShadow><boxGeometry args={[3.5,0.55,0.8]}/><Mat color={C.stone}/></mesh></group>;
    case "mangrove-shrine": return <group {...common}><mesh position={[0,0.4,0]} castShadow><cylinderGeometry args={[1.2,1.35,0.8,8]}/><Mat color={C.stone}/></mesh><mesh position={[0,1.45,0]} castShadow><boxGeometry args={[1.7,1.2,1.2]}/><Mat color={C.wood}/></mesh><mesh position={[0,2.2,0]} rotation-y={Math.PI/4} castShadow><coneGeometry args={[1.4,0.85,4]}/><Mat color={C.leaf}/></mesh></group>;
    case "frozen-lab": return <group {...common}><mesh position={[0,1.25,0]} castShadow><boxGeometry args={[3.6,2.5,2.6]}/><Mat color={C.snow}/></mesh><mesh position={[0,2.65,0]} castShadow><boxGeometry args={[2.4,0.35,2.1]}/><Mat color={C.ice}/></mesh></group>;
    case "ice-cave": return <group {...common}>{[-1.5,0,1.5].map((x,i)=><mesh key={x} position={[x,1.8+(i===1?0.8:0),0]} castShadow><coneGeometry args={[1.5,3.8+(i===1?1:0),6]}/><Mat color={C.ice2}/></mesh>)}</group>;
    case "lighthouse": return <group {...common}><mesh position={[0,2.2,0]} castShadow><cylinderGeometry args={[0.7,1.05,4.4,8]}/><Mat color={C.snow}/></mesh><mesh position={[0,4.65,0]} castShadow><cylinderGeometry args={[0.78,0.82,0.5,8]}/><Mat color={C.hazard}/></mesh><mesh position={[0,5.15,0]} castShadow><coneGeometry args={[0.9,0.55,8]}/><Mat color={C.metal2}/></mesh></group>;
    case "oasis": return <group {...common}><mesh position={[0,0.08,0]}><cylinderGeometry args={[2,2,0.12,16]}/><meshStandardMaterial color={C.water} transparent opacity={0.8}/></mesh><group position={[-1.2,0,0]}><Palm/></group><group position={[1.3,0,0.2]} scale={0.8}><Palm/></group></group>;
    case "canyon-bridge": return <group {...common}><mesh position={[0,1.2,0]} castShadow><boxGeometry args={[5.5,0.35,1.6]}/><Mat color={C.wood2}/></mesh>{[-2.2,2.2].map(x=><mesh key={x} position={[x,0.55,0]} castShadow><boxGeometry args={[0.3,1.5,1.1]}/><Mat color={C.stone2}/></mesh>)}</group>;
    case "mine-headframe": return <group {...common}>{[-1.4,1.4].map(x=><mesh key={x} position={[x,1.8,0]} rotation-z={x*0.16} castShadow><boxGeometry args={[0.3,3.6,0.3]}/><Mat color={C.wood}/></mesh>)}<mesh position={[0,3.1,0]} castShadow><boxGeometry args={[3.5,0.32,0.35]}/><Mat color={C.wood2}/></mesh></group>;
    case "radar-dish": return <group {...common}><mesh position={[0,1.4,0]} castShadow><cylinderGeometry args={[0.12,0.18,2.8,6]}/><Mat color={C.metal2}/></mesh><mesh position={[0,2.75,0.18]} scale={[1,0.65,0.35]} rotation-x={-0.55} castShadow><sphereGeometry args={[1,10,6]}/><Mat color={C.metal}/></mesh></group>;
    case "skyscraper": return <group {...common}><mesh position={[0,4,0]} castShadow><boxGeometry args={[3,8,2.4]}/><Mat color={C.stone2}/></mesh><mesh position={[0,7.1,0]} castShadow><boxGeometry args={[2.2,0.25,1.8]}/><Mat color={C.neon}/></mesh></group>;
    case "foundry-furnace": return <group {...common}><mesh position={[0,2.1,0]} castShadow><cylinderGeometry args={[1.2,1.5,4.2,10]}/><Mat color={C.brick}/></mesh><mesh position={[0,4.25,0]} castShadow><cylinderGeometry args={[0.85,0.9,0.45,10]}/><Mat color={C.lava}/></mesh><mesh position={[0,4.75,0]} castShadow><cylinderGeometry args={[0.34,0.45,0.8,8]}/><Mat color={C.lava2}/></mesh></group>;
    case "cathedral": return <group {...common}><mesh position={[0,2.2,0]} castShadow><boxGeometry args={[3.6,4.4,2.4]}/><Mat color={C.stone2}/></mesh>{[-1.4,1.4].map(x=><mesh key={x} position={[x,4.2,0]} castShadow><coneGeometry args={[0.7,3.8,5]}/><Mat color={C.stone}/></mesh>)}</group>;
    case "volcano-crater": return <group {...common}><mesh position={[0,2.2,0]} castShadow><coneGeometry args={[2.8,4.4,8]}/><Mat color={C.sand}/></mesh><mesh position={[0,4.35,0]} castShadow><cylinderGeometry args={[1.25,1.45,0.25,10]}/><Mat color={C.dark}/></mesh><mesh position={[0,4.55,0]} castShadow><cylinderGeometry args={[0.8,0.8,0.3,10]}/><Mat color={C.lava2}/></mesh></group>;
    case "reactor": return <group {...common}><mesh position={[0,1.5,0]} castShadow><cylinderGeometry args={[1.5,1.7,3,12]}/><Mat color={C.stone2}/></mesh><mesh position={[0,3.1,0]} castShadow><cylinderGeometry args={[1.25,1.35,0.38,12]}/><Mat color={C.hazard}/></mesh><mesh position={[0,3.6,0]} castShadow><cylinderGeometry args={[0.8,0.85,0.7,10]}/><Mat color={C.neon}/></mesh></group>;
  }
}

export function StageEnvironment({ environmentId }: { environmentId: StageEnvironmentId }) {
  const environment = getStageEnvironment(environmentId);
  return (
    <group>
      {environment.props.map((item, index) => <PropMesh key={`${item.kind}-${index}`} item={item} />)}
      <LandmarkMesh item={environment.landmark} />
    </group>
  );
}
