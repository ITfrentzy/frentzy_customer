import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.headerTitle}>Privacy Policy</ThemedText>
          <View style={styles.headerSide} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Information We Collect</ThemedText>
        <ThemedText style={styles.paragraph}>
          We collect information you provide directly to us, such as name, email, and booking details, as well as usage information to improve our services.
        </ThemedText>
        <ThemedText style={styles.sectionTitle}>How We Use Information</ThemedText>
        <ThemedText style={styles.paragraph}>
          We use the information to operate, maintain, and improve the app, and to communicate with you about your bookings and updates.
        </ThemedText>
        <ThemedText style={styles.sectionTitle}>Your Rights</ThemedText>
        <ThemedText style={styles.paragraph}>
          You may request access, correction, or deletion of your personal information subject to applicable laws.
        </ThemedText>
        </ScrollView>
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
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  headerSide: {
    width: 64,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: "#E6E8EB",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    color: "#C1C6CB",
    fontSize: 14,
    lineHeight: 20,
  },
});


