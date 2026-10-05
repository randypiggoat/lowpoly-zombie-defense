export type EventReward = {
  label: string;
  coins?: number;
  gems?: number;
  xp?: number;
};

export type SeasonalActivity =
  | "kills"
  | "waves"
  | "runs"
  | "tower-upgrades"
  | "special-kills";

export type SeasonalMilestone = {
  id: string;
  target: number;
  title: string;
  description: string;
  activity: SeasonalActivity;
  reward: EventReward;
  prerequisite?: string;
  cosmeticId?: string;
};

export type SeasonalEvent = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  durationDays: number;
  milestones: SeasonalMilestone[];
};

type MilestoneSlot = Omit<SeasonalMilestone, "id" | "prerequisite">;

/**
 * Milestone ids and prerequisite order are stable across events (saved claims depend on them);
 * each event supplies its own activities, targets and rewards so the two events play differently.
 */
function createMilestones(prefix: string, slots: readonly MilestoneSlot[]): SeasonalMilestone[] {
  const suffixes = ["250", "1000", "2500", "runs-3", "special-40", "wave-12", "cosmetic"];
  return slots.map((slot, index) => ({
    ...slot,
    id: `${prefix}-${suffixes[index]}`,
    ...(index > 0 && { prerequisite: `${prefix}-${suffixes[index - 1]}` }),
  }));
}

/** Blood Harvest rewards swarm control: kills, special targets and deep waves. */
const BLOOD_SLOTS: readonly MilestoneSlot[] = [
  { target: 300, title: "First Harvest", description: "Defeat 300 infected.", activity: "kills", reward: { label: "250 credits", coins: 250 } },
  { target: 6, title: "Hold the Block", description: "Reach wave 6 in any run.", activity: "waves", reward: { label: "150 XP", xp: 150 } },
  { target: 30, title: "Priority Targets", description: "Defeat 30 special enemies.", activity: "special-kills", reward: { label: "12 gems", gems: 12 } },
  { target: 3, title: "Keep the Line", description: "Finish 3 runs.", activity: "runs", reward: { label: "300 credits", coins: 300 } },
  { target: 5, title: "Sharpen the Arsenal", description: "Upgrade towers 5 times.", activity: "tower-upgrades", reward: { label: "250 XP", xp: 250 } },
  { target: 12, title: "Red Tide", description: "Reach wave 12 in any run.", activity: "waves", reward: { label: "18 gems", gems: 18 } },
  { target: 5, title: "Event Vanguard", description: "Finish 5 runs to claim the event-exclusive tower finish.", activity: "runs", reward: { label: "Vanguard Freezer finish" }, cosmeticId: "seasonal-vanguard" },
];

/** Frozen Night rewards build-crafting: upgrades first, fewer kills, longer survival. */
const FROST_SLOTS: readonly MilestoneSlot[] = [
  { target: 4, title: "Cold Open", description: "Upgrade towers 4 times.", activity: "tower-upgrades", reward: { label: "250 credits", coins: 250 } },
  { target: 8, title: "Deep Freeze", description: "Reach wave 8 in any run.", activity: "waves", reward: { label: "150 XP", xp: 150 } },
  { target: 200, title: "Cold Steel", description: "Defeat 200 infected.", activity: "kills", reward: { label: "12 gems", gems: 12 } },
  { target: 4, title: "Long Watch", description: "Finish 4 runs.", activity: "runs", reward: { label: "300 credits", coins: 300 } },
  { target: 20, title: "Frostbitten Elites", description: "Defeat 20 special enemies.", activity: "special-kills", reward: { label: "250 XP", xp: 250 } },
  { target: 15, title: "The Long Night", description: "Reach wave 15 in any run.", activity: "waves", reward: { label: "18 gems", gems: 18 } },
  { target: 8, title: "Night Vanguard", description: "Upgrade towers 8 times to claim the event-exclusive Rifleman finish.", activity: "tower-upgrades", reward: { label: "Frostbound Rifleman finish" }, cosmeticId: "seasonal-frostbound" },
];

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "blood-harvest",
    name: "Blood Harvest",
    tagline: "The streets are crawling. Hold the block and earn your place in the harvest.",
    color: "#e24b4b",
    durationDays: 28,
    milestones: createMilestones("blood", BLOOD_SLOTS),
  },
  {
    id: "frozen-night",
    name: "Frozen Night",
    tagline: "Cold steel, hot streaks. Keep defending to earn event rewards.",
    color: "#79c7e3",
    durationDays: 28,
    milestones: createMilestones("frost", FROST_SLOTS),
  },
];

export function getSeasonalMilestoneProgress(
  milestone: SeasonalMilestone,
  killProgress: number,
  activityProgress: Partial<Record<SeasonalActivity, number>>,
) {
  const progress =
    milestone.activity === "kills"
      ? killProgress
      : activityProgress[milestone.activity] ?? 0;
  return Math.min(milestone.target, Math.max(0, progress));
}

export function getSeasonalEvent(date = new Date()): SeasonalEvent {
  const start = new Date(2026, 0, 1);
  const days = Math.max(0, Math.floor((date.getTime() - start.getTime()) / 86400000));
  return SEASONAL_EVENTS[Math.floor(days / 28) % SEASONAL_EVENTS.length]!;
}

export function getSeasonalEventCycleKey(date = new Date()) {
  const start = new Date(2026, 0, 1);
  const days = Math.max(0, Math.floor((date.getTime() - start.getTime()) / 86400000));
  const cycle = Math.floor(days / 28);
  return `E${cycle}`;
}

export function getSeasonalEventEnd(date = new Date()) {
  const start = new Date(2026, 0, 1);
  const days = Math.max(0, Math.floor((date.getTime() - start.getTime()) / 86400000));
  const cycleStartDays = Math.floor(days / 28) * 28 + 28;
  return new Date(start.getTime() + cycleStartDays * 86400000);
}
