import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type KenneyModelProps = {
  src: string;
  sourceHeight: number;
  width: number;
  depth: number;
  height: number;
  sourceWidth?: number;
  sourceDepth?: number;
  sourceMinY?: number;
};

/**
 * Renders one static, self-contained Kenney GLB.
 *
 * Source width, depth, height, and minimum Y are measured from each GLB.
 * Explicit source bounds keep models correctly proportioned and place their
 * ground contact at world Y=0, including non-unit nature assets.
 */
export function KenneyModel({
  src,
  sourceHeight,
  width,
  depth,
  height,
  sourceWidth = 2,
  sourceDepth = 2,
  sourceMinY = -1,
}: KenneyModelProps) {
  const { scene } = useGLTF(src);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;
  const scaleZ = depth / sourceDepth;
  const baseOffsetY = -sourceMinY * scaleY;

  return (
    <group position={[0, baseOffsetY, 0]} scale={[scaleX, scaleY, scaleZ]}>
      <primitive object={model} dispose={null} />
    </group>
  );
}
