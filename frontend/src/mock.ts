export interface OnlineFeatures {
  webSearch: boolean;
  dictionary: boolean;
  knowledge: boolean;
  translation: boolean;
}

export interface WakeWordConfig {
  engine: string;
  wakeWord: string;
  sensitivity: number;
  isActive: boolean;
  modelSizeMB: number;
  batteryImpact: string;
  onlineMode: boolean; // Master switch
  onlineFeatures: OnlineFeatures; // Granular per-feature switches
}

export interface CommandItem {
  id: string;
  tier: 1 | 2;
  title: string;
  intent: string;
  status: "executed" | "pending_voice_auth" | "failed";
  timestamp: string;
  category: "hardware" | "communication" | "security" | "system" | "online";
}

export interface VoiceprintUser {
  enrolled: boolean;
  confidenceScore: number;
  enrollmentPhrases: string[];
  lastVerified: string;
  encryptedModelHash: string;
}

export interface PrivacyLedger {
  airGapActive: boolean;
  onlineModeActive: boolean;
  localEncryptedDb: string;
  dbSizeBytes: string;
  outboundPackets: number;
  lastAudit: string;
}

export interface OnDeviceModel {
  name: string;
  version: string;
  sizeMB: number;
  sha256: string;
  purpose: string;
}

export interface SystemStatus {
  batteryUnrestricted: boolean;
  backgroundServiceRunning: boolean;
  offlineNluLoaded: boolean;
  onlineMode: boolean;
  permissionsGranted: {
    microphone: boolean;
    phoneCalls: boolean;
    camera: boolean;
    systemSettings: boolean;
    internet: boolean;
  };
}

// Tier-2 unlock session (voice-verified)
export interface UnlockedSession {
  unlockedAt: number; // epoch ms
  expiresAt: number; // epoch ms
  verifiedBy: string; // member id
}

// Zero-Trust Enterprise Mode
export type EnterpriseRole = "OWNER" | "ADMIN" | "USER";

export interface EnterpriseMember {
  id: string;
  name: string;
  role: EnterpriseRole;
  voiceprintEnrolled: boolean;
  matchConfidence: number;
  lastVerified: string;
  allowedTiers: (1 | 2)[];
}

export interface EnterpriseConfig {
  modeEnabled: boolean;
  orgName: string;
  members: EnterpriseMember[];
  totalCommandsAudited: number;
}

// MOCK API: /api/offline/status
export const initialWakeWordConfig: WakeWordConfig = {
  engine: "Porcupine-Embedded Nano (v3.2)",
  wakeWord: "JARVIS",
  sensitivity: 0.75,
  isActive: true,
  modelSizeMB: 1.8,
  batteryImpact: "0.2% per hour (Low Power NPU)",
  onlineMode: false,
  onlineFeatures: {
    webSearch: true,
    dictionary: true,
    knowledge: true,
    translation: false,
  },
};

export const initialCommands: CommandItem[] = [
  {
    id: "cmd_01",
    tier: 1,
    title: "Stop Morning Alarm",
    intent: "ALARM_STOP",
    status: "executed",
    timestamp: "07:30:12 AM",
    category: "hardware",
  },
  {
    id: "cmd_02",
    tier: 1,
    title: "Toggle Flashlight ON",
    intent: "FLASHLIGHT_TOGGLE",
    status: "executed",
    timestamp: "08:14:05 AM",
    category: "hardware",
  },
  {
    id: "cmd_03",
    tier: 2,
    title: "Read Last SMS from Mom",
    intent: "READ_LATEST_SMS",
    status: "executed",
    timestamp: "09:02:41 AM",
    category: "communication",
  },
  {
    id: "cmd_04",
    tier: 2,
    title: "Web Search: Quantum Computing (Online Required)",
    intent: "WEB_SEARCH_ONLINE",
    status: "pending_voice_auth",
    timestamp: "10:15:20 AM",
    category: "online",
  },
  {
    id: "cmd_05",
    tier: 1,
    title: "Find My Phone (Loud Alarm)",
    intent: "FIND_PHONE",
    status: "executed",
    timestamp: "11:45:00 AM",
    category: "system",
  },
];

export const initialVoiceprint: VoiceprintUser = {
  enrolled: true,
  confidenceScore: 98.4,
  enrollmentPhrases: [
    "Nexus open secure vault",
    "Verify owner acoustic signature",
    "Unlock tier two voice control",
  ],
  lastVerified: "Today at 10:15 AM",
  encryptedModelHash: "sha256:8f94c2e11d04b98... (AES-256 SQLCipher)",
};

export const initialPrivacyLedger: PrivacyLedger = {
  airGapActive: true,
  onlineModeActive: false,
  localEncryptedDb: "SQLCipher Local Storage (.db.secure)",
  dbSizeBytes: "4.2 MB",
  outboundPackets: 0,
  lastAudit: "Continuous Air-Gap Verified (0 leaks)",
};

export const initialSystemStatus: SystemStatus = {
  batteryUnrestricted: true,
  backgroundServiceRunning: true,
  offlineNluLoaded: true,
  onlineMode: false,
  permissionsGranted: {
    microphone: true,
    phoneCalls: true,
    camera: true,
    systemSettings: true,
    internet: false,
  },
};

export const initialEnterpriseConfig: EnterpriseConfig = {
  modeEnabled: false,
  orgName: "NEXUS Personal Vault",
  members: [
    {
      id: "usr_owner",
      name: "Primary Owner",
      role: "OWNER",
      voiceprintEnrolled: true,
      matchConfidence: 98.4,
      lastVerified: "Today at 10:15 AM",
      allowedTiers: [1, 2],
    },
  ],
  totalCommandsAudited: 0,
};

// On-Device Models Manifest (Transparency Dashboard)
export const initialOnDeviceModels: OnDeviceModel[] = [
  {
    name: "Porcupine Wake Word",
    version: "v3.2",
    sizeMB: 1.8,
    sha256: "8f94c2e11d04b98a3ce2b5f21b8a4c8f",
    purpose: "Always-on wake-word detection",
  },
  {
    name: "Vosk STT Small",
    version: "en-in-0.4",
    sizeMB: 18.4,
    sha256: "5ab7c2b8f11d04e19b4c8a3ce2f5a1b8",
    purpose: "Offline speech-to-text transcription",
  },
  {
    name: "Voiceprint Encoder",
    version: "resemblyzer-onnx-q8",
    sizeMB: 17.2,
    sha256: "3ce2b5f21b8a4c8f8f94c2e11d04b98a",
    purpose: "256-D speaker embedding",
  },
  {
    name: "NLU Intent Rules",
    version: "v1.4",
    sizeMB: 0.3,
    sha256: "b4c8a3ce2f5a1b85ab7c2b8f11d04e19",
    purpose: "Offline rule-based intent parsing",
  },
];
