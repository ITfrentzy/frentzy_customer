import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { verifyOtp, loading } = useAuth();
  const params = useLocalSearchParams();
  const [code, setCode] = useState("");
  const phone = String((params as any)?.phone || "");

  const onVerify = async () => {
    const ok = await verifyOtp(phone.trim(), code.trim());
    if (!ok) return; // stay on page on failure
    const from = Array.isArray((params as any)?.from)
      ? (params as any).from[0]
      : (params as any)?.from;
    const hasVehicleId = (params as any)?.id != null;
    if (from === "account") {
      try {
        navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
      } catch {}
    } else if (from === "vehicle" || hasVehicleId) {
      // Go back to vehicle detail without resetting stack; fallback to replace if no back stack exists
      if (typeof (navigation as any)?.canGoBack === "function" && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        const replaceParams: any = { ...params };
        router.replace({ pathname: "/vehicle/[id]", params: replaceParams });
      }
    } else {
      try {
        navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
      } catch {
        router.replace("/(tabs)");
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Enter code</ThemedText>
      <ThemedText style={styles.subtitle}>We sent an SMS to {phone}</ThemedText>
      <TextInput
        placeholder="Verification code"
        placeholderTextColor="#9BA1A6"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={onVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#151718" /> : <ThemedText style={styles.buttonText}>Verify & continue</ThemedText>}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.replace({ pathname: "/login", params: { ...(params as any), phone } as any })}
        accessibilityRole="button"
        accessibilityLabel="Change phone number"
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <ThemedText style={{ color: "#fff", textDecorationLine: "underline", fontSize: 14 }}>Change phone number</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#151718", padding: 20, justifyContent: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { color: "#9BA1A6", fontSize: 14, marginBottom: 16, textAlign: "center" },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#151718", fontSize: 16, fontWeight: "700" },
});


