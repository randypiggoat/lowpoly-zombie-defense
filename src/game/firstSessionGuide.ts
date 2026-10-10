export type FirstSessionTip = {
  title: string;
  body: string;
};

export type FirstSessionContext = {
  pathUpgradeCount?: number;
  specialEnemyLabel?: string | null;
  progressionTarget?: { label: string; detail: string } | null;
};

export function getFirstSessionTip(
  gamesPlayed: number,
  wave: number,
  towerCount: number,
  upgradedTowerCount: number,
  context: FirstSessionContext = {},
) {
  if (gamesPlayed > 0) return null;

  if (towerCount === 0) {
    return {
      title: "BUILD YOUR FIRST TOWER",
      body: "Tap open ground, choose a tower, and place it where its range covers the lane.",
    } satisfies FirstSessionTip;
  }

  if (upgradedTowerCount === 0) {
    return {
      title: "UPGRADE YOUR DEFENSE",
      body: "Tap one of your towers to inspect it, then choose a path upgrade with SCRAP.",
    } satisfies FirstSessionTip;
  }

  if (context.pathUpgradeCount === 1) {
    return {
      title: "TOWER PATHS",
      body: "Each path has a different focus. Compare both before spending SCRAP on the next tier.",
    } satisfies FirstSessionTip;
  }

  if (context.specialEnemyLabel && wave > 0) {
    const body =
      context.specialEnemyLabel === "BRUTE"
        ? "Brutes hit the base hard. Keep one in range and focus it before it breaks through."
        : "This special threat has its own behavior. Watch its health bar and match a tower to the threat.";
    return {
      title: `SPOT THE ${context.specialEnemyLabel}`,
      body,
    } satisfies FirstSessionTip;
  }

  if (context.progressionTarget) {
    return {
      title: "NEXT PROGRESSION TARGET",
      body: `${context.progressionTarget.label} · ${context.progressionTarget.detail}`,
    } satisfies FirstSessionTip;
  }

  return {
    title: "YOU'RE READY",
    body: "Keep the chain alive, save your SCRAP, and watch for the next threat.",
  } satisfies FirstSessionTip;
}
