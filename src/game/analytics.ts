export type AnalyticsEventName =
  | "run_started"
  | "run_finished"
  | "menu_quick_play"
  | "simulation_speed_changed"
  | "daily_rewarded_bonus_claimed"
  | "tower_built"
  | "tower_upgraded"
  | "kill_streak_milestone"
  | "perfect_wave"
  | "modifier_chosen"
  | "modifier_rerolled"
  | "daily_mission_claimed"
  | "rewarded_ad_requested"
  | "rewarded_ad_completed"
  | "rewarded_ad_failed"
  | "interstitial_requested"
  | "interstitial_shown"
  | "interstitial_failed"
  | "iap_purchase";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  at: string;
  payload?: Record<string, string | number | boolean>;
};

const KEY = "rotwood.analytics.v1";
const MAX_EVENTS = 500;

function read(): AnalyticsEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.slice(-MAX_EVENTS) : [];
  } catch {
    return [];
  }
}

let events = read();

export function track(
  name: AnalyticsEventName,
  payload?: Record<string, string | number | boolean>,
) {
  events = [...events, { name, at: new Date().toISOString(), payload }].slice(-MAX_EVENTS);
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    /* analytics remain in memory */
  }
}

export function getAnalyticsSnapshot() {
  return [...events];
}

export function clearAnalytics() {
  events = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
