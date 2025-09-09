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
            Terms & Conditions
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
                1. Introduction
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                Welcome to Frentzy. These Terms & Conditions outline the rules
                and regulations for using our application.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                2. Use of Service
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                By accessing this app we assume you accept these terms. Do not
                continue to use the app if you do not agree to all of the terms
                stated on this page.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>3. Liability</ThemedText>
              <ThemedText style={styles.paragraph}>
                The service is provided on an "as is" basis without warranties
                of any kind. We are not liable for any indirect, incidental, or
                consequential damages.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>4. Changes</ThemedText>
              <ThemedText style={styles.paragraph}>
                We may update these terms from time to time. Continued use of
                the app after changes constitutes acceptance of the updated
                terms.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                5. Eligibility
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                You must be of legal driving age and meet all licensing and
                identity requirements in your jurisdiction to use vehicle rental
                services through the app. We may request additional verification
                at any time.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                6. User Obligations
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                You agree to provide accurate information, maintain the security
                of your account, and use the app only for lawful purposes. You
                are responsible for any activity that occurs under your account.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                7. Bookings & Payments
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                Prices, availability, and fees are displayed at checkout. By
                confirming a booking, you authorize us or our payment partners
                to charge the provided payment method for the total amount
                shown, including taxes and applicable fees.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                8. Cancellations & Refunds
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                Cancellation terms vary by provider and booking window. Any
                eligible refund will be processed to the original payment method
                within a reasonable time after the cancellation is confirmed.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                9. Prohibited Activities
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                Misuse of the app, fraudulent bookings, scraping, reverse
                engineering, or interfering with the service is strictly
                prohibited and may result in account suspension or legal action.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                10. Limitation of Liability
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                To the maximum extent permitted by law, our total liability
                arising out of or relating to these terms or the use of the app
                shall not exceed the amounts paid by you for the specific
                booking that gave rise to the claim.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                11. Indemnification
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                You agree to indemnify and hold Frentzy and its partners
                harmless from any claims, liabilities, damages, losses, and
                expenses arising from your breach of these terms or misuse of
                the service.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                12. Governing Law & Dispute Resolution
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                These terms are governed by applicable local laws. Any disputes
                will be resolved in the courts of the jurisdiction where the
                service is primarily operated, unless otherwise required by law.
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>
                13. Contact Us
              </ThemedText>
              <ThemedText style={styles.paragraph}>
                Questions about these Terms & Conditions? Contact us at
                support@frentzy.app.
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
  articleScroll: { flex: 1 },
  articleContent: { paddingBottom: 4 },
  article: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    padding: 16,
    gap: 8,
  },
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
