export type KillRewardBreakdown = {
  baseGold: number;
  streakBonusGold: number;
  bossBonusGold: number;
  totalGold: number;
};

export function calculateKillReward(
  killGold: number,
  runGoldMultiplier: number,
  streakGoldMultiplier: number,
  bossGoldMultiplier: number,
): KillRewardBreakdown {
  const baseGold = Math.round(killGold * runGoldMultiplier);
  const streakTotal = Math.round(baseGold * Math.max(1, streakGoldMultiplier));
  const streakBonusGold = streakTotal - baseGold;
  const totalGold = Math.round(streakTotal * Math.max(1, bossGoldMultiplier));
  const bossBonusGold = totalGold - streakTotal;

  return {
    baseGold,
    streakBonusGold,
    bossBonusGold,
    totalGold,
  };
}
