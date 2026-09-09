export type PrimaryScreen =
  | "main-menu"
  | "stage-select"
  | "gameplay"
  | "results"
  | "towers"
  | "missions"
  | "achievements"
  | "shop"
  | "settings";

export type StageDefinition = {
  id: number;
  name: string;
  difficulty: "Easy" | "Normal" | "Hard";
  requiredText: string | null;
  locked: boolean;
  bestWave: number;
  completed: boolean;
  stars: number;
};

export const STAGE_DEFS: StageDefinition[] = [
  {
    id: 1,
    name: "Village Gate",
    difficulty: "Easy",
    requiredText: null,
    locked: false,
    bestWave: 0,
    completed: false,
    stars: 0,
  },
  {
    id: 2,
    name: "Quarry Edge",
    difficulty: "Normal",
    requiredText: "Complete Stage 1",
    locked: true,
    bestWave: 0,
    completed: false,
    stars: 0,
  },
  {
    id: 3,
    name: "Pine Watch",
    difficulty: "Normal",
    requiredText: "Complete Stage 1",
    locked: true,
    bestWave: 0,
    completed: false,
    stars: 0,
  },
  {
    id: 4,
    name: "Ashen Bridge",
    difficulty: "Hard",
    requiredText: "Reach Player Level 5",
    locked: true,
    bestWave: 0,
    completed: false,
    stars: 0,
  },
  {
    id: 5,
    name: "Last Bastion",
    difficulty: "Hard",
    requiredText: "Reach Player Level 8",
    locked: true,
    bestWave: 0,
    completed: false,
    stars: 0,
  },
];
