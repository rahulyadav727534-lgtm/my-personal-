import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { storage } from "@/src/utils/storage";
import {
  WakeWordConfig,
  CommandItem,
  VoiceprintUser,
  PrivacyLedger,
  SystemStatus,
  EnterpriseConfig,
  EnterpriseMember,
  EnterpriseRole,
  OnlineFeatures,
  UnlockedSession,
  OnDeviceModel,
  initialWakeWordConfig,
  initialCommands,
  initialVoiceprint,
  initialPrivacyLedger,
  initialSystemStatus,
  initialEnterpriseConfig,
  initialOnDeviceModels,
} from "../mock";

interface AppContextType {
  hydrated: boolean;
  wakeConfig: WakeWordConfig;
  updateWakeConfig: (partial: Partial<WakeWordConfig>) => void;
  toggleOnlineMode: (enabled: boolean) => void;
  toggleOnlineFeature: (key: keyof OnlineFeatures, enabled: boolean) => void;
  commands: CommandItem[];
  addCommand: (cmd: Omit<CommandItem, "id" | "timestamp">) => void;
  updateCommandStatus: (id: string, status: CommandItem["status"]) => void;
  voiceprint: VoiceprintUser;
  updateVoiceprint: (partial: Partial<VoiceprintUser>) => void;
  privacyLedger: PrivacyLedger;
  systemStatus: SystemStatus;
  updateSystemStatus: (partial: Partial<SystemStatus>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isListening: boolean;
  toggleListening: () => void;
  enterprise: EnterpriseConfig;
  toggleEnterpriseMode: (enabled: boolean) => void;
  addMember: (name: string, role: EnterpriseRole) => void;
  removeMember: (id: string) => void;
  enrollMemberVoiceprint: (id: string) => void;
  session: UnlockedSession | null;
  unlockTier2: (memberId?: string) => void;
  lockTier2: () => void;
  sessionRemainingMs: number;
  onDeviceModels: OnDeviceModel[];
  clearAllLocalData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ------------------ Storage keys ------------------
const STORAGE_KEYS = {
  wakeConfig: "nexus.wakeConfig",
  voiceprint: "nexus.voiceprint",
  systemStatus: "nexus.systemStatus",
  enterprise: "nexus.enterprise",
  commands: "nexus.commands",
  session: "nexus.session",
} as const;

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.secureGet(key, "");
  if (!raw || typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveJson(key: string, value: unknown): Promise<void> {
  await storage.secureSet(key, JSON.stringify(value));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [wakeConfig, setWakeConfig] = useState<WakeWordConfig>(initialWakeWordConfig);
  const [commands, setCommands] = useState<CommandItem[]>(initialCommands);
  const [voiceprint, setVoiceprint] = useState<VoiceprintUser>(initialVoiceprint);
  const [privacyLedger, setPrivacyLedger] = useState<PrivacyLedger>(initialPrivacyLedger);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [activeTab, setActiveTab] = useState<string>("index");
  const [isListening, setIsListening] = useState<boolean>(true);
  const [enterprise, setEnterprise] = useState<EnterpriseConfig>(initialEnterpriseConfig);
  const [session, setSession] = useState<UnlockedSession | null>(null);
  const [sessionRemainingMs, setSessionRemainingMs] = useState<number>(0);

  const hydratedRef = useRef(false);

  // -------- Hydration: load persisted state on boot --------
  useEffect(() => {
    (async () => {
      const [wc, vp, ss, ent, cmds, sess] = await Promise.all([
        loadJson<WakeWordConfig>(STORAGE_KEYS.wakeConfig, initialWakeWordConfig),
        loadJson<VoiceprintUser>(STORAGE_KEYS.voiceprint, initialVoiceprint),
        loadJson<SystemStatus>(STORAGE_KEYS.systemStatus, initialSystemStatus),
        loadJson<EnterpriseConfig>(STORAGE_KEYS.enterprise, initialEnterpriseConfig),
        loadJson<CommandItem[]>(STORAGE_KEYS.commands, initialCommands),
        loadJson<UnlockedSession | null>(STORAGE_KEYS.session, null),
      ]);
      setWakeConfig({ ...initialWakeWordConfig, ...wc });
      setVoiceprint({ ...initialVoiceprint, ...vp });
      setSystemStatus({ ...initialSystemStatus, ...ss });
      setEnterprise({ ...initialEnterpriseConfig, ...ent });
      if (Array.isArray(cmds) && cmds.length) setCommands(cmds);
      if (sess && sess.expiresAt > Date.now()) setSession(sess);
      hydratedRef.current = true;
      setHydrated(true);
    })();
  }, []);

  // -------- Persistence: save on every change (post-hydration) --------
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.wakeConfig, wakeConfig);
  }, [wakeConfig]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.voiceprint, voiceprint);
  }, [voiceprint]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.systemStatus, systemStatus);
  }, [systemStatus]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.enterprise, enterprise);
  }, [enterprise]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.commands, commands.slice(0, 50));
  }, [commands]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveJson(STORAGE_KEYS.session, session);
  }, [session]);

  // -------- Session tick + auto-lock --------
  useEffect(() => {
    if (!session) {
      setSessionRemainingMs(0);
      return;
    }
    const tick = () => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) {
        setSession(null);
        setSessionRemainingMs(0);
      } else {
        setSessionRemainingMs(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  // -------- Actions --------
  const updateWakeConfig = (partial: Partial<WakeWordConfig>) =>
    setWakeConfig((prev) => ({ ...prev, ...partial }));

  const toggleOnlineMode = (enabled: boolean) => {
    setWakeConfig((prev) => ({ ...prev, onlineMode: enabled }));
    setSystemStatus((prev) => ({
      ...prev,
      onlineMode: enabled,
      permissionsGranted: { ...prev.permissionsGranted, internet: enabled },
    }));
    setPrivacyLedger((prev) => ({
      ...prev,
      airGapActive: !enabled,
      onlineModeActive: enabled,
      outboundPackets: enabled ? prev.outboundPackets : 0,
      lastAudit: enabled
        ? "Online Query Channel Active (Strict Query Isolation)"
        : "Continuous Air-Gap Verified (0 leaks)",
    }));
  };

  const toggleOnlineFeature = (key: keyof OnlineFeatures, enabled: boolean) => {
    setWakeConfig((prev) => ({
      ...prev,
      onlineFeatures: { ...prev.onlineFeatures, [key]: enabled },
    }));
  };

  const addCommand = (cmd: Omit<CommandItem, "id" | "timestamp">) => {
    const newCmd: CommandItem = {
      ...cmd,
      id: `cmd_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setCommands((prev) => [newCmd, ...prev].slice(0, 50));
  };

  const updateCommandStatus = (id: string, status: CommandItem["status"]) =>
    setCommands((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

  const updateVoiceprint = (partial: Partial<VoiceprintUser>) =>
    setVoiceprint((prev) => ({ ...prev, ...partial }));

  const updateSystemStatus = (partial: Partial<SystemStatus>) =>
    setSystemStatus((prev) => ({ ...prev, ...partial }));

  const toggleListening = () => setIsListening((prev) => !prev);

  const toggleEnterpriseMode = (enabled: boolean) =>
    setEnterprise((prev) => ({ ...prev, modeEnabled: enabled }));

  const addMember = (name: string, role: EnterpriseRole) => {
    const newMember: EnterpriseMember = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      role,
      voiceprintEnrolled: false,
      matchConfidence: 0,
      lastVerified: "Never",
      allowedTiers: role === "OWNER" || role === "ADMIN" ? [1, 2] : [1],
    };
    setEnterprise((prev) => ({ ...prev, members: [...prev.members, newMember] }));
  };

  const removeMember = (id: string) =>
    setEnterprise((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id || m.role === "OWNER"),
    }));

  const enrollMemberVoiceprint = (id: string) =>
    setEnterprise((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id
          ? {
              ...m,
              voiceprintEnrolled: true,
              matchConfidence: Number((96 + Math.random() * 3.5).toFixed(1)),
              lastVerified: "Just enrolled",
            }
          : m,
      ),
    }));

  const unlockTier2 = (memberId: string = "usr_owner") => {
    const now = Date.now();
    setSession({
      unlockedAt: now,
      expiresAt: now + SESSION_TTL_MS,
      verifiedBy: memberId,
    });
    setVoiceprint((prev) => ({
      ...prev,
      lastVerified: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  };

  const lockTier2 = () => setSession(null);

  const clearAllLocalData = async () => {
    await Promise.all([
      storage.secureRemove(STORAGE_KEYS.wakeConfig),
      storage.secureRemove(STORAGE_KEYS.voiceprint),
      storage.secureRemove(STORAGE_KEYS.systemStatus),
      storage.secureRemove(STORAGE_KEYS.enterprise),
      storage.secureRemove(STORAGE_KEYS.commands),
      storage.secureRemove(STORAGE_KEYS.session),
    ]);
    setWakeConfig(initialWakeWordConfig);
    setVoiceprint(initialVoiceprint);
    setSystemStatus(initialSystemStatus);
    setEnterprise(initialEnterpriseConfig);
    setCommands(initialCommands);
    setSession(null);
  };

  return (
    <AppContext.Provider
      value={{
        hydrated,
        wakeConfig,
        updateWakeConfig,
        toggleOnlineMode,
        toggleOnlineFeature,
        commands,
        addCommand,
        updateCommandStatus,
        voiceprint,
        updateVoiceprint,
        privacyLedger,
        systemStatus,
        updateSystemStatus,
        activeTab,
        setActiveTab,
        isListening,
        toggleListening,
        enterprise,
        toggleEnterpriseMode,
        addMember,
        removeMember,
        enrollMemberVoiceprint,
        session,
        unlockTier2,
        lockTier2,
        sessionRemainingMs,
        onDeviceModels: initialOnDeviceModels,
        clearAllLocalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
