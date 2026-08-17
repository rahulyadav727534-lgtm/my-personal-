import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppProvider } from "@/src/context/AppContext";

export default function TabLayout() {
  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#00FF66",
          tabBarInactiveTintColor: "#819C8F",
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Wake Word",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "microphone" : "microphone-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="commands"
          options={{
            title: "Commands",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "console-line" : "console"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="voiceprint"
          options={{
            title: "Voiceprint",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "waveform" : "waveform"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="privacy"
          options={{
            title: "Privacy DB",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "shield-lock" : "shield-lock-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wizard"
          options={{
            title: "System Setup",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "cog-sync" : "cog-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#090D0B",
    borderTopWidth: 1,
    borderTopColor: "#1F382B",
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
  },
});
