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
 * The selected source meshes have a centered X/Z footprint from -1 to 1 and
 * their ground contact at local Y=-1. The measured source height is supplied
 * explicitly so scaling keeps the model's base planted at world Y=0.
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
