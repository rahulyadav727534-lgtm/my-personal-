# NEXUS-OFFLINE — Native Integration Plan (Post Phase 1 UI)

> This document is the **implementation blueprint** for taking the mock UI to
> production. Every native module below **cannot** be tested in Expo Go / web
> preview — user must click **Publish → Generate Android/iOS build** to test.

---

## 1. Runtime target

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Expo SDK 54 with **Custom Dev Client** (EAS Build) | Native modules (Porcupine, Vosk, SQLCipher, ForegroundService) need JNI |
| Android min SDK | 26 (Android 8.0) | ForegroundServiceType.MICROPHONE requires API 29+, but graceful fallback to 26 |
| iOS min | 15.1 | BackgroundTasks + AVAudioSession category `.playAndRecord` |
| Language bridge | Kotlin (Android) + Swift (iOS) via `expo-modules-core` | Emergent auto-manages EAS builds |

Emergent handles EAS. User never touches `eas.json`.

---

## 2. Wake Word Engine — Picovoice Porcupine

**Package**: `@picovoice/porcupine-react-native` (v3.x)

### Why Porcupine
- On-device inference (no network)
- Custom wake-word `.ppn` files trainable free on Picovoice Console
- ~10 KB model size, <5 % battery per hour running 24/7

### Required assets
1. Sign up at https://console.picovoice.ai → free tier gives 3 custom wake-words
2. Train wake-word `"hey assistant"` → download `hey_assistant_android_v3.ppn`
3. Get `AccessKey` from Picovoice console
4. Place file in `/app/frontend/assets/wake_word/`

### Env variable to add
```
EXPO_PUBLIC_PORCUPINE_ACCESS_KEY=<user_provided>
```

### Kotlin foreground service skeleton
```kotlin
// android/app/src/main/java/com/nexus/WakeWordService.kt
class WakeWordService : Service() {
    private lateinit var porcupine: PorcupineManager
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_ID, buildNotification())
        porcupine = PorcupineManager.Builder()
            .setAccessKey(BuildConfig.PORCUPINE_KEY)
            .setKeywordPath("hey_assistant.ppn")
            .setSensitivity(0.75f)
            .build(applicationContext) { keywordIndex ->
                // wake-word detected → broadcast intent → JS handler
                sendBroadcast(Intent("WAKE_DETECTED"))
            }
        porcupine.start()
        return START_STICKY
    }
}
```

Register in `AndroidManifest.xml` under `<application>`:
```xml
<service android:name=".WakeWordService"
    android:foregroundServiceType="microphone"
    android:exported="false" />
```

### JS bridge
```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';
const { WakeWordBridge } = NativeModules;
const emitter = new NativeEventEmitter(WakeWordBridge);
emitter.addListener('wake', () => triggerListening());
WakeWordBridge.start();
```

---

## 3. Speech-to-Text — Vosk (offline)

**Package**: `react-native-vosk` (community, well maintained)

- Model: `vosk-model-small-en-in-0.4` (~40 MB, Indian English)
- Bundle in `assets/vosk_model/` and unpack to internal storage on first run
- Alternative small models: `vosk-model-small-en-us-0.15` (US English, 40 MB)

### Setup
```bash
yarn expo install react-native-vosk
# then EAS pre-build hook copies model into APK's assets
```

### Usage
```typescript
import Vosk from 'react-native-vosk';
const recognizer = new Vosk();
await recognizer.loadModel('vosk_model');
recognizer.on('result', (text: string) => runNLU(text));
recognizer.start();
```

---

## 4. Voiceprint / Speaker Verification

Two viable stacks — recommend **Stack A** for MVP:

### Stack A — Resemblyzer-ONNX (RECOMMENDED)
1. Convert Resemblyzer's speaker-embedding TF model → ONNX (~17 MB, INT8 quantized)
2. Bundle `voiceprint_encoder.onnx` in APK
3. Use `onnxruntime-react-native` to compute 256-D embedding per utterance
4. Store owner's embedding vector (encrypted) in SQLCipher
5. Verify by cosine distance ≥ 0.75 → owner match

```typescript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
const sess = await InferenceSession.create(modelPath);
const emb = await sess.run({ mel_input: melTensor });
const cosine = dot(emb, ownerEmb) / (norm(emb) * norm(ownerEmb));
```

### Stack B — TF Lite ECAPA-TDNN
- Smaller (~10 MB) but requires custom C++ preprocessing (mel-fb + MFCC)
- Higher accuracy but 2× dev effort

### Anti-spoofing
- Random challenge phrase (rotates each auth) → prevents recording replay
- Combine with device biometric (BiometricPrompt / Face ID) → hybrid Tier-2 unlock

---

## 5. Local Encrypted Storage — SQLCipher

**Package**: `react-native-quick-sqlite` + SQLCipher binaries

### Schema (see `/app/backend/*` docs for parity)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  device_id TEXT UNIQUE,
  voiceprint_embedding BLOB,          -- 256-D FP16 vector
  pin_hash TEXT,                       -- Argon2id
  created_at INTEGER
);

