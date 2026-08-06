export interface WakeWordConfig {
  engine: string;
  wakeWord: string;
  sensitivity: number;
  isActive: boolean;
  modelSizeMB: number;
  batteryImpact: string;
}

export interface CommandItem {
  id: string;
  tier: 1 | 2;
  title: string;
  intent: string;
  status: "executed" | "pending_voice_auth" | "failed";
  timestamp: string;
  category: "hardware" | "communication" | "security" | "system";
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
  localEncryptedDb: string;
  dbSizeBytes: string;
  outboundPackets: number;
  lastAudit: string;
}

export interface SystemStatus {
  batteryUnrestricted: boolean;
  backgroundServiceRunning: boolean;
  offlineNluLoaded: boolean;
  permissionsGranted: {
    microphone: boolean;
    phoneCalls: boolean;
    camera: boolean;
    systemSettings: boolean;
  };
}

// MOCK API: /api/offline/status
export const initialWakeWordConfig: WakeWordConfig = {
  engine: "Porcupine-Embedded Nano (v3.2)",
  wakeWord: "HEY ASSISTANT",
  sensitivity: 0.75,
  isActive: true,
  modelSizeMB: 1.8,
  batteryImpact: "0.2% per hour (Low Power NPU)",
};

// MOCK API: /api/offline/commands
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
    title: "Launch Camera & Capture Secure Photo",
    intent: "CAMERA_CAPTURE",
    status: "pending_voice_auth",
    timestamp: "10:15:20 AM",
    category: "security",
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

// MOCK API: /api/offline/voiceprint
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

// MOCK API: /api/offline/privacy-ledger
export const initialPrivacyLedger: PrivacyLedger = {
  airGapActive: true,
  localEncryptedDb: "SQLCipher Local Storage (.db.secure)",
  dbSizeBytes: "4.2 MB",
  outboundPackets: 0,
  lastAudit: "Continuous Air-Gap Verified (0 leaks)",
};

// MOCK API: /api/offline/system-status
export const initialSystemStatus: SystemStatus = {
  batteryUnrestricted: true,
  backgroundServiceRunning: true,
  offlineNluLoaded: true,
  permissionsGranted: {
    microphone: true,
    phoneCalls: true,
    camera: true,
    systemSettings: true,
  },
};
