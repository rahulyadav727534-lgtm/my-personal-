{
  "original_problem_statement": "Ek fully offline, on-device voice-controlled personal assistant app jo bina kisi internet/server connection ke poore phone ko control kare, sirf owner ki voice pehchan kar wake-word par activate ho, aur privacy-first architecture par bani ho. Update: Optional Online Mode toggle - default OFF, when ON allows web search/meaning/general knowledge queries with clear UI indicators.",
  "architecture": "Offline-first native Android architecture with embedded wake-word engine (Porcupine/Vosk), two-tier access controller, local encrypted SQLCipher database, zero cloud telemetry, and optional Online Query Channel with strict query isolation.",
  "user_personas": [
    "Privacy-conscious owner seeking air-gapped voice control",
    "Offline utility power user needing reliable hands-free device management",
    "Occasional user who wants optional web search without sacrificing offline privacy"
  ],
  "core_requirements": [
    "1. Zero Server Dependency (100% offline NPU & models by default)",
    "2. Always-on Wake Word Detection in background",
    "3. Two-Tier Access System (Tier 1 locked state vs Tier 2 voiceprint-verified state)",
    "4. Voiceprint-based speaker verification & local enrollment (ALWAYS offline)",
    "5. Encrypted Local SQLite/SQLCipher storage",
    "6. Battery optimization exemption & permission onboarding wizard",
    "7. Optional Online Mode Toggle (default OFF) with clear UI indicators (green=offline, amber=online)"
  ],
  "implemented_features": [
    "Wake Word Engine Monitor with Online Mode Switch card + live waveform (Mar 2026)",
    "Command Terminal with Online filter chip, ONLINE badges, and Online-blocked failure state (Mar 2026)",
    "Voiceprint Biometric Enrollment with ALWAYS-OFFLINE reassurance banner (Mar 2026)",
    "Privacy & Audit Ledger with dynamic Air-Gap vs Online Query Channel status + packet counter (Mar 2026)",
    "System Setup Wizard with Battery bypass + NLU download + Optional Online Mode step (Mar 2026)",
    "Global Terminal Header badge that switches between AIR-GAPPED (green) and ONLINE MODE ON (amber) across all tabs (Mar 2026)"
  ],
  "online_mode_behavior": {
    "default": "OFF (100% offline air-gapped)",
    "visual_indicators": "Neon Green (#00FF66) for offline, Amber (#FFB800) for online",
    "voiceprint_guarantee": "Voiceprint data NEVER goes online, regardless of toggle state",
    "blocked_commands_when_off": "Online-category commands show blocked notice + failed status"
  },
  "mocked_in_frontend": [
    "Offline Porcupine wake-word audio stream (simulated via local state & animated waveform)",
    "SQLCipher database storage (simulated via React context state)",
    "Android background service executor (simulated via interactive command logs)",
    "Online query dispatch (simulated - no actual network call made yet)"
  ],
  "prioritized_backlog": {
    "P0": [
      "Real JNI bindings for Porcupine wake word engine in Kotlin",
      "SQLCipher C++ library integration for React Native"
    ],
    "P1": [
      "Vosk C++ speech-to-text offline engine integration",
      "Android Foreground Service notification channel setup",
      "Phase 2: FastAPI backend endpoint for Online Mode web search simulation"
    ],
    "P2": [
      "Custom NLU intent grammar JSON editor"
    ]
  },
  "next_tasks": [
    "Phase 2: Build FastAPI backend endpoints for online web search simulation",
    "Native integration research: Porcupine / Vosk / Voiceprint (requires custom dev client, not Expo Go)"
  ]
}
