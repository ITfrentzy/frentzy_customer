import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { signIn, loading, debugBypass } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const params = useLocalSearchParams();

  const onSubmit = async () => {
    await signIn(email.trim(), password);
    // Only reset the stack if routed here from account tab
    const from = Array.isArray((params as any)?.from)
      ? (params as any).from[0]
      : (params as any)?.from;
    const hasVehicleId = (params as any)?.id != null;
    if (from === "account") {
      try {
        navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
      } catch {}
    } else if (from === "vehicle" || hasVehicleId) {
      // Return to existing vehicle detail without stacking a duplicate
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign in</ThemedText>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#9BA1A6"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9BA1A6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#151718" /> : <ThemedText style={styles.buttonText}>Login</ThemedText>}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "rgba(255,255,255,0.14)", marginTop: 10 }]}
        onPress={() => {
          debugBypass();
          const from = Array.isArray((params as any)?.from)
            ? (params as any).from[0]
            : (params as any)?.from;
          const hasVehicleId = (params as any)?.id != null;
          if (from === "vehicle" || hasVehicleId) {
            router.back();
          } else if (from === "account") {
            try {
              navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
            } catch {}
          } else {
            router.replace("/(tabs)");
          }
        }}
      >
        <ThemedText style={[styles.buttonText, { color: "#fff" }]}>Bypass (Debug)</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#151718", padding: 20, justifyContent: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 24, textAlign: "center" },
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