CREATE TABLE commands (
  id TEXT PRIMARY KEY,
  intent TEXT,
  tier INTEGER,
  status TEXT,
  category TEXT,
  timestamp INTEGER,
  user_id TEXT REFERENCES users(id)
);

CREATE TABLE wake_events (
  id TEXT PRIMARY KEY,
  confidence REAL,
  transcript TEXT,
  timestamp INTEGER
);

CREATE TABLE online_query_ledger (
  id TEXT PRIMARY KEY,
  query TEXT,
  answer TEXT,
  query_type TEXT,
  bytes_sent INTEGER,
  bytes_received INTEGER,
  timestamp INTEGER
);
```

### Key derivation
- User's PIN → Argon2id (128 MB memory cost) → 32-byte SQLCipher key
- Never persist raw PIN; derive key on unlock and hold in secure Enclave / EncryptedSharedPreferences

---

## 6. Offline NLU Intent Parser

Skip full Rasa (200 MB+). Instead use **rule-based grammar** in TypeScript:

```typescript
// src/nlu/intents.ts
export const INTENTS: IntentRule[] = [
  { pattern: /(stop|silence)\s+alarm/i, intent: "ALARM_STOP", tier: 1 },
  { pattern: /flash\s?light\s+(on|off)/i, intent: "FLASHLIGHT_TOGGLE", tier: 1 },
  { pattern: /(read|show)\s+(sms|message)/i, intent: "READ_SMS", tier: 2 },
  { pattern: /(search|google)\s+(.+)/i, intent: "WEB_SEARCH", tier: 2, category: "online" },
  { pattern: /meaning\s+of\s+(.+)/i, intent: "DEFINE_WORD", tier: 2, category: "online" },
];

export function parseIntent(text: string): ParsedIntent | null {
  for (const rule of INTENTS) {
    const m = text.match(rule.pattern);
    if (m) return { intent: rule.intent, tier: rule.tier, entity: m[2] || m[1] };
  }
  return null;
}
```

Offline dictionary look-up for words → local `en_dict.json` (~2 MB, 30k common words).

---

## 7. Android Permissions & Battery Bypass Onboarding

### AndroidManifest additions (already partially in `app.json`)
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.FLASHLIGHT" />
```

### Battery bypass flow (already in Wizard tab UI)
1. `PermissionsAndroid.request(RECORD_AUDIO)`
2. Check `PowerManager.isIgnoringBatteryOptimizations(pkg)` → if false, launch `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
3. OEM extras (Xiaomi/Realme/OnePlus) → open `Settings → Apps → NEXUS → Auto-start` via deep link (per-brand intent)

---

## 8. Backend service auto-start after reboot
```kotlin
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            ContextCompat.startForegroundService(ctx, Intent(ctx, WakeWordService::class.java))
        }
    }
}
```

---

## 9. Development phases (native)

| Phase | Deliverable | ETA | Blocks-testing on |
|---|---|---|---|
| 2A | Porcupine bridge + foreground service | 3 days | Real device build |
| 2B | Vosk STT integration + wake→STT pipeline | 2 days | Real device build |
| 2C | Voiceprint enroll + verify with ONNX | 3 days | Real device build |
| 2D | SQLCipher migration + intent history | 2 days | Real device build |
| 2E | Battery bypass + boot receiver + OEM deep-links | 2 days | Real device build |
| 2F | Tier-1/Tier-2 command executors (Camera, Flashlight, SMS, Call) | 3 days | Real device build |
| 2G | iOS parity (harder — background audio limitations) | 5 days | Real device build |

**Total native effort**: ~20 dev-days for full parity with Phase 1 UI.

---

## 10. What CAN be tested in Expo Go today
- All 5 tabs UI/UX flows (already done Phase 1)
- Online Mode toggle + backend `/api/online/query` LLM roundtrip (already done in this phase)
- Command list state transitions, filter chips, modals

## 10.1 What CANNOT be tested until you Publish
- Actual microphone listening in background / locked state
- Wake-word detection accuracy on real audio
- Voiceprint enrollment / verification on real voice
- SQLCipher encrypted storage on device flash
- Battery optimization exemption dialog
- Camera / SMS / Phone Tier-2 executors

---

## 11. Assets user must provide before Phase 2 build

| Asset | Where to obtain | Required? |
|---|---|---|
| Porcupine AccessKey | https://console.picovoice.ai (free) | Yes |
| Custom `.ppn` wake-word file | Picovoice console → train "hey assistant" | Yes |
| Vosk model | https://alphacephei.com/vosk/models (free) | Yes |
| ONNX voiceprint model | Auto-bundled (repo asset) | No |
| App icon 1024×1024 | User designs / we generate | Yes for Publish |
| iOS `NSMicrophoneUsageDescription` copy | Approve wording | Yes |

---

## 12. Cost estimate (post-launch)
- Porcupine free tier: sufficient for < 100 users
- Vosk / ONNX / SQLCipher: fully open source
- Emergent LLM key (Online Mode): pay-per-query on user's Emergent balance
- **Zero recurring server cost** if user disables Online Mode
