import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
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
          <ThemedText style={styles.headerTitle}>Terms & Conditions</ThemedText>
          <View style={styles.headerSide} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>1. Introduction</ThemedText>
        <ThemedText style={styles.paragraph}>
          Welcome to Frentzy. These Terms & Conditions outline the rules and regulations for using our application.
        </ThemedText>
        <ThemedText style={styles.sectionTitle}>2. Use of Service</ThemedText>
        <ThemedText style={styles.paragraph}>
          By accessing this app we assume you accept these terms. Do not continue to use the app if you do not agree to all of the terms stated on this page.
        </ThemedText>
        <ThemedText style={styles.sectionTitle}>3. Liability</ThemedText>
        <ThemedText style={styles.paragraph}>
          The service is provided on an "as is" basis without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages.
        </ThemedText>
        <ThemedText style={styles.sectionTitle}>4. Changes</ThemedText>
        <ThemedText style={styles.paragraph}>
          We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.
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


