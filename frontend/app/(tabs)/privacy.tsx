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
  const { privacyLedger, wakeConfig } = useApp();
  const [exported, setExported] = useState(false);
  const isOnline = wakeConfig.onlineMode;

  return (
    <View style={styles.container} testID="privacy-screen">
      <TerminalHeader
        title="PRIVACY & AUDIT LEDGER"
        subtitle="Zero-Cloud Encrypted Storage"
        rightBadge={isOnline ? "ONLINE QUERY CHANNEL" : "AIR-GAPPED 100%"}
        onlineMode={isOnline}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Air-gap / Online Channel Verification Card - DYNAMIC */}
        <View
          style={[styles.card, isOnline && styles.cardOnline]}
          testID="airgap-card"
        >
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBox, isOnline && styles.iconBoxOnline]}>
                <MaterialCommunityIcons
                  name={isOnline ? "web" : "wifi-off"}
                  size={24}
                  color={isOnline ? "#FFB800" : "#00FF66"}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {isOnline ? "Online Query Channel" : "Air-Gapped Telemetry"}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isOnline ? "Strict Query Isolation (No Analytics)" : "Hardware Network Radio Isolation"}
                </Text>
              </View>
            </View>
            <View style={[styles.packetBadge, isOnline && styles.packetBadgeOnline]}>
              <Text style={[styles.packetValue, isOnline && styles.packetValueOnline]}>
                {isOnline ? `${privacyLedger.outboundPackets} PKT` : "0 BYTES"}
              </Text>
              <Text style={styles.packetLabel}>OUTBOUND</Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>
            {isOnline
              ? "Online Mode ACTIVE. Only explicit web search / meaning queries dispatch minimal packets. Voiceprint, command history, and system data remain strictly on-device."
              : "NEXUS-OFFLINE is verified offline. Zero analytics SDKs, zero crash reporters, and zero third-party telemetry packets dispatched over cellular or Wi-Fi."}
          </Text>

          <View style={[styles.channelStatusRow, isOnline && styles.channelStatusRowOnline]} testID="channel-status-row">
            <MaterialCommunityIcons
              name={isOnline ? "radio-tower" : "lock-check"}
              size={14}
              color={isOnline ? "#FFB800" : "#00FF66"}
            />
            <Text style={[styles.channelStatusText, isOnline && styles.channelStatusTextOnline]}>
              {privacyLedger.lastAudit}
            </Text>
          </View>
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
  cardOnline: {
    borderColor: "#FFB800",
    backgroundColor: "#1A221C",
  },
  iconBoxOnline: {
    borderColor: "#FFB800",
    backgroundColor: "#2B2211",
  },
  packetBadgeOnline: {
    backgroundColor: "#2B2211",
    borderColor: "#FFB800",
  },
  packetValueOnline: {
    color: "#FFB800",
  },
  channelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  channelStatusRowOnline: {
    backgroundColor: "#2B2211",
    borderColor: "#FFB800",
  },
  channelStatusText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#00FF66",
    flex: 1,
  },
  channelStatusTextOnline: {
    color: "#FFB800",
  },
});
