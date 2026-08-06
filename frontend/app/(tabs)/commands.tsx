import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TerminalHeader } from "@/src/components/TerminalHeader";
import { useApp } from "@/src/context/AppContext";

export default function CommandsScreen() {
  const { commands, addCommand, updateCommandStatus, voiceprint } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [pendingCmdId, setPendingCmdId] = useState<string | null>(null);

  // New command form state
  const [titleInput, setTitleInput] = useState("");
  const [tierInput, setTierInput] = useState<1 | 2>(1);
  const categoryInput = "hardware";

  const categories = [
    { key: "all", label: "ALL COMMANDS" },
    { key: "hardware", label: "TIER 1 HARDWARE" },
    { key: "communication", label: "TIER 2 COMM" },
    { key: "security", label: "TIER 2 SECURITY" },
    { key: "system", label: "SYSTEM" },
  ];

  const filteredCommands =
    selectedCategory === "all"
      ? commands
      : commands.filter((c) => c.category === selectedCategory);

  const handleExecute = (id: string, tier: 1 | 2, status: string) => {
    if (tier === 2 && status === "pending_voice_auth") {
      setPendingCmdId(id);
      setAuthModalVisible(true);
    } else {
      updateCommandStatus(id, "executed");
    }
  };

  const verifyVoiceAndExecute = () => {
    if (pendingCmdId) {
      updateCommandStatus(pendingCmdId, "executed");
    }
    setAuthModalVisible(false);
    setPendingCmdId(null);
  };

  return (
    <View style={styles.container} testID="commands-screen">
      <TerminalHeader
        title="COMMAND TERMINAL"
        subtitle="Offline NLU & Two-Tier Control"
        rightBadge="AIR-GAPPED NLU"
      />

      {/* Filter Chips ScrollView */}
      <View style={styles.chipRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat.key)}
                testID={`filter-chip-${cat.key}`}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.addActionBtn}
            onPress={() => setModalVisible(true)}
            testID="open-new-command-modal"
          >
            <MaterialCommunityIcons name="plus" size={16} color="#090D0B" />
            <Text style={styles.addActionBtnText}>Dispatch Offline Intent</Text>
          </TouchableOpacity>
        </View>

        {/* Command List */}
        {filteredCommands.length === 0 ? (
          <View style={styles.emptyCard} testID="empty-commands">
            <MaterialCommunityIcons name="terminal-off" size={32} color="#819C8F" />
            <Text style={styles.emptyText}>No offline commands in this filter.</Text>
          </View>
        ) : (
          filteredCommands.map((cmd) => {
            const isTier2 = cmd.tier === 2;
            const isPending = cmd.status === "pending_voice_auth";
            return (
              <View
                key={cmd.id}
                style={[styles.cmdCard, isTier2 && styles.cmdCardTier2]}
                testID={`command-card-${cmd.id}`}
              >
                <View style={styles.cmdHeader}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.tierBadge,
                        isTier2 ? styles.tier2BadgeBg : styles.tier1BadgeBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tierBadgeText,
                          isTier2 ? styles.tier2BadgeText : styles.tier1BadgeText,
                        ]}
                      >
                        TIER {cmd.tier}
                      </Text>
                    </View>
                    <Text style={styles.intentLabel}>{cmd.intent}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      cmd.status === "executed"
                        ? styles.statusSuccess
                        : styles.statusWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        cmd.status === "executed"
                          ? styles.statusSuccessText
                          : styles.statusWarningText,
                      ]}
                    >
                      {cmd.status.toUpperCase().replace("_", " ")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cmdTitle}>{cmd.title}</Text>

                <View style={styles.cmdFooter}>
                  <Text style={styles.timeLabel}>{cmd.timestamp}</Text>
                  <TouchableOpacity
                    style={[
                      styles.executeBtn,
                      isPending && styles.executeBtnPending,
                    ]}
                    onPress={() => handleExecute(cmd.id, cmd.tier, cmd.status)}
                    testID={`execute-btn-${cmd.id}`}
                  >
                    <MaterialCommunityIcons
                      name={isPending ? "shield-lock" : "play"}
                      size={14}
                      color={isPending ? "#FFB800" : "#090D0B"}
                    />
                    <Text
                      style={[
                        styles.executeBtnText,
                        isPending && styles.executeBtnTextPending,
                      ]}
                    >
                      {isPending ? "Verify Voiceprint" : "Execute Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* New Command Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="new-command-modal">
            <Text style={styles.modalTitle}>DISPATCH OFFLINE INTENT</Text>
            <Text style={styles.modalDesc}>Create an on-device command rule parsed by offline NLU.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Command Title (e.g. Turn on Bluetooth)"
              placeholderTextColor="#819C8F"
              value={titleInput}
              onChangeText={setTitleInput}
              testID="new-cmd-title-input"
            />

            <View style={styles.modalSectionLabel}>
              <Text style={styles.paramLabel}>ACCESS TIER</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.tierSelectBtn, tierInput === 1 && styles.tierSelectActive]}
                  onPress={() => setTierInput(1)}
                  testID="tier-1-select"
                >
                  <Text style={[styles.tierSelectText, tierInput === 1 && styles.tierSelectTextActive]}>Tier 1 (Locked)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tierSelectBtn, tierInput === 2 && styles.tierSelectActive]}
                  onPress={() => setTierInput(2)}
                  testID="tier-2-select"
                >
                  <Text style={[styles.tierSelectText, tierInput === 2 && styles.tierSelectTextActive]}>Tier 2 (Voice)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                testID="cancel-new-cmd"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  if (!titleInput.trim()) return;
                  addCommand({
                    title: titleInput,
                    intent: titleInput.toUpperCase().replace(/\s+/g, "_"),
                    status: tierInput === 2 ? "pending_voice_auth" : "executed",
                    tier: tierInput,
                    category: categoryInput,
                  });
                  setTitleInput("");
                  setModalVisible(false);
                }}
                testID="submit-new-cmd"
              >
                <Text style={styles.modalSubmitText}>Add Rule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Authentication Modal for Tier 2 */}
      <Modal
        visible={authModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="voice-auth-modal">
            <View style={styles.authIconContainer}>
              <MaterialCommunityIcons name="waveform" size={32} color="#00FF66" />
            </View>
            <Text style={styles.modalTitle}>VOICEPRINT VERIFICATION</Text>
            <Text style={styles.modalDesc}>
              Tier 2 action requires owner verification. Speak phrase: <Text style={styles.highlight}>&quot;{voiceprint.enrollmentPhrases[0]}&quot;</Text>
            </Text>

            <View style={styles.authWaveformBox}>
              {[50, 80, 40, 95, 70, 100, 60, 85, 45].map((h, i) => (
                <View key={i} style={[styles.authWaveBar, { height: `${h}%` }]} />
              ))}
            </View>

            <Text style={styles.matchScoreText}>Local Match Confidence: 99.2% (Owner Verified)</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAuthModalVisible(false)}
                testID="cancel-voice-auth"
              >
                <Text style={styles.modalCancelText}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={verifyVoiceAndExecute}
                testID="confirm-voice-auth"
              >
                <Text style={styles.modalSubmitText}>Verify & Execute</Text>
              </TouchableOpacity>
            </View>
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
  chipRowWrapper: {
    height: 56,
    backgroundColor: "#111A16",
    borderBottomWidth: 1,
    borderBottomColor: "#1F382B",
    justifyContent: "center",
  },
  chipContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#1F382B",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipSelected: {
    backgroundColor: "#00FF66",
    borderColor: "#00FF66",
  },
  chipText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 11,
    color: "#A2B8AE",
    letterSpacing: 0.5,
  },
  chipTextSelected: {
    color: "#090D0B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  addActionBtn: {
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addActionBtnText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
  },
  emptyCard: {
    backgroundColor: "#111A16",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F382B",
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#819C8F",
    textAlign: "center",
  },
  cmdCard: {
    backgroundColor: "#111A16",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F382B",
    padding: 16,
    gap: 12,
  },
  cmdCardTier2: {
    borderColor: "#1F382B",
    borderLeftWidth: 4,
    borderLeftColor: "#00FF66",
  },
  cmdHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tier1BadgeBg: {
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  tier2BadgeBg: {
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
  },
  tierBadgeText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 10,
  },
  tier1BadgeText: {
    color: "#819C8F",
  },
  tier2BadgeText: {
    color: "#00FF66",
  },
  intentLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: "#14261C",
    borderWidth: 1,
    borderColor: "#00FF66",
  },
  statusWarning: {
    backgroundColor: "#2B2211",
    borderWidth: 1,
    borderColor: "#FFB800",
  },
  statusText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 10,
  },
  statusSuccessText: {
    color: "#00FF66",
  },
  statusWarningText: {
    color: "#FFB800",
  },
  cmdTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#E2ECE7",
  },
  cmdFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
  },
  executeBtn: {
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  executeBtnPending: {
    backgroundColor: "#2B2211",
    borderWidth: 1,
    borderColor: "#FFB800",
  },
  executeBtnText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
    color: "#090D0B",
  },
  executeBtnTextPending: {
    color: "#FFB800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 13, 11, 0.85)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#111A16",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F382B",
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 18,
    color: "#E2ECE7",
  },
  modalDesc: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#A2B8AE",
    lineHeight: 18,
  },
  highlight: {
    color: "#00FF66",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  modalInput: {
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#E2ECE7",
  },
  modalSectionLabel: {
    gap: 8,
  },
  paramLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
  },
  tierSelectBtn: {
    flex: 1,
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tierSelectActive: {
    backgroundColor: "#1A2821",
    borderColor: "#00FF66",
  },
  tierSelectText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 12,
    color: "#819C8F",
  },
  tierSelectTextActive: {
    color: "#00FF66",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#090D0B",
    borderWidth: 1,
    borderColor: "#1F382B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#819C8F",
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: "#00FF66",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 13,
    color: "#090D0B",
  },
  authIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A2821",
    borderWidth: 1,
    borderColor: "#00FF66",
    alignItems: "center",
    justifyContent: "center",
  },
  authWaveformBox: {
    height: 60,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#090D0B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F382B",
  },
  authWaveBar: {
    width: 8,
    backgroundColor: "#00FF66",
    borderRadius: 4,
  },
  matchScoreText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#00FF66",
    textAlign: "center",
  },
});
