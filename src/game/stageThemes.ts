export type StageTheme = {
  id: number;
  name: string;
  sky: string;
  fog: string;
  ground: string;
  groundAlt: string;
  path: string;
  pathEdge: string;
  marker: string;
  hemiSky: string;
  hemiGround: string;
  light: string;
  lightIntensity: number;
  night: boolean;
};

const THEMES: Record<number, StageTheme> = {
  1: {
    id: 1,
    name: "Suburbs",
    sky: "#8fc4d8",
    fog: "#8fc4d8",
    ground: "#5e8a52",
    groundAlt: "#547e4b",
    path: "#a58a63",
    pathEdge: "#756044",
    marker: "#e9d39a",
    hemiSky: "#bfe3f2",
    hemiGround: "#5e8a52",
    light: "#fff3dc",
    lightIntensity: 1.5,
    night: false,
  },
  2: {
    id: 2,
    name: "Gas Station",
    sky: "#d89b78",
    fog: "#b77968",
    ground: "#5b714f",
    groundAlt: "#506445",
    path: "#8e7b66",
    pathEdge: "#574b40",
    marker: "#f2cb6a",
    hemiSky: "#f2c09c",
    hemiGround: "#475a42",
    light: "#ffe2b5",
    lightIntensity: 1.35,
    night: false,
  },
  3: {
    id: 3,
    name: "Shopping Center",
    sky: "#a5b8bf",
    fog: "#879aa2",
    ground: "#53675d",
    groundAlt: "#4a5a53",
    path: "#8a8c8a",
    pathEdge: "#51565a",
    marker: "#efe4b0",
    hemiSky: "#d8e3e6",
    hemiGround: "#4a5a53",
    light: "#eef5f2",
    lightIntensity: 1.25,
    night: false,
  },
  4: {
    id: 4,
    name: "Police Station",
    sky: "#243348",
    fog: "#32445a",
    ground: "#35453e",
    groundAlt: "#2e3b35",
    path: "#4d5056",
    pathEdge: "#20242b",
    marker: "#d8d1a6",
    hemiSky: "#51677e",
    hemiGround: "#29322d",
    light: "#c7d9ff",
    lightIntensity: 1.05,
    night: true,
  },
  5: {
    id: 5,
    name: "Highway",
    sky: "#b56d59",
    fog: "#8c5b56",
    ground: "#4e5b48",
    groundAlt: "#465141",
    path: "#626568",
    pathEdge: "#36393d",
    marker: "#f2d77a",
    hemiSky: "#efb68c",
    hemiGround: "#3d4838",
    light: "#ffe1bd",
    lightIntensity: 1.3,
    night: false,
  },
  999: {
    id: 999,
    name: "Endless Siege",
    sky: "#321f3f",
    fog: "#4a3150",
    ground: "#433f45",
    groundAlt: "#37343a",
    path: "#67616b",
    pathEdge: "#2d2a30",
    marker: "#e6bb76",
    hemiSky: "#6f5473",
    hemiGround: "#2e3030",
    light: "#f0d7c0",
    lightIntensity: 1.15,
    night: true,
  },
};

export function getStageTheme(stageId: number, endlessMode = false): StageTheme {
  if (endlessMode) return THEMES[999]!;
  return THEMES[stageId] ?? THEMES[1]!;
}
