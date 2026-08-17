# Wake Word Engine — Setup & Key Rotation Guide

> **Current state:** Preview Simulation Mode (using a placeholder Picovoice
> AccessKey). All UI, backend, and command execution are fully functional in
> the preview. Only the **actual on-device audio listening** requires a real
> AccessKey + native build.

---

## Why the app runs fine without a real key

- The app is running in **Expo Go / web preview**, which cannot load native
  Porcupine binaries anyway (they need JNI on Android and dynamic frameworks
  on iOS).
- We ship a UI-level "TRIGGER" button in the Wake Word tab that fires the
  same event the native module would fire. Everything downstream (command
  logging, Online Mode dispatch, Enterprise voiceprint verification) runs
  identically.
- The moment you Publish + generate a native build **and** replace the
  placeholder key, on-device wake-word listening starts automatically on the
  next app launch — **no code change required**.

---

## Wake word choice: **JARVIS**

`Jarvis` is one of Picovoice Porcupine's FREE built-in keywords
(https://picovoice.ai/docs/api/porcupine-nodejs/#builtinkeyword). This means:

- ✅ No custom `.ppn` file to train
- ✅ No credit-card / paid tier
- ✅ Works on Free plan forever with a single AccessKey

Other free built-in keywords you can switch to instantly (change
`EXPO_PUBLIC_PORCUPINE_KEYWORD` in `.env`):

`alexa`, `americano`, `blueberry`, `bumblebee`, `computer`, `grapefruit`,
`grasshopper`, **`jarvis`**, `okay google`, `picovoice`, `porcupine`, `terminator`

---

## 3-line key swap when you get your real AccessKey

1. Open https://console.picovoice.ai/signup and grab your free AccessKey.
   *(Trouble signing up? Try personal Gmail, disable VPN, use the direct
   `console.picovoice.ai/signup` URL, or contact `contact@picovoice.ai`.)*

2. Edit `/app/frontend/.env`:

   ```env
   EXPO_PUBLIC_PORCUPINE_ACCESS_KEY=YOUR_REAL_KEY_HERE
   ```

3. Restart Expo:

   ```bash
   sudo supervisorctl restart expo
   ```

The `getEngineStatus()` helper in
`/app/frontend/src/services/wakeWordEngine.ts` will now report
`accessKeyStatus: "CONFIGURED"` and the header badge will switch from blue
"PREVIEW SIMULATION MODE" to green "PORCUPINE ENGINE READY".

---

## Activating real on-device listening (post-Publish)

After you click **Publish → Generate Android/iOS Build** (Emergent handles
EAS internally):

1. Install the native package (Emergent's build step handles this
   automatically when the import is uncommented):

   ```bash
   yarn expo install @picovoice/porcupine-react-native
   ```

2. Uncomment the `[NATIVE_IMPL]` block inside
   `/app/frontend/src/services/wakeWordEngine.ts` (about 8 lines of
   `PorcupineManager.fromBuiltInKeywords(...)`).

3. The Wake Word tab's `useEffect` already calls `startEngine()` on mount —
   as soon as the native module resolves, it starts the mic listener in a
   foreground service.

4. On Android, ensure the following permissions are in `/app/frontend/app.json`
   under `android.permissions` (already added by the Phase 1 wizard):

   - `RECORD_AUDIO`
   - `FOREGROUND_SERVICE`
   - `FOREGROUND_SERVICE_MICROPHONE`
   - `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`

5. On iOS, add usage strings to `/app/frontend/app.json` under
   `ios.infoPlist`:

   ```json
   "NSMicrophoneUsageDescription": "Detect Jarvis to run offline commands"
   ```

---

## FAQ

**Q: Can I test wake-word without a key at all?**
Yes — the "TRIGGER" button on the Wake Word tab fires an identical
`onWakeWord` event. Everything downstream (Online Mode dispatch, voiceprint
challenge, Tier 2 auth) reacts as if you spoke "Jarvis".

**Q: Will my Emergent LLM budget be consumed by Porcupine?**
No. Porcupine runs 100% on-device. The Emergent LLM key is only used when
you toggle **Online Mode ON** and dispatch a web/meaning/knowledge query.

**Q: What if I want a wake word that's NOT in the free list?**
Sign in to Picovoice Console → Wake Word tab → "Train" a custom `.ppn` file
(also free). Then place the file in
`/app/frontend/assets/wake_word/jarvis_custom.ppn` and change the
`fromBuiltInKeywords` call to `fromKeywordPaths([customPath])`.

**Q: The badge still says PREVIEW SIMULATION even after I replaced the key.**
Restart Expo (`sudo supervisorctl restart expo`) — `.env` values are baked
in at bundle time by Metro.

---

## Key rotation checklist (future maintenance)

- [ ] Every 12 months, rotate your Picovoice AccessKey via console
- [ ] Update `EXPO_PUBLIC_PORCUPINE_ACCESS_KEY` in `.env`
- [ ] Re-deploy via Publish button — Emergent auto-copies new .env into the
      deployment secret store on first deploy; subsequent rotations require
      editing the secret from the Deployment Panel → Secrets tab
- [ ] No user data or voiceprints need re-enrollment on key rotation
