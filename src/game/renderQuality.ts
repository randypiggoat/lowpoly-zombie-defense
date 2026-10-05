export type SceneRenderQuality = {
  shadowMapSize: 512 | 768 | 1024;
  sceneryCount: number;
};

export function getSceneRenderQuality(viewportWidth: number): SceneRenderQuality {
  if (viewportWidth < 700) {
    return { shadowMapSize: 512, sceneryCount: 22 };
  }

  if (viewportWidth < 1100) {
    return { shadowMapSize: 768, sceneryCount: 30 };
  }

  return { shadowMapSize: 768, sceneryCount: 38 };
}
