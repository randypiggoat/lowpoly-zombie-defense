import type { StageDefinition, StageEnemyKind } from "./navigation";
import { enemyThreatLabel } from "./enemyPresentation";

export type WaveThreatPreview = {
  boss: boolean;
  threats: string[];
  enemyKinds: StageEnemyKind[];
};

function baseWeight(stage: StageDefinition, kind: StageEnemyKind) {
  const weights = stage.enemyPool.weights;
  switch (kind) {
    case 0: return weights?.walker ?? 1;
    case 1: return weights?.runner ?? 0.65;
    case 2: return weights?.brute ?? 0.45;
    case 3: return weights?.splitter ?? 0.3;
    case 4: return weights?.bomber ?? 0.22;
    case 5: return weights?.guardian ?? 0.24;
    case 6: return weights?.healer ?? 0.18;
    case 7: return weights?.swarm ?? 0.3;
  }
}

export function getWaveThreatPreview(
  stage: StageDefinition,
  wave: number,
): WaveThreatPreview {
  const normalizedWave = Math.max(1, Math.floor(wave));
  const isBossWave =
    (stage.boss.enabled && stage.boss.wave === normalizedWave) ||
    normalizedWave >= 10 && normalizedWave % 10 === 0 && stage.id === 999;

  const ranked = stage.enemyPool.normalKinds
    .map((kind) => {
      const weight = baseWeight(stage, kind);
      const progression = kind === 0
        ? Math.max(0.35, 1 - normalizedWave * 0.03)
        : kind === 1
          ? 0.5 + normalizedWave * 0.04
          : 0.35 + normalizedWave * 0.07;
      return { kind, score: weight * progression };
    })
    .sort((a, b) => b.score - a.score || a.kind - b.kind)
    .slice(0, 3);

  const rankedThreats = ranked.map(({ kind }) => enemyThreatLabel(kind));
  const bossThreat =
    isBossWave && stage.boss.kind !== null
      ? [enemyThreatLabel(stage.boss.kind)]
      : [];

  const threatKinds = [
    ...new Set([
      ...(isBossWave && stage.boss.kind !== null ? [stage.boss.kind] : []),
      ...ranked.map(({ kind }) => kind),
    ]),
  ].slice(0, 3);

  return {
    boss: isBossWave,
    threats: [...new Set([...bossThreat, ...rankedThreats])].slice(0, 3),
    enemyKinds: threatKinds,
  };
}
