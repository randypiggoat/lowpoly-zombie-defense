export type CombatFeedbackInput = {
  killed: boolean;
  crit: boolean;
  exploded: boolean;
  killStreak: number;
};

export type CombatFeedback = {
  shake: number;
  hitSound: "hit" | "bigHit" | "death" | "gib";
};

export function getCombatFeedback(input: CombatFeedbackInput): CombatFeedback {
  if (input.exploded) return { shake: 0.95, hitSound: "gib" };
  if (input.killed && input.killStreak >= 5) return { shake: 0.7, hitSound: "bigHit" };
  if (input.killed) return { shake: input.crit ? 0.58 : 0.4, hitSound: "death" };
  if (input.crit) return { shake: 0.18, hitSound: "bigHit" };
  return { shake: 0.04, hitSound: "hit" };
}
