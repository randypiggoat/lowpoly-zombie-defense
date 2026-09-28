export type BaseDangerLevel = "safe" | "warning" | "critical";

export function getBaseDangerLevel(baseHp: number, baseMaxHp: number): BaseDangerLevel {
  if (baseMaxHp <= 0) return "critical";
  const ratio = Math.max(0, Math.min(1, baseHp / baseMaxHp));
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "warning";
  return "safe";
}
