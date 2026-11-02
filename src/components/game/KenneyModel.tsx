import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type KenneyModelProps = {
  src: string;
  sourceHeight: number;
  width: number;
  depth: number;
  height: number;
};

/**
 * Renders one static, self-contained Kenney GLB.
 *
 * The selected source meshes have a centered X/Z footprint from -1 to 1 and
 * their ground contact at local Y=-1. The measured source height is supplied
 * explicitly so scaling keeps the model's base planted at world Y=0.
 */
export function KenneyModel({ src, sourceHeight, width, depth, height }: KenneyModelProps) {
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

  const verticalScale = height / sourceHeight;

  return (
    <group position={[0, verticalScale, 0]} scale={[width / 2, verticalScale, depth / 2]}>
      <primitive object={model} dispose={null} />
    </group>
  );
}
