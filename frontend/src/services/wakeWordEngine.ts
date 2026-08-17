/**
 * NEXUS-OFFLINE — Wake Word Engine Abstraction
 * =============================================
 *
 * This module provides a UNIFIED interface for wake-word detection that
 * automatically switches between two modes:
 *
 *  1. PREVIEW_SIMULATION  (default in Expo Go / web preview)
 *     - No real audio listener; UI-driven trigger only
 *     - Zero native dependencies → runs in Expo Go without crashes
 *
 *  2. NATIVE_PORCUPINE    (activated after `expo prebuild` + real key)
 *     - Uses @picovoice/porcupine-react-native under the hood
 *     - "Jarvis" is a FREE built-in Porcupine keyword (no .ppn file)
 *     - Requires EXPO_PUBLIC_PORCUPINE_ACCESS_KEY set to a real key
 *
 * ── How to switch to NATIVE_PORCUPINE (after Publish + Build): ───────────
 *   1) yarn expo install @picovoice/porcupine-react-native
 *   2) Replace EXPO_PUBLIC_PORCUPINE_ACCESS_KEY in /app/frontend/.env
 *   3) Uncomment the block marked `// [NATIVE_IMPL]` below
 *   4) Emergent's Publish flow generates a native APK/IPA — mic listener
 *      starts automatically on first launch.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type WakeWordEngineMode = "PREVIEW_SIMULATION" | "NATIVE_PORCUPINE";

export interface WakeWordEngineStatus {
  mode: WakeWordEngineMode;
  isReady: boolean;
  keyword: string;
  accessKeyStatus: "PLACEHOLDER" | "CONFIGURED";
  message: string;
}

const ACCESS_KEY = process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY || "";
const KEYWORD = (process.env.EXPO_PUBLIC_PORCUPINE_KEYWORD || "jarvis").toLowerCase();
const PLACEHOLDER = "REPLACE_WITH_YOUR_PICOVOICE_ACCESS_KEY";

const isPlaceholderKey = !ACCESS_KEY || ACCESS_KEY === PLACEHOLDER;

let listeners: Array<() => void> = [];

/**
 * Returns current engine mode + readiness. UI reads this to render the
 * "PREVIEW SIMULATION MODE" vs "PORCUPINE ACTIVE" badge.
 */
export function getEngineStatus(): WakeWordEngineStatus {
  if (isPlaceholderKey) {
    return {
      mode: "PREVIEW_SIMULATION",
      isReady: true,
      keyword: KEYWORD,
      accessKeyStatus: "PLACEHOLDER",
      message:
        "Preview Simulation — replace EXPO_PUBLIC_PORCUPINE_ACCESS_KEY in .env with a real Picovoice key to activate on-device wake-word after next native build.",
    };
  }

  // Real key configured but we still can't run Porcupine inside Expo Go / web
  // because it needs native modules. Return CONFIGURED but flag that a build
  // is required.
  return {
    mode: "NATIVE_PORCUPINE",
    isReady: false, // becomes true only inside a real native build
    keyword: KEYWORD,
    accessKeyStatus: "CONFIGURED",
    message:
      "Access key detected. Wake-word engine will activate automatically after the next Publish → Generate Build.",
  };
}

/**
 * Subscribe a callback that fires whenever the wake word is detected.
 * Returns an unsubscribe function.
 */
export function onWakeWord(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

/**
 * Emits a wake-word event. In PREVIEW_SIMULATION mode this is called by the
 * UI's manual "Trigger Jarvis" button. In NATIVE_PORCUPINE mode this will be
 * called from the native module bridge.
 */
export function emitWakeWord(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      // Never let a bad listener kill the loop
      // eslint-disable-next-line no-console
      console.warn("wakeWordEngine listener threw", e);
    }
  });
}

/**
 * Start the engine. In simulation mode this is a no-op (listeners are wired
 * via UI). In native mode this initialises Porcupine.
 */
export async function startEngine(): Promise<void> {
  const status = getEngineStatus();
  if (status.mode === "PREVIEW_SIMULATION") {
    return; // no-op
  }

  // [NATIVE_IMPL] — Uncomment after `yarn expo install @picovoice/porcupine-react-native`
  //
  // import { PorcupineManager, BuiltInKeywords } from "@picovoice/porcupine-react-native";
  //
  // const manager = await PorcupineManager.fromBuiltInKeywords(
  //   ACCESS_KEY,
  //   [BuiltInKeywords.JARVIS],
  //   (keywordIndex: number) => emitWakeWord(),
  // );
  // await manager.start();
  //
  // Store `manager` on module-level so `stopEngine()` can call manager.stop()

  // Until the block above is uncommented, do nothing — the UI badge tells the
  // user a build is required.
}

export async function stopEngine(): Promise<void> {
  // [NATIVE_IMPL] — call manager.stop() + manager.delete() here
}

export function getKeywordDisplay(): string {
  return KEYWORD.toUpperCase();
}
