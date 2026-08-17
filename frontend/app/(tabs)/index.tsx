import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";
import {
  getEngineStatus,
  emitWakeWord,
  onWakeWord,
  startEngine,
} from "@/src/services/wakeWordEngine";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function WakeWordScreen() {
  const { wakeConfig, updateWakeConfig, toggleOnlineMode, isListening, toggleListening, addCommand } = useApp();
  const engineStatus = useMemo(() => getEngineStatus(), []);
  const [testCommandInput, setTestCommandInput] = useState("");
  const [wakePulse, setWakePulse] = useState(false);
  const [simulatedTriggers, setSimulatedTriggers] = useState([
    { id: "tr_1", time: "11:42:10 AM", confidence: 99.1, text: "Jarvis, stop alarm" },
    { id: "tr_2", time: "10:15:02 AM", confidence: 97.8, text: "Jarvis, web search quantum computing" },
  ]);

  // Start engine on mount; subscribe to wake-word events
  useEffect(() => {
    startEngine();
    const unsubscribe = onWakeWord(() => {
      setWakePulse(true);
      const triggerId = `tr_${Date.now()}`;
      setSimulatedTriggers((prev) => [
        {
          id: triggerId,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          confidence: Number((97 + Math.random() * 2.5).toFixed(1)),
          text: `${engineStatus.keyword.toUpperCase()} detected`,
        },
        ...prev.slice(0, 4),
      ]);
      addCommand({
        title: `${engineStatus.keyword.toUpperCase()} wake event`,
        intent: "WAKE_WORD_DETECTED",
        status: "executed",
        tier: 1,
        category: "system",
      });
      setTimeout(() => setWakePulse(false), 1200);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online query result modal state
  const [queryModalVisible, setQueryModalVisible] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{ query: string; answer: string; type: string } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const detectQueryType = (text: string): "search" | "meaning" | "knowledge" => {
    const t = text.toLowerCase();
    if (t.includes("meaning") || t.includes("define") || t.includes("what does") || t.includes("what is a word")) return "meaning";
    if (t.includes("who") || t.includes("when") || t.includes("why") || t.includes("how")) return "knowledge";
    return "search";
  };

  const dispatchOnlineQuery = async (rawQuery: string) => {
    const type = detectQueryType(rawQuery);
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult({ query: rawQuery, answer: "", type });
    setQueryModalVisible(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/online/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: rawQuery, query_type: type }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err.substring(0, 120)}`);
      }
      const data = await res.json();
      setQueryResult({ query: rawQuery, answer: data.answer, type });
      // Log to command history
      addCommand({
        title: rawQuery,
        intent: `ONLINE_${type.toUpperCase()}`,
        status: "executed",
        tier: 2,
        category: "online",
      });
    } catch (e: any) {
      setQueryError(e?.message || "Online query failed");
      addCommand({
        title: `${rawQuery} [Online query error]`,
        intent: "ONLINE_ERROR",
        status: "failed",
        tier: 2,
        category: "online",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSimulateTrigger = (text: string, tier: 1 | 2, requiresOnline: boolean = false) => {
    if (requiresOnline && !wakeConfig.onlineMode) {
      addCommand({
        title: `${text} [BLOCKED: Online Mode OFF]`,
        intent: "ONLINE_BLOCKED",
        status: "failed",
        tier: 2,
        category: "online",
      });
      return;
    }

    // Add to wake-log strip
    setSimulatedTriggers((prev) => [
      {
        id: `tr_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        confidence: Number((95 + Math.random() * 4.9).toFixed(1)),
        text,
      },
      ...prev.slice(0, 4),
    ]);

    // Online mode: actually call backend
    if (requiresOnline && wakeConfig.onlineMode) {
      // Strip wake phrase prefix if present
      const cleanQuery = text.replace(/^jarvis,?\s*/i, "").replace(/^search\s+/i, "");
      dispatchOnlineQuery(cleanQuery);
      return;
    }

    // Otherwise, mock command execution
    addCommand({
      title: text,
      intent: text.toUpperCase().replace(/\s+/g, "_"),
      status: tier === 2 ? "pending_voice_auth" : "executed",
      tier: tier,
      category: requiresOnline ? "online" : tier === 1 ? "hardware" : "security",
    });
  };

  return (
    <View style={styles.container} testID="wakeword-screen">
      <TerminalHeader
        title="WAKE WORD ENGINE"
        subtitle={wakeConfig.engine}
        rightBadge={wakeConfig.onlineMode ? "ONLINE MODE ON" : "AIR-GAPPED ACTIVE"}
        onlineMode={wakeConfig.onlineMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Engine Status Card — PREVIEW SIMULATION vs REAL PORCUPINE */}
        <View
          style={[
            styles.engineStatusCard,
            engineStatus.mode === "NATIVE_PORCUPINE" && styles.engineStatusCardReady,
            wakePulse && styles.engineStatusCardPulse,
          ]}
          testID="engine-status-card"
        >
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={engineStatus.mode === "NATIVE_PORCUPINE" ? "chip" : "test-tube"}
                size={22}
                color={engineStatus.mode === "NATIVE_PORCUPINE" ? "#00FF66" : "#8AB4FF"}
              />
              <View style={styles.flexOne}>
                <Text style={styles.engineStatusTitle}>
                  {engineStatus.mode === "NATIVE_PORCUPINE"
                    ? "PORCUPINE ENGINE READY"
                    : "PREVIEW SIMULATION MODE"}
                </Text>
                <Text style={styles.engineStatusSubtitle}>
                  Wake word:{" "}
                  <Text style={styles.engineStatusHighlight}>
                    {engineStatus.keyword.toUpperCase()}
                  </Text>
                  {"  ·  "}
                  Key:{" "}
                  <Text style={styles.engineStatusHighlight}>
                    {engineStatus.accessKeyStatus}
                  </Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.triggerJarvisBtn}
              onPress={() => emitWakeWord()}
              testID="trigger-jarvis-btn"
            >
              <MaterialCommunityIcons name="access-point" size={14} color="#090D0B" />
              <Text style={styles.triggerJarvisText}>TRIGGER</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.engineStatusMsg}>{engineStatus.message}</Text>
          {engineStatus.accessKeyStatus === "PLACEHOLDER" && (
            <View style={styles.envHintBox} testID="env-hint-box">
              <MaterialCommunityIcons name="key-variant" size={12} color="#FFB800" />
              <Text style={styles.envHintText}>
                Swap 1 line in <Text style={styles.envHintCode}>/app/frontend/.env</Text> →{" "}
                <Text style={styles.envHintCode}>EXPO_PUBLIC_PORCUPINE_ACCESS_KEY</Text>. Guide:{" "}
                <Text style={styles.envHintCode}>/app/WAKE_WORD_SETUP.md</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Optional Online Mode Switch Card (Requirement #2) */}
        <View style={[styles.card, wakeConfig.onlineMode && styles.cardOnlineActive]} testID="online-mode-toggle-card">
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={wakeConfig.onlineMode ? "web" : "wifi-off"}
                size={22}
                color={wakeConfig.onlineMode ? "#FFB800" : "#00FF66"}
              />
              <Text style={styles.cardTitle}>Online Mode Switch</Text>
            </View>
            <Switch
              testID="online-mode-switch"
              value={wakeConfig.onlineMode}
              onValueChange={(val) => toggleOnlineMode(val)}
              trackColor={{ false: "#1A2821", true: "#FFB800" }}
              thumbColor={wakeConfig.onlineMode ? "#090D0B" : "#819C8F"}
            />
          </View>
          <Text style={styles.cardDesc}>
            {wakeConfig.onlineMode
              ? "ONLINE MODE ACTIVE: Internet queries, web search, and knowledge lookups are enabled. Voiceprint and local db remain strictly on-device."
              : "DEFAULT AIR-GAPPED: 100% offline. Zero network packets dispatched. Toggle ON in settings only when web search or meaning queries are explicitly needed."}
          </Text>
        </View>

        {/* Main Neural Listener Card */}
        <View style={styles.card} testID="listener-status-card">
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={isListening ? "ear-hearing" : "ear-hearing-off"}
                size={22}
                color={wakeConfig.isActive && isListening ? "#00FF66" : "#FF334B"}
              />
              <Text style={styles.cardTitle}>Background Listener Service</Text>
            </View>
            <Switch
              testID="wakeword-active-switch"
              value={wakeConfig.isActive && isListening}
              onValueChange={(val) => {
                updateWakeConfig({ isActive: val });
                if (!val && isListening) toggleListening();
                if (val && !isListening) toggleListening();
              }}
              trackColor={{ false: "#1A2821", true: "#00CC52" }}
              thumbColor={wakeConfig.isActive ? "#090D0B" : "#819C8F"}
            />
          </View>

          <Text style={styles.cardDesc}>
            Running continuously on low-power NPU. Wake word: <Text style={styles.highlight}>&quot;{wakeConfig.wakeWord}&quot;</Text>
          </Text>

          {/* Waveform visualizer simulation */}
          <View style={styles.waveformContainer} testID="waveform-visualizer">
            {[40, 65, 30, 85, 100, 50, 75, 45, 90, 60, 35, 70, 85, 40, 95, 55].map((val, idx) => (
              <View
                key={idx}
                style={[
                  styles.waveformBar,
                  {
                    height: isListening ? `${val}%` : "15%",
                    backgroundColor: isListening ? (idx % 2 === 0 ? "#00FF66" : "#00CC52") : "#1F382B",
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>MODEL SIZE</Text>
              <Text style={styles.metricValue}>{wakeConfig.modelSizeMB} MB</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SENSITIVITY</Text>
              <Text style={styles.metricValue}>{wakeConfig.sensitivity * 100}%</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>NETWORK</Text>
              <Text style={[styles.metricValue, { color: wakeConfig.onlineMode ? "#FFB800" : "#00FF66" }]}>
                {wakeConfig.onlineMode ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Simulation Trigger Box */}
        <View style={styles.card} testID="simulation-card">
          <Text style={styles.sectionTitle}>SIMULATE OFFLINE & ONLINE TRIGGERS</Text>
          <Text style={styles.cardDesc}>Test hardware toggles or online web search (requires Online Mode ON).</Text>

          <View style={styles.triggerButtonRow}>
            <TouchableOpacity
              style={styles.triggerBtnPrimary}
              onPress={() => handleSimulateTrigger("Jarvis, turn on flashlight", 1, false)}
              testID="sim-tier1-btn"
            >
              <MaterialCommunityIcons name="flash" size={16} color="#090D0B" />
              <Text style={styles.triggerBtnTextPrimary}>Tier 1: Flashlight</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.triggerBtnSecondary, wakeConfig.onlineMode && styles.triggerBtnOnline]}
              onPress={() => handleSimulateTrigger("Jarvis, search quantum computing", 2, true)}
              testID="sim-online-search-btn"
            >
              <MaterialCommunityIcons name="web" size={16} color={wakeConfig.onlineMode ? "#FFB800" : "#00FF66"} />
              <Text style={[styles.triggerBtnTextSecondary, wakeConfig.onlineMode && styles.triggerBtnTextOnline]}>
                {wakeConfig.onlineMode ? "Online Search" : "Search (Locked Offline)"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Or type custom offline/online query..."
              placeholderTextColor="#819C8F"
              value={testCommandInput}
              onChangeText={setTestCommandInput}
              testID="custom-command-input"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => {
                if (!testCommandInput.trim()) return;
                const isOnlineQuery = testCommandInput.toLowerCase().includes("search") || testCommandInput.toLowerCase().includes("meaning") || testCommandInput.toLowerCase().includes("wiki");
                handleSimulateTrigger(testCommandInput, isOnlineQuery ? 2 : 1, isOnlineQuery);
                setTestCommandInput("");
              }}
              testID="custom-command-submit"
            >
              <MaterialCommunityIcons name="send" size={16} color="#090D0B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Triggers Log */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>RECENT WAKE-WORD LOGS</Text>
          {simulatedTriggers.map((tr) => (
            <View key={tr.id} style={styles.logItem} testID={`wake-log-${tr.id}`}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="waveform" size={14} color="#00FF66" />
                <Text style={styles.logText}>{tr.text}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.confText}>{tr.confidence}%</Text>
                <Text style={styles.timeText}>{tr.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Online Query Result Modal */}
      <Modal
        visible={queryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQueryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.queryModal} testID="online-query-result-modal">
            <View style={styles.queryModalHeader}>
              <MaterialCommunityIcons name="web" size={20} color="#FFB800" />
              <Text style={styles.queryModalTitle}>ONLINE QUERY CHANNEL</Text>
              <TouchableOpacity onPress={() => setQueryModalVisible(false)} testID="close-query-modal">
                <MaterialCommunityIcons name="close" size={20} color="#819C8F" />
              </TouchableOpacity>
            </View>

            <View style={styles.queryTypePill}>
              <Text style={styles.queryTypePillText}>
                {queryResult?.type?.toUpperCase() || "SEARCH"}
              </Text>
            </View>

            <Text style={styles.queryQ} testID="online-query-question">
              {queryResult?.query}
            </Text>

            {queryLoading ? (
              <View style={styles.queryLoadingBox} testID="online-query-loading">
                <ActivityIndicator size="small" color="#FFB800" />
                <Text style={styles.queryLoadingText}>
                  Dispatching to Gemini 3 Flash via Online Channel...
                </Text>
              </View>
            ) : queryError ? (
              <View style={styles.queryErrorBox} testID="online-query-error">
                <MaterialCommunityIcons name="alert-circle" size={16} color="#FF334B" />
                <Text style={styles.queryErrorText}>{queryError}</Text>
              </View>
            ) : (
              <ScrollView style={styles.queryAnswerScroll} testID="online-query-answer">
                <Text style={styles.queryAnswerText}>{queryResult?.answer}</Text>
              </ScrollView>
            )}

            <View style={styles.queryFooter}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#00FF66" />
              <Text style={styles.queryFooterText}>
                Voiceprint & local DB stayed offline. Only this query was dispatched.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.queryCloseBtn}
              onPress={() => setQueryModalVisible(false)}
              testID="dismiss-query-modal"
            >
              <Text style={styles.queryCloseBtnText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D0B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#111A16",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F382B",
    padding: 16,
    gap: 12,
  },
  engineStatusCard: {
    backgroundColor: "#0F1520",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8AB4FF",
    padding: 16,
    gap: 10,
  },
  engineStatusCardReady: {
    borderColor: "#00FF66",
    backgroundColor: "#0E1A13",
  },
  engineStatusCardPulse: {
    borderColor: "#00FF66",
    backgroundColor: "#14261C",
  },
  engineStatusTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#E2ECE7",
    letterSpacing: 0.5,
  },
  engineStatusSubtitle: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    marginTop: 3,
  },
  engineStatusHighlight: {
    color: "#8AB4FF",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  engineStatusMsg: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#A2B8AE",
    lineHeight: 16,
  },
  triggerJarvisBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#8AB4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  triggerJarvisText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 11,
    color: "#090D0B",
    letterSpacing: 1,
  },
  envHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#2B2211",
    borderWidth: 1,
    borderColor: "#FFB800",
    padding: 8,
    borderRadius: 6,
  },
  envHintText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: "#FFB800",
    flex: 1,
    lineHeight: 14,
  },
  envHintCode: {
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#E2ECE7",
  },
  flexOne: { flex: 1 },
  cardOnlineActive: {
    borderColor: "#FFB800",
    backgroundColor: "#1A221C",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "#E2ECE7",
  },
  cardDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#A2B8AE",
    lineHeight: 18,
  },
  highlight: {
    color: "#00FF66",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  waveformContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#090D0B",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
  },
  metricGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#1A2821",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: "#819C8F",
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#00FF66",
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#E2ECE7",
    letterSpacing: 0.5,
  },
  triggerButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  triggerBtnPrimary: {
    flex: 1,
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  triggerBtnTextPrimary: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
  },
  triggerBtnSecondary: {
    flex: 1,
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  triggerBtnOnline: {
    borderColor: "#FFB800",
    backgroundColor: "#2B2211",
  },
  triggerBtnTextSecondary: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#00FF66",
  },
  triggerBtnTextOnline: {
    color: "#FFB800",
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#E2ECE7",
  },
  sendBtn: {
    backgroundColor: "#00FF66",
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#090D0B",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  logText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#E2ECE7",
  },
  confText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
    color: "#00FF66",
    marginRight: 8,
  },
  timeText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 13, 11, 0.85)",
    justifyContent: "center",
    padding: 20,
  },
  queryModal: {
    backgroundColor: "#111A16",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFB800",
    padding: 18,
    gap: 12,
    maxHeight: "80%",
  },
  queryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  queryModalTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#FFB800",
    letterSpacing: 0.5,
    flex: 1,
  },
  queryTypePill: {
    alignSelf: "flex-start",
    backgroundColor: "#2B2211",
    borderWidth: 1,
    borderColor: "#FFB800",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  queryTypePillText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 10,
    color: "#FFB800",
    letterSpacing: 1,
  },
  queryQ: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#E2ECE7",
    lineHeight: 20,
  },
  queryLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#090D0B",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2B2211",
  },
  queryLoadingText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#FFB800",
    flex: 1,
  },
  queryErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2A1216",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF334B",
  },
  queryErrorText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#FF334B",
    flex: 1,
  },
  queryAnswerScroll: {
    maxHeight: 260,
    backgroundColor: "#090D0B",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  queryAnswerText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#E2ECE7",
    lineHeight: 20,
  },
  queryFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
    padding: 8,
    borderRadius: 6,
  },
  queryFooterText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: "#00FF66",
    flex: 1,
  },
  queryCloseBtn: {
    backgroundColor: "#FFB800",
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  queryCloseBtnText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
    letterSpacing: 1,
  },
});

