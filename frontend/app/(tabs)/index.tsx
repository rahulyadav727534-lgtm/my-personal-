import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";

export default function WakeWordScreen() {
  const { wakeConfig, updateWakeConfig, isListening, toggleListening, addCommand } = useApp();
  const [testCommandInput, setTestCommandInput] = useState("");
  const [simulatedTriggers, setSimulatedTriggers] = useState([
    { id: "tr_1", time: "11:42:10 AM", confidence: 99.1, text: "Hey Assistant, stop alarm" },
    { id: "tr_2", time: "10:15:02 AM", confidence: 97.8, text: "Hey Assistant, unlock tier two" },
  ]);

  const handleSimulateTrigger = (text: string, tier: 1 | 2) => {
    addCommand({
      title: text,
      intent: text.toUpperCase().replace(/\s+/g, "_"),
      status: tier === 2 ? "pending_voice_auth" : "executed",
      tier: tier,
      category: tier === 1 ? "hardware" : "security",
    });
    setSimulatedTriggers((prev) => [
      {
        id: `tr_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        confidence: Number((95 + Math.random() * 4.9).toFixed(1)),
        text,
      },
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <View style={styles.container} testID="wakeword-screen">
      <TerminalHeader
        title="WAKE WORD ENGINE"
        subtitle={wakeConfig.engine}
        rightBadge={wakeConfig.isActive ? "AIR-GAPPED ACTIVE" : "PAUSED"}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            Running continuously on low-power NPU. Zero network packets dispatched. Wake word: <Text style={styles.highlight}>&quot;{wakeConfig.wakeWord}&quot;</Text>
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
              <Text style={styles.metricLabel}>BATTERY LOAD</Text>
              <Text style={styles.metricValue}>0.2%/h</Text>
            </View>
          </View>
        </View>

        {/* Sensitivity & Configuration */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ENGINE PARAMETERS</Text>
          
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Active Wake Word</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{wakeConfig.wakeWord}</Text>
            </View>
          </View>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>False Positive Filter</Text>
            <Text style={styles.paramValue}>Strict (Quantized NPU)</Text>
          </View>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Lock-Screen Listening</Text>
            <Text style={[styles.paramValue, { color: "#00FF66" }]}>ENABLED (Tier 1)</Text>
          </View>
        </View>

        {/* Live Simulation Trigger Box */}
        <View style={styles.card} testID="simulation-card">
          <Text style={styles.sectionTitle}>SIMULATE OFFLINE VOICE TRIGGER</Text>
          <Text style={styles.cardDesc}>Test wake-word activation and automatic NLU parsing instantly.</Text>

          <View style={styles.triggerButtonRow}>
            <TouchableOpacity
              style={styles.triggerBtnPrimary}
              onPress={() => handleSimulateTrigger("Hey Assistant, turn on flashlight", 1)}
              testID="sim-tier1-btn"
            >
              <MaterialCommunityIcons name="flash" size={16} color="#090D0B" />
              <Text style={styles.triggerBtnTextPrimary}>Tier 1: Flashlight</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.triggerBtnSecondary}
              onPress={() => handleSimulateTrigger("Hey Assistant, read latest messages", 2)}
              testID="sim-tier2-btn"
            >
              <MaterialCommunityIcons name="shield-lock" size={16} color="#00FF66" />
              <Text style={styles.triggerBtnTextSecondary}>Tier 2: Read SMS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Or type custom offline command..."
              placeholderTextColor="#819C8F"
              value={testCommandInput}
              onChangeText={setTestCommandInput}
              testID="custom-command-input"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => {
                if (!testCommandInput.trim()) return;
                handleSimulateTrigger(testCommandInput, testCommandInput.toLowerCase().includes("sms") || testCommandInput.toLowerCase().includes("camera") ? 2 : 1);
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
          <Text style={styles.sectionTitle}>RECENT WAKE-WORD LOGS (LOCAL NPU)</Text>
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
  paramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  paramLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#A2B8AE",
  },
  paramValue: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#E2ECE7",
  },
  tagBadge: {
    backgroundColor: "#1A2821",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00FF66",
  },
  tagText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
    color: "#00FF66",
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
  triggerBtnTextSecondary: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#00FF66",
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
});
