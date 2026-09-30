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

const MILESTONES = {
  blood: [
    { id: "blood-100", target: 100, title: "First Harvest", reward: { label: "100 credits", coins: 100 } },
    { id: "blood-300", target: 300, title: "Red Tide", reward: { label: "220 credits", coins: 220 } },
    { id: "blood-700", target: 700, title: "Hot Streak", reward: { label: "6 gems", gems: 6 } },
    { id: "blood-1200", target: 1200, title: "Pressure Cooker", reward: { label: "350 XP", xp: 350 } },
    { id: "blood-2000", target: 2000, title: "Nightmare Block", reward: { label: "10 gems", gems: 10 } },
    { id: "blood-3500", target: 3500, title: "Full Sweep", reward: { label: "550 credits", coins: 550 } },
    { id: "blood-5000", target: 5000, title: "Blood Moon Veteran", reward: { label: "20 gems", gems: 20 } },
  ],
  frost: [
    { id: "frost-100", target: 100, title: "First Frost", reward: { label: "100 credits", coins: 100 } },
    { id: "frost-300", target: 300, title: "Cold Front", reward: { label: "220 credits", coins: 220 } },
    { id: "frost-700", target: 700, title: "Deep Freeze", reward: { label: "6 gems", gems: 6 } },
    { id: "frost-1200", target: 1200, title: "Whiteout", reward: { label: "350 XP", xp: 350 } },
    { id: "frost-2000", target: 2000, title: "Icebreaker", reward: { label: "10 gems", gems: 10 } },
    { id: "frost-3500", target: 3500, title: "Zero Hour", reward: { label: "550 credits", coins: 550 } },
    { id: "frost-5000", target: 5000, title: "Absolute Winter", reward: { label: "20 gems", gems: 20 } },
  ],
  neon: [
    { id: "neon-100", target: 100, title: "Lights Out", reward: { label: "100 credits", coins: 100 } },
    { id: "neon-300", target: 300, title: "Power Surge", reward: { label: "220 credits", coins: 220 } },
    { id: "neon-700", target: 700, title: "Blackout Runner", reward: { label: "6 gems", gems: 6 } },
    { id: "neon-1200", target: 1200, title: "Grid Collapse", reward: { label: "350 XP", xp: 350 } },
    { id: "neon-2000", target: 2000, title: "Aftershock", reward: { label: "10 gems", gems: 10 } },
    { id: "neon-3500", target: 3500, title: "City Eater", reward: { label: "550 credits", coins: 550 } },
    { id: "neon-5000", target: 5000, title: "Neon Survivor", reward: { label: "20 gems", gems: 20 } },
  ],
  scrap: [
    { id: "scrap-100", target: 100, title: "Scavenger", reward: { label: "100 credits", coins: 100 } },
    { id: "scrap-300", target: 300, title: "Junkyard Rhythm", reward: { label: "220 credits", coins: 220 } },
    { id: "scrap-700", target: 700, title: "Salvage Crew", reward: { label: "6 gems", gems: 6 } },
    { id: "scrap-1200", target: 1200, title: "Iron Harvest", reward: { label: "350 XP", xp: 350 } },
    { id: "scrap-2000", target: 2000, title: "Heavy Haul", reward: { label: "10 gems", gems: 10 } },
    { id: "scrap-3500", target: 3500, title: "City Salvager", reward: { label: "550 credits", coins: 550 } },
    { id: "scrap-5000", target: 5000, title: "Last Contractor", reward: { label: "20 gems", gems: 20 } },
  ],
} as const;

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "blood-harvest",
    name: "Blood Harvest",
    tagline: "A kill-focused event track with steady rewards for showing up and finishing the whole run.",
    color: "#e24b4b",
    durationDays: 28,
    milestones: MILESTONES.blood,
  },
  {
    id: "frozen-night",
    name: "Frozen Night",
    tagline: "Cold steel, hot streaks. Keep defending to unlock a full ladder of event rewards.",
    color: "#79c7e3",
    durationDays: 28,
    milestones: MILESTONES.frost,
  },
  {
    id: "neon-blackout",
    name: "Neon Blackout",
    tagline: "The city grid is failing. Keep the kill count climbing before the lights come back.",
    color: "#63e6c3",
    durationDays: 28,
    milestones: MILESTONES.neon,
  },
  {
    id: "scrapfall",
    name: "Scrapfall",
    tagline: "Every defense leaves salvage behind. Push deeper to turn the ruins into a reward track.",
    color: "#e9b44c",
    durationDays: 28,
    milestones: MILESTONES.scrap,
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
