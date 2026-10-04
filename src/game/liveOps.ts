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

function createMilestones(prefix: string): SeasonalMilestone[] {
  const first = `${prefix}-250`;
  const second = `${prefix}-1000`;
  const third = `${prefix}-2500`;
  const fourth = `${prefix}-runs-3`;
  const fifth = `${prefix}-special-40`;
  const sixth = `${prefix}-wave-12`;
  return [
    {
      id: first,
      target: 250,
      title: "First Harvest",
      description: "Defeat 250 infected.",
      activity: "kills",
      reward: { label: "250 credits", coins: 250 },
    },
    {
      id: second,
      target: 6,
      title: "Hold the Block",
      description: "Reach wave 6 in any run.",
      activity: "waves",
      prerequisite: first,
      reward: { label: "150 XP", xp: 150 },
    },
    {
      id: third,
      target: 3,
      title: "Tune the Arsenal",
      description: "Upgrade towers 3 times.",
      activity: "tower-upgrades",
      prerequisite: second,
      reward: { label: "12 gems", gems: 12 },
    },
    {
      id: fourth,
      target: 3,
      title: "Keep the Line",
      description: "Finish 3 runs.",
      activity: "runs",
      prerequisite: third,
      reward: { label: "300 credits", coins: 300 },
    },
    {
      id: fifth,
      target: 40,
      title: "Priority Targets",
      description: "Defeat 40 special enemies.",
      activity: "special-kills",
      prerequisite: fourth,
      reward: { label: "250 XP", xp: 250 },
    },
    {
      id: sixth,
      target: 12,
      title: "Red Tide",
      description: "Reach wave 12 in any run.",
      activity: "waves",
      prerequisite: fifth,
      reward: { label: "18 gems", gems: 18 },
    },
    {
      id: `${prefix}-cosmetic`,
      target: 5,
      title: "Event Vanguard",
      description: "Finish 5 runs to claim the event-exclusive tower finish.",
      activity: "runs",
      prerequisite: sixth,
      reward: { label: "Event-exclusive tower finish" },
      cosmeticId: "seasonal-vanguard",
    },
  ];
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "blood-harvest",
    name: "Blood Harvest",
    tagline: "The streets are crawling. Hold the block and earn your place in the harvest.",
    color: "#e24b4b",
    durationDays: 28,
    milestones: createMilestones("blood"),
  },
  {
    id: "frozen-night",
    name: "Frozen Night",
    tagline: "Cold steel, hot streaks. Keep defending to earn event rewards.",
    color: "#79c7e3",
    durationDays: 28,
    milestones: createMilestones("frost"),
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
