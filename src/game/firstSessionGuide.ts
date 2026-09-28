export type FirstSessionTip = {
  title: string;
  body: string;
};

export function getFirstSessionTip(
  gamesPlayed: number,
  wave: number,
  towerCount: number,
  upgradedTowerCount: number,
) {
  if (gamesPlayed > 0 || wave > 2) return null;

  if (towerCount === 0) {
    return {
      title: "BUILD YOUR FIRST TOWER",
      body: "Tap a glowing pad, then choose a tower to start the defense.",
    } satisfies FirstSessionTip;
  }

  if (upgradedTowerCount === 0) {
    return {
      title: "UPGRADE YOUR DEFENSE",
      body: "Tap one of your towers to inspect it, then buy its first upgrade.",
    } satisfies FirstSessionTip;
  }

  return {
    title: "YOU'RE READY",
    body: "Keep the chain alive, save your gold, and choose a power when the horde pauses.",
  } satisfies FirstSessionTip;
}
