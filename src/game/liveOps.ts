export type EventReward = {
  label: string;
  coins?: number;
  gems?: number;
  xp?: number;
};

export type SeasonalMilestone = {
  id: string;
  target: number;
  title: string;
  reward: EventReward;
};

export type SeasonalEvent = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  durationDays: number;
  milestones: SeasonalMilestone[];
};

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "blood-harvest",
    name: "Blood Harvest",
    tagline: "The streets are crawling. Stack kills to unlock event rewards.",
    color: "#e24b4b",
    durationDays: 28,
    milestones: [
      { id: "blood-250", target: 250, title: "First Harvest", reward: { label: "250 credits", coins: 250 } },
      { id: "blood-1000", target: 1000, title: "Red Tide", reward: { label: "12 gems", gems: 12 } },
      { id: "blood-2500", target: 2500, title: "Nightmare Block", reward: { label: "500 XP", xp: 500 } },
    ],
  },
  {
    id: "frozen-night",
    name: "Frozen Night",
    tagline: "Cold steel, hot streaks. Keep defending to earn event rewards.",
    color: "#79c7e3",
    durationDays: 28,
    milestones: [
      { id: "frost-250", target: 250, title: "First Frost", reward: { label: "250 credits", coins: 250 } },
      { id: "frost-1000", target: 1000, title: "Deep Freeze", reward: { label: "12 gems", gems: 12 } },
      { id: "frost-2500", target: 2500, title: "Absolute Winter", reward: { label: "500 XP", xp: 500 } },
    ],
  },
];

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
