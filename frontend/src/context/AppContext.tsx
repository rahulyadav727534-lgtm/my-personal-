import React, { createContext, useContext, useState } from "react";
import {
  WakeWordConfig,
  CommandItem,
  VoiceprintUser,
  PrivacyLedger,
  SystemStatus,
  initialWakeWordConfig,
  initialCommands,
  initialVoiceprint,
  initialPrivacyLedger,
  initialSystemStatus,
} from "../mock";

interface AppContextType {
  wakeConfig: WakeWordConfig;
  updateWakeConfig: (partial: Partial<WakeWordConfig>) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [wakeConfig, setWakeConfig] = useState<WakeWordConfig>(initialWakeWordConfig);
  const [commands, setCommands] = useState<CommandItem[]>(initialCommands);
  const [voiceprint, setVoiceprint] = useState<VoiceprintUser>(initialVoiceprint);
  const [privacyLedger] = useState<PrivacyLedger>(initialPrivacyLedger);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [activeTab, setActiveTab] = useState<string>("index");
  const [isListening, setIsListening] = useState<boolean>(true);

  const updateWakeConfig = (partial: Partial<WakeWordConfig>) => {
    setWakeConfig((prev) => ({ ...prev, ...partial }));
  };

  const addCommand = (cmd: Omit<CommandItem, "id" | "timestamp">) => {
    const newCmd: CommandItem = {
      ...cmd,
      id: `cmd_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setCommands((prev) => [newCmd, ...prev]);
  };

  const updateCommandStatus = (id: string, status: CommandItem["status"]) => {
    setCommands((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const updateVoiceprint = (partial: Partial<VoiceprintUser>) => {
    setVoiceprint((prev) => ({ ...prev, ...partial }));
  };

  const updateSystemStatus = (partial: Partial<SystemStatus>) => {
    setSystemStatus((prev) => ({ ...prev, ...partial }));
  };

  const toggleListening = () => {
    setIsListening((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        wakeConfig,
        updateWakeConfig,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
