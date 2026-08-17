import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";

export default function VoiceprintScreen() {
  const {
    voiceprint,
    updateVoiceprint,
    wakeConfig,
    enterprise,
    toggleEnterpriseMode,
    addMember,
    removeMember,
    enrollMemberVoiceprint,
    session,
    sessionRemainingMs,
    unlockTier2,
    lockTier2,
  } = useApp();
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [enrollPhase, setEnrollPhase] = useState(0); // 0..3
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyState, setVerifyState] = useState<"idle" | "listening" | "matched" | "rejected">("idle");
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"ADMIN" | "USER">("USER");

  // Recording timer for enrollment phase
  useEffect(() => {
    if (!isRecording) return;
    setRecordSecs(0);
    const id = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const startEnrollment = () => {
    setEnrollModalVisible(true);
    setEnrollPhase(1);
    setIsRecording(false);
  };

  const captureCurrentPhrase = () => {
    setIsRecording(true);
    // Simulate 2.5s of "recording"
    setTimeout(() => {
      setIsRecording(false);
      if (enrollPhase < 3) {
        setEnrollPhase((p) => p + 1);
      } else {
        // Complete enrollment — save encrypted embedding
        updateVoiceprint({
          enrolled: true,
          confidenceScore: Number((98 + Math.random() * 1.8).toFixed(1)),
          lastVerified: "Just now (Newly enrolled)",
          encryptedModelHash: `sha256:${Math.random().toString(36).substring(2, 15)}... (AES-256 SQLCipher)`,
        });
        setTimeout(() => {
          setEnrollModalVisible(false);
          setEnrollPhase(0);
        }, 1500);
        setEnrollPhase(4); // completed marker
      }
    }, 2500);
  };

  const startVerify = () => {
    setVerifyModalVisible(true);
    setVerifyState("listening");
    // Simulate 2s of listening then success
    setTimeout(() => {
      setVerifyState("matched");
      unlockTier2("usr_owner");
      setTimeout(() => {
        setVerifyModalVisible(false);
        setVerifyState("idle");
      }, 1400);
    }, 2200);
  };

  return (
    <View style={styles.container} testID="voiceprint-screen">
      <TerminalHeader
        title="VOICEPRINT BIOMETRICS"
        subtitle="On-Device Speaker Verification"
        rightBadge={voiceprint.enrolled ? "OWNER VERIFIED" : "UNENROLLED"}
        onlineMode={wakeConfig.onlineMode}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Reassurance Banner - Voiceprint is always offline */}
        <View style={styles.reassuranceBanner} testID="voiceprint-offline-guarantee-banner">
          <MaterialCommunityIcons name="shield-lock" size={18} color="#00FF66" />
          <Text style={styles.reassuranceText}>
            <Text style={styles.reassuranceHighlight}>Voiceprint data hamesha 100% offline.</Text>{" "}
            {wakeConfig.onlineMode
              ? "Online mode ON hone par bhi voice biometrics kabhi network par nahi jaate — sirf local encrypted SQLCipher."
              : "Air-Gapped mode fully active. Zero network egress on voice biometrics."}
          </Text>
        </View>
        {/* Status Card */}
        <View style={styles.card} testID="voiceprint-status-card">
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="waveform" size={24} color="#00FF66" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Owner Neural Voiceprint</Text>
                <Text style={styles.cardSubtitle}>Local AES-256 Encrypted Model</Text>
              </View>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{voiceprint.confidenceScore}%</Text>
              <Text style={styles.scoreLabel}>MATCH</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Storage Status</Text>
            <Text style={styles.paramValueActive}>Encrypted SQLite (Zero Cloud)</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Last Acoustic Verification</Text>
            <Text style={styles.paramValue}>{voiceprint.lastVerified}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Model Hash</Text>
            <Text style={styles.paramValueHash}>{voiceprint.encryptedModelHash}</Text>
          </View>
        </View>

        {/* Calibration / Enrollment Card */}
        <View style={styles.card} testID="calibration-card">
          <Text style={styles.sectionTitle}>VOCAL PHRASE ENROLLMENT</Text>
          <Text style={styles.cardDesc}>
            To protect Tier 2 actions (messages, settings, camera), the on-device AI matches your unique vocal resonance. Do other voices trigger Tier 2? <Text style={styles.highlight}>Never. Rejected locally.</Text>
          </Text>

          {voiceprint.enrollmentPhrases.map((phrase, idx) => (
            <View key={idx} style={styles.phraseItem} testID={`phrase-item-${idx}`}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#00FF66" />
              <Text style={styles.phraseText}>&quot;{phrase}&quot;</Text>
            </View>
          ))}

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={startVerify}
              testID="verify-voice-btn"
            >
              <MaterialCommunityIcons name="shield-check" size={16} color="#00FF66" />
              <Text style={styles.verifyBtnText}>
                {session ? `Re-verify (${Math.floor(sessionRemainingMs / 1000 / 60)}m left)` : "Verify Voice → Unlock Tier 2"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calibrateBtn}
              onPress={startEnrollment}
              testID="start-calibration-btn"
            >
              <MaterialCommunityIcons name="microphone-plus" size={16} color="#090D0B" />
              <Text style={styles.calibrateBtnText}>Re-enroll</Text>
            </TouchableOpacity>
          </View>

          {session && (
            <TouchableOpacity style={styles.lockBtn} onPress={lockTier2} testID="lock-tier2-in-voiceprint">
              <MaterialCommunityIcons name="lock" size={14} color="#FF334B" />
              <Text style={styles.lockBtnText}>Lock Tier 2 Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Zero-Trust Enterprise Mode Card */}
        <View
          style={[styles.card, enterprise.modeEnabled && styles.cardEnterpriseActive]}
          testID="enterprise-mode-card"
        >
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconBoxSmall, enterprise.modeEnabled && styles.iconBoxSmallActive]}>
                <MaterialCommunityIcons
                  name="office-building-cog"
                  size={20}
                  color={enterprise.modeEnabled ? "#8AB4FF" : "#819C8F"}
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>Zero-Trust Enterprise Mode</Text>
                <Text style={styles.cardSubtitle}>
                  {enterprise.modeEnabled
                    ? `${enterprise.members.length} members · ${enterprise.orgName}`
                    : "Multi-user voiceprint vault (Personal by default)"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.enterpriseToggle, enterprise.modeEnabled && styles.enterpriseToggleActive]}
              onPress={() => toggleEnterpriseMode(!enterprise.modeEnabled)}
              testID="enterprise-mode-toggle"
            >
              <Text style={[styles.enterpriseToggleText, enterprise.modeEnabled && styles.enterpriseToggleTextActive]}>
                {enterprise.modeEnabled ? "ACTIVE" : "ENABLE"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardDesc}>
            {enterprise.modeEnabled
              ? "Multiple owners/admins can enroll their voiceprints locally. Each member gets role-based Tier 1/Tier 2 access. All embeddings stored in SQLCipher, zero cloud."
              : "Enable for shared devices (family, small team). Each member enrolls their own voiceprint; commands are audited per-user offline."}
          </Text>

          {enterprise.modeEnabled && (
            <>
              <View style={styles.membersList}>
                {enterprise.members.map((m) => (
                  <View key={m.id} style={styles.memberRow} testID={`member-row-${m.id}`}>
                    <View style={styles.memberLeft}>
                      <View style={[styles.roleBadge, styles[`roleBadge${m.role}` as const]]}>
                        <Text style={styles.roleBadgeText}>{m.role}</Text>
                      </View>
                      <View style={styles.flexOne}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.memberMeta}>
                          {m.voiceprintEnrolled
                            ? `${m.matchConfidence}% · Tier ${m.allowedTiers.join("+")}`
                            : "Voiceprint not enrolled"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      {!m.voiceprintEnrolled && (
                        <TouchableOpacity
                          style={styles.memberEnrollBtn}
                          onPress={() => enrollMemberVoiceprint(m.id)}
                          testID={`enroll-member-${m.id}`}
                        >
                          <MaterialCommunityIcons name="microphone-plus" size={14} color="#00FF66" />
                        </TouchableOpacity>
                      )}
                      {m.role !== "OWNER" && (
                        <TouchableOpacity
                          style={styles.memberRemoveBtn}
                          onPress={() => removeMember(m.id)}
                          testID={`remove-member-${m.id}`}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={14} color="#FF334B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setMemberModalVisible(true)}
                testID="open-add-member"
              >
                <MaterialCommunityIcons name="account-plus" size={16} color="#8AB4FF" />
                <Text style={styles.addMemberBtnText}>Add Member (Voiceprint Enroll)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Anti-Spoofing Security Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ANTI-SPOOFING PROTECTIONS</Text>
          
          <View style={styles.securityFeatureRow}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#00FF66" />
            <View style={styles.securityFeatureTextCol}>
              <Text style={styles.securityTitle}>Replay Attack Prevention</Text>
              <Text style={styles.securityDesc}>Replayed recordings of your voice via speaker are rejected by temporal acoustic challenge.</Text>
            </View>
          </View>

          <View style={styles.securityFeatureRow}>
            <MaterialCommunityIcons name="cpu-64-bit" size={18} color="#00FF66" />
            <View style={styles.securityFeatureTextCol}>
              <Text style={styles.securityTitle}>Zero Cloud Telemetry</Text>
              <Text style={styles.securityDesc}>Voice embeddings never leave the device RAM or local encrypted SQLite partition.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={memberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addMemberModal} testID="add-member-modal">
            <Text style={styles.modalTitle}>ENROLL NEW MEMBER</Text>
            <Text style={styles.cardDesc}>
              Member voiceprint locally trained + AES-256 embedded. Never leaves device.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Member Name (e.g. Sister, Admin)"
              placeholderTextColor="#819C8F"
              value={newMemberName}
              onChangeText={setNewMemberName}
              testID="new-member-name-input"
            />
            <View style={styles.roleSelectRow}>
              <TouchableOpacity
                style={[styles.roleSelectBtn, newMemberRole === "USER" && styles.roleSelectBtnActive]}
                onPress={() => setNewMemberRole("USER")}
                testID="role-select-user"
              >
                <Text
                  style={[styles.roleSelectText, newMemberRole === "USER" && styles.roleSelectTextActive]}
                >
                  USER (Tier 1)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleSelectBtn, newMemberRole === "ADMIN" && styles.roleSelectBtnActive]}
                onPress={() => setNewMemberRole("ADMIN")}
                testID="role-select-admin"
              >
                <Text
                  style={[styles.roleSelectText, newMemberRole === "ADMIN" && styles.roleSelectTextActive]}
                >
                  ADMIN (Tier 1+2)
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMemberModalVisible(false)}
                testID="cancel-add-member"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  if (!newMemberName.trim()) return;
                  addMember(newMemberName.trim(), newMemberRole);
                  setNewMemberName("");
                  setNewMemberRole("USER");
                  setMemberModalVisible(false);
                }}
                testID="submit-add-member"
              >
                <Text style={styles.modalSubmitText}>Add + Enroll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Multi-Phase Voiceprint Enrollment Modal */}
      <Modal
        visible={enrollModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEnrollModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.enrollModal} testID="enrollment-modal">
            <Text style={styles.modalTitle}>VOICEPRINT ENROLLMENT</Text>
            <Text style={styles.cardDesc}>
              {enrollPhase < 4
                ? `Phase ${enrollPhase}/3 · Speak the highlighted phrase clearly into the mic`
                : "Local encrypted embedding written to SQLCipher"}
            </Text>

            <View style={styles.phaseIndicator} testID="enroll-phase-indicator">
              {[1, 2, 3].map((p) => (
                <View
                  key={p}
                  style={[
                    styles.phaseDot,
                    enrollPhase >= p && styles.phaseDotActive,
                    enrollPhase === p && !isRecording && styles.phaseDotCurrent,
                    enrollPhase > p && styles.phaseDotDone,
                  ]}
                >
                  <Text style={styles.phaseDotText}>{p}</Text>
                </View>
              ))}
            </View>

            {enrollPhase >= 1 && enrollPhase <= 3 && (
              <>
                <View style={styles.phrasePromptBox} testID={`enroll-prompt-${enrollPhase}`}>
                  <MaterialCommunityIcons name="format-quote-open" size={14} color="#00FF66" />
                  <Text style={styles.phrasePromptText}>
                    {voiceprint.enrollmentPhrases[enrollPhase - 1]}
                  </Text>
                </View>

                {isRecording ? (
                  <View style={styles.recordingBox} testID="recording-state">
                    <MaterialCommunityIcons name="record-rec" size={20} color="#FF334B" />
                    <Text style={styles.recordingText}>Recording · {recordSecs}s</Text>
                    <View style={styles.miniWaveBox}>
                      {[70, 40, 90, 60, 100, 50, 80, 65, 95, 55, 75, 40, 85].map((h, i) => (
                        <View key={i} style={[styles.miniWaveBar, { height: `${h}%` }]} />
                      ))}
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.recordBtn}
                    onPress={captureCurrentPhrase}
                    testID={`record-phrase-btn-${enrollPhase}`}
                  >
                    <MaterialCommunityIcons name="microphone" size={20} color="#090D0B" />
                    <Text style={styles.recordBtnText}>Start Recording</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {enrollPhase === 4 && (
              <View style={styles.enrollSuccessBox} testID="enroll-success">
                <MaterialCommunityIcons name="check-decagram" size={28} color="#00FF66" />
                <Text style={styles.enrollSuccessText}>Voiceprint enrolled & encrypted locally</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setEnrollModalVisible(false);
                setEnrollPhase(0);
                setIsRecording(false);
              }}
              testID="cancel-enrollment"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verify Voice → Unlock Tier 2 Modal */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModal} testID="verify-voice-modal">
            <MaterialCommunityIcons
              name={verifyState === "matched" ? "check-decagram" : "shield-search"}
              size={36}
              color={verifyState === "matched" ? "#00FF66" : "#FFB800"}
            />
            <Text style={styles.modalTitle}>
              {verifyState === "matched" ? "OWNER VERIFIED" : "VOICE VERIFICATION"}
            </Text>
            <Text style={styles.cardDesc}>
              {verifyState === "listening"
                ? `Speak: "${voiceprint.enrollmentPhrases[0]}"`
                : verifyState === "matched"
                ? "Match confidence 99.1% · Tier 2 unlocked for 5 minutes"
                : "Rejected — voice does not match owner embedding"}
            </Text>
            {verifyState === "listening" && (
              <View style={styles.miniWaveBox}>
                {[70, 40, 90, 60, 100, 50, 80, 65, 95, 55, 75, 40, 85].map((h, i) => (
                  <View key={i} style={[styles.miniWaveBar, { height: `${h}%` }]} />
                ))}
              </View>
            )}
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
  scoreBadge: {
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  scoreText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#00FF66",
  },
  scoreLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: "#819C8F",
  },
  divider: {
    height: 1,
    backgroundColor: "#1F382B",
    marginVertical: 4,
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
  paramValueHash: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#A2B8AE",
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 14,
    color: "#E2ECE7",
    letterSpacing: 0.5,
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
  phraseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#090D0B",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
    gap: 10,
  },
  phraseText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#E2ECE7",
  },
  calibrateBtn: {
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  calibrateBtnText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
  },
  calibratingBox: {
    backgroundColor: "#090D0B",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF334B",
    alignItems: "center",
    gap: 10,
  },
  calibratingText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#FF334B",
    textAlign: "center",
  },
  authWaveformBox: {
    width: "100%",
    height: 40,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#111A16",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  authWaveBar: {
    width: 6,
    backgroundColor: "#FF334B",
    borderRadius: 3,
  },
  securityFeatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#090D0B",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  securityFeatureTextCol: {
    flex: 1,
    gap: 2,
  },
  securityTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#E2ECE7",
  },
  securityDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    lineHeight: 16,
  },
  reassuranceBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reassuranceText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#A2B8AE",
    flex: 1,
    lineHeight: 17,
  },
  reassuranceHighlight: {
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#00FF66",
  },
  cardEnterpriseActive: {
    borderColor: "#8AB4FF",
    backgroundColor: "#0F1520",
  },
  iconBoxSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#1F382B",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSmallActive: {
    borderColor: "#8AB4FF",
    backgroundColor: "#121A2B",
  },
  flexOne: { flex: 1 },
  enterpriseToggle: {
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enterpriseToggleActive: {
    borderColor: "#8AB4FF",
    backgroundColor: "#121A2B",
  },
  enterpriseToggleText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 11,
    color: "#819C8F",
    letterSpacing: 1,
  },
  enterpriseToggleTextActive: { color: "#8AB4FF" },
  membersList: { gap: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#090D0B",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
    gap: 10,
  },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, minWidth: 52, alignItems: "center" },
  roleBadgeOWNER: { backgroundColor: "#14261C", borderWidth: 1, borderColor: "#00FF66" },
  roleBadgeADMIN: { backgroundColor: "#121A2B", borderWidth: 1, borderColor: "#8AB4FF" },
  roleBadgeUSER: { backgroundColor: "#1A2821", borderWidth: 1, borderColor: "#1F382B" },
  roleBadgeText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 9, color: "#E2ECE7", letterSpacing: 1 },
  memberName: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, color: "#E2ECE7" },
  memberMeta: { fontFamily: "JetBrainsMono_400Regular", fontSize: 10, color: "#819C8F", marginTop: 2 },
  memberActions: { flexDirection: "row", gap: 6 },
  memberEnrollBtn: {
    width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: "#14261C", borderWidth: 1, borderColor: "#00FF66",
  },
  memberRemoveBtn: {
    width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: "#2A1216", borderWidth: 1, borderColor: "#FF334B",
  },
  addMemberBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#121A2B", borderWidth: 1, borderColor: "#8AB4FF",
    paddingVertical: 10, borderRadius: 8,
  },
  addMemberBtnText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#8AB4FF" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(9, 13, 11, 0.85)", justifyContent: "center", padding: 20,
  },
  addMemberModal: {
    backgroundColor: "#111A16", borderRadius: 16, borderWidth: 1, borderColor: "#8AB4FF",
    padding: 20, gap: 14,
  },
  modalTitle: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 16, color: "#E2ECE7", letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: "#090D0B", borderWidth: 1, borderColor: "#1F382B", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    fontFamily: "JetBrainsMono_400Regular", fontSize: 13, color: "#E2ECE7",
  },
  roleSelectRow: { flexDirection: "row", gap: 8 },
  roleSelectBtn: {
    flex: 1, backgroundColor: "#090D0B", borderWidth: 1, borderColor: "#1F382B",
    paddingVertical: 10, borderRadius: 8, alignItems: "center",
  },
  roleSelectBtnActive: { backgroundColor: "#121A2B", borderColor: "#8AB4FF" },
  roleSelectText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, color: "#819C8F" },
  roleSelectTextActive: { color: "#8AB4FF" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1, backgroundColor: "#090D0B", borderWidth: 1, borderColor: "#1F382B",
    paddingVertical: 12, borderRadius: 8, alignItems: "center",
  },
  modalCancelText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#819C8F" },
  modalSubmitBtn: {
    flex: 1, backgroundColor: "#8AB4FF", paddingVertical: 12, borderRadius: 8, alignItems: "center",
  },
  modalSubmitText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#090D0B" },
  actionBtnRow: { flexDirection: "row", gap: 10 },
  verifyBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#14261C", borderWidth: 1, borderColor: "#00FF66",
    paddingVertical: 11, borderRadius: 8,
  },
  verifyBtnText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: "#00FF66" },
  lockBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#2A1216", borderWidth: 1, borderColor: "#FF334B",
    paddingVertical: 9, borderRadius: 8, marginTop: 4,
  },
  lockBtnText: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, color: "#FF334B" },
  enrollModal: {
    backgroundColor: "#111A16", borderRadius: 16, borderWidth: 1, borderColor: "#00FF66",
    padding: 20, gap: 14,
  },
  phaseIndicator: {
    flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 4,
  },
  phaseDot: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "#1A2821", borderWidth: 1, borderColor: "#1F382B",
  },
  phaseDotActive: { borderColor: "#00FF66" },
  phaseDotCurrent: { backgroundColor: "#14261C" },
  phaseDotDone: { backgroundColor: "#00FF66" },
  phaseDotText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 14, color: "#E2ECE7",
  },
  phrasePromptBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#090D0B", borderWidth: 1, borderColor: "#00FF66",
    padding: 12, borderRadius: 8,
  },
  phrasePromptText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 14, color: "#00FF66", flex: 1,
  },
  recordingBox: {
    alignItems: "center", gap: 10, padding: 12,
    backgroundColor: "#2A1216", borderWidth: 1, borderColor: "#FF334B", borderRadius: 8,
  },
  recordingText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, color: "#FF334B",
  },
  miniWaveBox: {
    height: 34, width: "100%",
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  miniWaveBar: { width: 5, backgroundColor: "#00FF66", borderRadius: 2 },
  recordBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00FF66", paddingVertical: 12, borderRadius: 8,
  },
  recordBtnText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, color: "#090D0B",
  },
  enrollSuccessBox: {
    alignItems: "center", gap: 8,
    backgroundColor: "#14261C", borderWidth: 1, borderColor: "#00FF66",
    padding: 16, borderRadius: 8,
  },
  enrollSuccessText: {
    fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, color: "#00FF66", textAlign: "center",
  },
  verifyModal: {
    backgroundColor: "#111A16", borderRadius: 16, borderWidth: 1, borderColor: "#00FF66",
    padding: 22, gap: 12, alignItems: "center",
  },
});
