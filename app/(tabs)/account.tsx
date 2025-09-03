import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    try {
      navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
    } catch {
      router.replace("/(tabs)");
    }
  };

  const ActionItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color="#E6E8EB" />
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#8A9196" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerText}>
            <ThemedText style={styles.nameText} numberOfLines={1}>
              {user?.full_name || "Guest"}
            </ThemedText>
            <ThemedText style={styles.emailText} numberOfLines={1}>
              {user?.email || "Not signed in"}
            </ThemedText>
          </View>
        </View>

        {user ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Account</ThemedText>
            <View style={styles.card}>
              <ActionItem
                icon="person"
                label="Edit personal information"
                onPress={() => router.push("/profile/edit")}
              />
              <View style={styles.divider} />
              <ActionItem
                icon="password"
                label="Change password"
                onPress={() => router.push("/change-password")}
              />
              <View style={styles.divider} />
              <ActionItem
                icon="credit-card"
                label="Payment methods"
                onPress={() => router.push("/payment")}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
          <View style={styles.card}>
            <ActionItem
              icon="gavel"
              label="Terms & Conditions"
              onPress={() => router.push("/terms")}
            />
            <View style={styles.divider} />
            <ActionItem
              icon="privacy-tip"
              label="Privacy Policy"
              onPress={() => router.push("/privacy")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            {user ? (
              <ActionItem
                icon="logout"
                label="Log out"
                onPress={handleLogout}
              />
            ) : (
              <ActionItem
                icon="login"
                label="Log in"
                onPress={() => router.push({ pathname: "/login", params: { from: "account" } })}
              />
            )}
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#151718",
  },
  container: {
    flex: 1,
    backgroundColor: "#151718",
  },
  headerCard: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "#1A1D1E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2D2E",
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  emailText: {
    color: "#9BA1A6",
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    color: "#8A9196",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: "#1A1D1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2D2E",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    color: "#E6E8EB",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2D2E",
    marginLeft: 14 + 22 + 10, // left padding + icon + gap
  },
});
