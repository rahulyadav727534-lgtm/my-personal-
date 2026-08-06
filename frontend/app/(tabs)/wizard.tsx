import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";

export default function WizardScreen() {
  const { systemStatus, updateSystemStatus } = useApp();
  const [batteryWhitelisted, setBatteryWhitelisted] = useState(systemStatus.batteryUnrestricted);
  const [nluDownloaded, setNluDownloaded] = useState(systemStatus.offlineNluLoaded);

  const toggleBattery = () => {
    const val = !batteryWhitelisted;
    setBatteryWhitelisted(val);
    updateSystemStatus({ batteryUnrestricted: val });
  };

  const downloadNlu = () => {
    setNluDownloaded(true);
    updateSystemStatus({ offlineNluLoaded: true });
  };

  return (
    <View style={styles.container} testID="wizard-screen">
      <TerminalHeader
        title="SYSTEM SETUP WIZARD"
        subtitle="Battery Bypass & Offline NPU Config"
        rightBadge="READY"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Battery Optimization Bypass */}
        <View style={styles.card} testID="battery-wizard-card">
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.stepIconBox, batteryWhitelisted && styles.stepIconBoxActive]}>
                <MaterialCommunityIcons
                  name="battery-charging-high"
                  size={20}
                  color={batteryWhitelisted ? "#00FF66" : "#819C8F"}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>Battery Unrestricted Mode</Text>
                <Text style={styles.cardSubtitle}>Required for 24/7 background wake-word listening</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionToggleBtn, batteryWhitelisted && styles.actionToggleBtnActive]}
              onPress={toggleBattery}
              testID="toggle-battery-btn"
            >
              <Text style={[styles.actionToggleText, batteryWhitelisted && styles.actionToggleTextActive]}>
                {batteryWhitelisted ? "WHITELISTED" : "BYPASS OS"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDesc}>
            Android OS aggressive doze mode can kill background background listeners. Whitelisting NEXUS-OFFLINE ensures uninterrupted offline acoustic monitoring.
          </Text>
        </View>

        {/* Step 2: Offline NLU Model Weights */}
        <View style={styles.card} testID="nlu-wizard-card">
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.stepIconBox, nluDownloaded && styles.stepIconBoxActive]}>
                <MaterialCommunityIcons
                  name="download-box"
                  size={20}
                  color={nluDownloaded ? "#00FF66" : "#819C8F"}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>Offline NLU Model Pack</Text>
                <Text style={styles.cardSubtitle}>Vosk Quantized Small (18.4 MB)</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionToggleBtn, nluDownloaded && styles.actionToggleBtnActive]}
              onPress={downloadNlu}
              testID="download-nlu-btn"
            >
              <Text style={[styles.actionToggleText, nluDownloaded && styles.actionToggleTextActive]}>
                {nluDownloaded ? "INSTALLED" : "DOWNLOAD"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDesc}>
            Embeds rule-based intent matching and phonetic keyword tables directly into secure local flash memory.
          </Text>
        </View>

        {/* Step 3: Permissions Checklist */}
        <View style={styles.card} testID="permissions-checklist-card">
          <Text style={styles.sectionTitle}>MINIMAL PERMISSIONS AUDIT</Text>

          {[
            { key: "microphone", label: "Microphone (Acoustic Wake Word)", granted: true },
            { key: "phoneCalls", label: "Phone State (Tier 1 Call Control)", granted: true },
            { key: "camera", label: "Camera (Tier 2 Secure Capture)", granted: true },
            { key: "systemSettings", label: "System Settings (Hardware Toggles)", granted: true },
          ].map((perm) => (
            <View key={perm.key} style={styles.permRow} testID={`perm-item-${perm.key}`}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#00FF66" />
                <Text style={styles.permLabel}>{perm.label}</Text>
              </View>
              <Text style={styles.permGrantedText}>GRANTED</Text>
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconBoxActive: {
    borderColor: "#00FF66",
    backgroundColor: "#1A2821",
  },
  cardTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#E2ECE7",
  },
  cardSubtitle: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    marginTop: 2,
  },
  cardDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#A2B8AE",
    lineHeight: 18,
  },
  actionToggleBtn: {
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionToggleBtnActive: {
    backgroundColor: "#1A2821",
    borderColor: "#00FF66",
  },
  actionToggleText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 11,
    color: "#819C8F",
  },
  actionToggleTextActive: {
    color: "#00FF66",
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#E2ECE7",
    letterSpacing: 0.5,
  },
  permRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#090D0B",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  permLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#E2ECE7",
  },
  permGrantedText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 11,
    color: "#00FF66",
  },
});
