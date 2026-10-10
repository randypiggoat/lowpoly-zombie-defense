export type EnemyCounterSource = {
  spawnQueue: number;
  zombies: readonly { dead: boolean }[];
};

/** Includes enemies still queued to spawn and living enemies already in the lane. */
export function getEnemiesRemaining(state: EnemyCounterSource) {
  const queued = Math.max(0, Math.floor(state.spawnQueue));
  let living = 0;
  for (const zombie of state.zombies) {
    if (!zombie.dead) living += 1;
  }
  return queued + living;
}

export type RoundProgress = {
  currentRound: number;
  maximumRounds: number;
  roundsRemaining: number;
  progressPercent: number;
};

/** Derives level progress from the authoritative wave state, with endless sectors looping every ten waves. */
export function getRoundProgress(wave: number, waveTarget: number, endlessMode = false): RoundProgress {
  const currentWave = Math.max(0, Math.floor(wave));
  const maximumRounds = Math.max(1, Math.floor(waveTarget));
  return {
    currentRound: Math.max(1, currentWave),
    maximumRounds,
    roundsRemaining: Math.max(0, maximumRounds - currentWave),
    progressPercent: endlessMode
      ? currentWave > 0
        ? (((currentWave - 1) % 10) + 1) * 10
        : 0
      : Math.min(100, Math.max(0, (currentWave / maximumRounds) * 100)),
  };
}
