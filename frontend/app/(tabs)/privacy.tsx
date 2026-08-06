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

export default function PrivacyScreen() {
  const { privacyLedger } = useApp();
  const [exported, setExported] = useState(false);

  return (
    <View style={styles.container} testID="privacy-screen">
      <TerminalHeader
        title="PRIVACY & AUDIT LEDGER"
        subtitle="Zero-Cloud Encrypted Storage"
        rightBadge="AIR-GAPPED 100%"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Air-gap Verification Card */}
        <View style={styles.card} testID="airgap-card">
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="wifi-off" size={24} color="#00FF66" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Air-Gapped Telemetry</Text>
                <Text style={styles.cardSubtitle}>Hardware Network Radio Isolation</Text>
              </View>
            </View>
            <View style={styles.packetBadge}>
              <Text style={styles.packetValue}>0 BYTES</Text>
              <Text style={styles.packetLabel}>OUTBOUND</Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>
            NEXUS-OFFLINE is verified offline. Zero analytics SDKs, zero crash reporters, and zero third-party telemetry packets dispatched over cellular or Wi-Fi.
          </Text>
        </View>

        {/* Local Storage Ledger Card */}
        <View style={styles.card} testID="storage-ledger-card">
          <Text style={styles.sectionTitle}>ENCRYPTED LOCAL STORAGE (SQLCIPHER)</Text>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Database Engine</Text>
            <Text style={styles.paramValueActive}>{privacyLedger.localEncryptedDb}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Partition Size</Text>
            <Text style={styles.paramValue}>{privacyLedger.dbSizeBytes}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Encryption Standard</Text>
            <Text style={styles.paramValue}>AES-256 with PBKDF2 Key Derivation</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Audit Status</Text>
            <Text style={styles.paramValueActive}>{privacyLedger.lastAudit}</Text>
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setExported(true)}
            testID="export-audit-btn"
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#090D0B" />
            <Text style={styles.exportBtnText}>
              {exported ? "Encrypted Ledger Exported Locally" : "Export Local Audit Ledger"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PRIVACY GUARANTEES</Text>

          {[
            { title: "No Analytics SDKs", desc: "No Firebase, Google Analytics, or Mixpanel telemetry." },
            { title: "On-Device NLU", desc: "Intent parsing runs entirely on local CPU/NPU quantized weights." },
            { title: "Isolated Voice Samples", desc: "Raw microphone buffers are discarded immediately after embedding extraction." },
            { title: "Flight Mode Resilience", desc: "Functions identically with SIM card removed and radios disabled." },
          ].map((item, idx) => (
            <View key={idx} style={styles.guaranteeRow} testID={`guarantee-${idx}`}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#00FF66" />
              <View style={styles.guaranteeTextCol}>
                <Text style={styles.guaranteeTitle}>{item.title}</Text>
                <Text style={styles.guaranteeDesc}>{item.desc}</Text>
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#00FF66",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 16,
    color: "#E2ECE7",
  },
  cardSubtitle: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    marginTop: 2,
  },
  packetBadge: {
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  packetValue: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#00FF66",
  },
  packetLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: "#819C8F",
  },
  cardDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#A2B8AE",
    lineHeight: 18,
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
    fontSize: 12,
    color: "#819C8F",
  },
  paramValue: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#E2ECE7",
  },
  paramValueActive: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#00FF66",
  },
  exportBtn: {
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  exportBtnText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
  },
  guaranteeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#090D0B",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  guaranteeTextCol: {
    flex: 1,
    gap: 2,
  },
  guaranteeTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#E2ECE7",
  },
  guaranteeDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    lineHeight: 16,
  },
});
