import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function TerminalHeader({
  title,
  subtitle,
  rightBadge,
  onlineMode,
}: {
  title: string;
  subtitle?: string;
  rightBadge?: string;
  onlineMode?: boolean;
}) {
  return (
    <View style={styles.headerContainer} testID="terminal-header">
      <View style={styles.leftSection}>
        <View style={[styles.pulseDot, onlineMode && styles.pulseDotOnline]} />
        <View>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.badgeContainer, onlineMode && styles.badgeContainerOnline]} testID="terminal-badge">
          <MaterialCommunityIcons
            name={onlineMode ? "web" : "shield-check"}
            size={14}
            color={onlineMode ? "#FFB800" : "#00FF66"}
          />
          <Text style={[styles.badgeText, onlineMode && styles.badgeTextOnline]}>
            {onlineMode ? "ONLINE MODE: ON" : rightBadge || "AIR-GAPPED"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111A16",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F382B",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00FF66",
    shadowColor: "#00FF66",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  pulseDotOnline: {
    backgroundColor: "#FFB800",
    shadowColor: "#FFB800",
  },
  titleText: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 18,
    color: "#E2ECE7",
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#819C8F",
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2821",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1F382B",
    gap: 6,
  },
  badgeContainerOnline: {
    backgroundColor: "#2B2211",
    borderColor: "#FFB800",
  },
  badgeText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: "#00FF66",
  },
  badgeTextOnline: {
    color: "#FFB800",
  },
});
