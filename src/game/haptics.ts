type HapticKind = "selection" | "confirm" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 10,
  confirm: [12, 24, 16],
  error: [20, 35, 20],
};

/**
 * Best-effort mobile vibration feedback. Unsupported browsers safely do nothing.
 * Haptics are only triggered by explicit UI actions, never by the render loop.
 */
export function triggerHaptic(kind: HapticKind) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Optional haptics must never block an otherwise valid interaction.
  }
}
