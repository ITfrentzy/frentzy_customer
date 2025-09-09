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
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Privacy Policy
          </ThemedText>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.content}>
          <View style={styles.article}>
            <ScrollView
              style={styles.articleScroll}
              contentContainerStyle={styles.articleContent}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.sectionTitle}>
                Information We Collect
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                We collect information you provide directly to us, such as name,
                email, and booking details, as well as usage information to
                improve our services.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                How We Use Information
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                We use the information to operate, maintain, and improve the
                app, and to communicate with you about your bookings and
                updates.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>Your Rights</ThemedText>
              <ThemedText style={styles.paragraph}>
                You may request access, correction, or deletion of your personal
                information subject to applicable laws.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                Legal Bases for Processing
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                We process your data based on contractual necessity, legitimate
                interests in operating and improving our services, and
                compliance with legal obligations. Where required, we obtain
                your consent.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                Sharing & Disclosure
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                We may share data with payment processors, service providers,
                and rental partners solely to deliver the service. We do not
                sell personal data.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                Data Retention
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                We retain information for as long as necessary to provide the
                service and comply with legal obligations. We securely delete or
                anonymize data when it is no longer needed.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>Security</ThemedText>
              <ThemedText style={styles.paragraph}>
                We implement technical and organizational measures to protect
                your data. No method of transmission or storage is 100% secure,
                but we continuously improve our safeguards.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                International Transfers
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                If data is transferred across borders, we use appropriate
                safeguards consistent with applicable laws.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
              <ThemedText style={styles.paragraph}>
                Questions about this Privacy Policy? Contact us at
                privacy@frentzy.app.
              </ThemedText>
            </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    marginBottom: 10,
  },
  headerSide: { width: 44 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  article: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    padding: 16,
    gap: 8,
  },
  articleScroll: { flex: 1 },
  articleContent: { paddingBottom: 4 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  paragraph: {
    color: "#C8CDD2",
    fontSize: 14,
    lineHeight: 22,
  },
});
