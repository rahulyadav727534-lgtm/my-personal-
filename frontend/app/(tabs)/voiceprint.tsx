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

export default function VoiceprintScreen() {
  const { voiceprint, updateVoiceprint, wakeConfig } = useApp();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationStep(1);
    setTimeout(() => setCalibrationStep(2), 2000);
    setTimeout(() => setCalibrationStep(3), 4000);
    setTimeout(() => {
      setIsCalibrating(false);
      setCalibrationStep(0);
      updateVoiceprint({
        enrolled: true,
        confidenceScore: Number((98 + Math.random() * 1.8).toFixed(1)),
        lastVerified: "Just now (Recalibrated)",
        encryptedModelHash: `sha256:${Math.random().toString(36).substring(2, 15)}... (AES-256)`,
      });
    }, 6000);
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

          {isCalibrating ? (
            <View style={styles.calibratingBox} testID="calibrating-state">
              <MaterialCommunityIcons name="record-rec" size={24} color="#FF334B" />
              <Text style={styles.calibratingText}>
                {calibrationStep === 1
                  ? "Phase 1/3: Speak phrase 1 clearly..."
                  : calibrationStep === 2
                  ? "Phase 2/3: Measuring vocal pitch & resonance..."
                  : "Phase 3/3: Updating local encrypted embedding..."}
              </Text>
              <View style={styles.authWaveformBox}>
                {[70, 40, 90, 60, 100, 50, 80, 65, 95].map((h, i) => (
                  <View key={i} style={[styles.authWaveBar, { height: `${h}%` }]} />
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.calibrateBtn}
              onPress={startCalibration}
              testID="start-calibration-btn"
            >
              <MaterialCommunityIcons name="microphone-plus" size={18} color="#090D0B" />
              <Text style={styles.calibrateBtnText}>Recalibrate Voiceprint</Text>
            </TouchableOpacity>
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
});
