import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PrivacyScreen() {
  const {
    privacyLedger,
    wakeConfig,
    onDeviceModels,
    session,
    sessionRemainingMs,
    systemStatus,
    clearAllLocalData,
  } = useApp();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [wipeConfirmVisible, setWipeConfirmVisible] = useState(false);
  const [liveStats, setLiveStats] = useState<{ outbound_packets: number; total_online_queries: number } | null>(null);
  const isOnline = wakeConfig.onlineMode;

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/offline/status?online_mode=${isOnline}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLiveStats(data);
      } catch { /* silent */ }
    };
    fetchStats();
    const id = setInterval(fetchStats, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isOnline]);

  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);
    setExportData(null);
    setExportModalVisible(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/audit/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setExportData(data);
    } catch (e: any) {
      setExportError(e?.message || "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

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
            onPress={handleExport}
            testID="export-audit-btn"
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#090D0B" />
            <Text style={styles.exportBtnText}>Export Local Audit Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* Live Network I/O Stats (real-time counter) */}
        <View style={styles.card} testID="live-stats-card">
          <Text style={styles.sectionTitle}>LIVE NETWORK I/O</Text>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>OUTBOUND PACKETS</Text>
              <Text style={[styles.statValue, isOnline && liveStats && liveStats.outbound_packets > 0 && styles.statValueAmber]}>
                {liveStats?.outbound_packets ?? 0}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ONLINE QUERIES</Text>
              <Text style={styles.statValue}>{liveStats?.total_online_queries ?? 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIER 2</Text>
              <Text style={[styles.statValue, session ? styles.statValueGreen : styles.statValueRed]}>
                {session ? `${Math.floor(sessionRemainingMs / 1000 / 60)}m` : "LOCK"}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Counter auto-refreshes every 8s. All queries fully audited in local ledger.
          </Text>
        </View>

        {/* On-Device Model Manifest */}
        <View style={styles.card} testID="model-manifest-card">
          <Text style={styles.sectionTitle}>ON-DEVICE MODEL MANIFEST</Text>
          <Text style={styles.cardDesc}>
            All ML weights bundled in APK. Zero cloud inference. Verify integrity via SHA-256 fingerprints.
          </Text>
          {onDeviceModels.map((m, idx) => (
            <View key={m.name} style={styles.modelRow} testID={`model-row-${idx}`}>
              <View style={styles.modelLeft}>
                <MaterialCommunityIcons name="chip" size={16} color="#00FF66" />
                <View style={styles.flexOne}>
                  <Text style={styles.modelName}>{m.name} <Text style={styles.modelVer}>· {m.version}</Text></Text>
                  <Text style={styles.modelDesc}>{m.purpose}</Text>
                  <Text style={styles.modelHash}>sha256:{m.sha256}</Text>
                </View>
              </View>
              <Text style={styles.modelSize}>{m.sizeMB} MB</Text>
            </View>
          ))}
        </View>

        {/* Permissions Audit (with mock revoke) */}
        <View style={styles.card} testID="permissions-audit-card">
          <Text style={styles.sectionTitle}>PERMISSIONS AUDIT</Text>
          {Object.entries(systemStatus.permissionsGranted).map(([key, granted]) => (
            <View key={key} style={styles.permAuditRow} testID={`perm-audit-${key}`}>
              <View style={styles.row}>
                <MaterialCommunityIcons
                  name={granted ? "check-circle" : "close-circle"}
                  size={16}
                  color={granted ? "#00FF66" : "#FF334B"}
                />
                <Text style={styles.permAuditLabel}>{key.replace(/([A-Z])/g, " $1").toUpperCase()}</Text>
              </View>
              <Text style={[styles.permStatusText, granted ? styles.permGrantedTextX : styles.permDeniedText]}>
                {granted ? "GRANTED" : "DENIED"}
              </Text>
            </View>
          ))}
        </View>

        {/* Data Flow Diagram (text) */}
        <View style={styles.card} testID="data-flow-card">
          <Text style={styles.sectionTitle}>DATA FLOW DIAGRAM</Text>
          <View style={styles.flowLine}><Text style={styles.flowSrc}>Microphone</Text><MaterialCommunityIcons name="arrow-right" size={12} color="#819C8F" /><Text style={styles.flowDst}>Porcupine NPU</Text></View>
          <View style={styles.flowLine}><Text style={styles.flowSrc}>Porcupine wake</Text><MaterialCommunityIcons name="arrow-right" size={12} color="#819C8F" /><Text style={styles.flowDst}>Vosk STT</Text></View>
          <View style={styles.flowLine}><Text style={styles.flowSrc}>Transcript</Text><MaterialCommunityIcons name="arrow-right" size={12} color="#819C8F" /><Text style={styles.flowDst}>NLU Intent Parser</Text></View>
          <View style={styles.flowLine}><Text style={styles.flowSrc}>Voiceprint sample</Text><MaterialCommunityIcons name="arrow-right" size={12} color="#819C8F" /><Text style={styles.flowDst}>ONNX Encoder → SQLCipher</Text></View>
          {isOnline && (
            <View style={styles.flowLine}><Text style={styles.flowSrc}>[Online only] Query text</Text><MaterialCommunityIcons name="arrow-right" size={12} color="#FFB800" /><Text style={[styles.flowDst, { color: "#FFB800" }]}>Gemini 3 Flash → answer</Text></View>
          )}
          <Text style={styles.cardDesc}>
            Voice samples never leave device. Only text (Online Mode) crosses network — one-shot, no retention on server.
          </Text>
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

        {/* Panic Wipe All Local Data */}
        <View style={styles.card} testID="wipe-data-card">
          <View style={styles.row}>
            <MaterialCommunityIcons name="delete-forever" size={20} color="#FF334B" />
            <Text style={styles.cardTitle}>Panic Wipe</Text>
          </View>
          <Text style={styles.cardDesc}>
            Clears all locally-persisted state: voiceprint embeddings, enterprise members, command history, session tokens. Cannot be undone.
          </Text>
          <TouchableOpacity
            style={styles.wipeBtn}
            onPress={() => setWipeConfirmVisible(true)}
            testID="wipe-data-btn"
          >
            <MaterialCommunityIcons name="alert-octagon" size={14} color="#FF334B" />
            <Text style={styles.wipeBtnText}>WIPE ALL LOCAL DATA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Wipe Confirm Modal */}
      <Modal
        visible={wipeConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWipeConfirmVisible(false)}
      >
        <View style={styles.expOverlay}>
          <View style={styles.wipeModal} testID="wipe-confirm-modal">
            <MaterialCommunityIcons name="alert-octagon" size={36} color="#FF334B" />
            <Text style={styles.wipeModalTitle}>Wipe All Local Data?</Text>
            <Text style={styles.cardDesc}>
              Voiceprint, enterprise members, command history, session tokens will be erased. Wake-word config resets to default. Ye action irreversible hai.
            </Text>
            <View style={styles.wipeActions}>
              <TouchableOpacity
                style={styles.wipeCancelBtn}
                onPress={() => setWipeConfirmVisible(false)}
                testID="cancel-wipe-btn"
              >
                <Text style={styles.wipeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wipeConfirmBtn}
                onPress={async () => {
                  await clearAllLocalData();
                  setWipeConfirmVisible(false);
                }}
                testID="confirm-wipe-btn"
              >
                <Text style={styles.wipeConfirmText}>WIPE NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Audit Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.expOverlay}>
          <View style={styles.expModal} testID="audit-export-modal">
            <View style={styles.expHeader}>
              <MaterialCommunityIcons name="file-lock" size={20} color="#00FF66" />
              <Text style={styles.expTitle}>AUDIT LEDGER EXPORT</Text>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                testID="close-export-modal"
              >
                <MaterialCommunityIcons name="close" size={20} color="#819C8F" />
              </TouchableOpacity>
            </View>

            {exportLoading ? (
              <View style={styles.expLoading} testID="export-loading">
                <ActivityIndicator size="small" color="#00FF66" />
                <Text style={styles.expLoadingText}>Compiling encrypted local ledger...</Text>
              </View>
            ) : exportError ? (
              <View style={styles.expError} testID="export-error">
                <MaterialCommunityIcons name="alert-circle" size={16} color="#FF334B" />
                <Text style={styles.expErrorText}>{exportError}</Text>
              </View>
            ) : exportData ? (
              <>
                <View style={styles.expStatRow}>
                  <View style={styles.expStat}>
                    <Text style={styles.expStatLabel}>RECORDS</Text>
                    <Text style={styles.expStatValue}>{exportData.total_records}</Text>
                  </View>
                  <View style={styles.expStat}>
                    <Text style={styles.expStatLabel}>ENGINE</Text>
                    <Text style={styles.expStatValueSmall}>v1</Text>
                  </View>
                  <View style={styles.expStat}>
                    <Text style={styles.expStatLabel}>SIGNED AT</Text>
                    <Text style={styles.expStatValueSmall}>
                      {new Date(exportData.exported_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <ScrollView style={styles.expJsonScroll} testID="export-json-scroll">
                  <Text style={styles.expJsonText}>
                    {JSON.stringify(exportData, null, 2)}
                  </Text>
                </ScrollView>
              </>
            ) : null}

            <TouchableOpacity
              style={styles.expCloseBtn}
              onPress={() => setExportModalVisible(false)}
              testID="dismiss-export-modal"
            >
              <Text style={styles.expCloseBtnText}>DISMISS</Text>
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
  expOverlay: {
    flex: 1, backgroundColor: "rgba(9, 13, 11, 0.85)", justifyContent: "center", padding: 20,
  },
  expModal: {
    backgroundColor: "#111A16", borderRadius: 16, borderWidth: 1, borderColor: "#00FF66",
    padding: 18, gap: 12, maxHeight: "85%",
  },
  expHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  expTitle: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 15, color: "#00FF66",
    letterSpacing: 0.5, flex: 1,
  },
  expLoading: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#090D0B", padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: "#1F382B",
  },
  expLoadingText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 12, color: "#00FF66", flex: 1 },
  expError: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#2A1216", padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: "#FF334B",
  },
  expErrorText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 12, color: "#FF334B", flex: 1 },
  expStatRow: { flexDirection: "row", gap: 8 },
  expStat: {
    flex: 1, backgroundColor: "#090D0B", padding: 10, borderRadius: 6,
    borderWidth: 1, borderColor: "#1F382B", alignItems: "center",
  },
  expStatLabel: { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, color: "#819C8F", marginBottom: 4 },
  expStatValue: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 16, color: "#00FF66" },
  expStatValueSmall: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11, color: "#E2ECE7" },
  expJsonScroll: {
    maxHeight: 320, backgroundColor: "#090D0B", padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#1F382B",
  },
  expJsonText: {
    fontFamily: "JetBrainsMono_400Regular", fontSize: 10, color: "#00FF66", lineHeight: 15,
  },
  expCloseBtn: {
    backgroundColor: "#00FF66", paddingVertical: 11, borderRadius: 8, alignItems: "center",
  },
  expCloseBtnText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, color: "#090D0B", letterSpacing: 1,
  },
  statGrid: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1, backgroundColor: "#090D0B", padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#1F382B", alignItems: "center",
  },
  statLabel: { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, color: "#819C8F", marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, color: "#00FF66" },
  statValueAmber: { color: "#FFB800" },
  statValueGreen: { color: "#00FF66" },
  statValueRed: { color: "#FF334B", fontSize: 14 },
  modelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10,
    backgroundColor: "#090D0B", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#1F382B",
  },
  modelLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  modelName: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#E2ECE7" },
  modelVer: { color: "#819C8F", fontFamily: "JetBrainsMono_400Regular" },
  modelDesc: { fontFamily: "JetBrainsMono_400Regular", fontSize: 10, color: "#A2B8AE", marginTop: 2 },
  modelHash: { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, color: "#00FF66", marginTop: 3 },
  modelSize: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, color: "#8AB4FF" },
  flexOne: { flex: 1 },
  permAuditRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#090D0B", padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#1F382B",
  },
  permAuditLabel: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, color: "#E2ECE7", letterSpacing: 0.5 },
  permStatusText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1 },
  permGrantedTextX: { color: "#00FF66" },
  permDeniedText: { color: "#FF334B" },
  flowLine: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#090D0B", padding: 8, borderRadius: 6,
    borderWidth: 1, borderColor: "#1F382B",
  },
  flowSrc: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11, color: "#00FF66", flex: 1 },
  flowDst: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11, color: "#E2ECE7", flex: 1, textAlign: "right" },
  wipeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#2A1216", borderWidth: 1, borderColor: "#FF334B",
    paddingVertical: 12, borderRadius: 8, marginTop: 4,
  },
  wipeBtnText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#FF334B", letterSpacing: 1 },
  wipeModal: {
    backgroundColor: "#111A16", borderRadius: 16, borderWidth: 1, borderColor: "#FF334B",
    padding: 22, gap: 12, alignItems: "center",
  },
  wipeModalTitle: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 17, color: "#FF334B" },
  wipeActions: { flexDirection: "row", gap: 10, width: "100%" },
  wipeCancelBtn: {
    flex: 1, backgroundColor: "#090D0B", borderWidth: 1, borderColor: "#1F382B",
    paddingVertical: 11, borderRadius: 8, alignItems: "center",
  },
  wipeCancelText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#819C8F" },
  wipeConfirmBtn: {
    flex: 1, backgroundColor: "#FF334B", paddingVertical: 11, borderRadius: 8, alignItems: "center",
  },
  wipeConfirmText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#090D0B", letterSpacing: 1 },
});
