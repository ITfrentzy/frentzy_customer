import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.email) {
      Alert.alert("Not signed in", "Please sign in to change password.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill out all fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please confirm your new password.");
      return;
    }
    try {
      setLoading(true);
      // Verify current password
      const { data: existing, error: findErr } = await supabase
        .from("customer")
        .select("id")
        .eq("email", user.email)
        .eq("password", currentPassword)
        .maybeSingle();
      if (findErr) {
        Alert.alert("Error", findErr.message);
        return;
      }
      if (!existing) {
        Alert.alert("Incorrect password", "Your current password is incorrect.");
        return;
      }
      const { error: updateErr } = await supabase
        .from("customer")
        .update({ password: newPassword })
        .eq("id", existing.id);
      if (updateErr) {
        Alert.alert("Update failed", updateErr.message);
        return;
      }
      Alert.alert("Success", "Your password has been updated.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.headerTitle}>Change Password</ThemedText>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.content}>
          <View style={styles.card}>
          <TextInput
            placeholder="Current password"
            placeholderTextColor="#8A9196"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="New password"
            placeholderTextColor="#8A9196"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="Confirm new password"
            placeholderTextColor="#8A9196"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <ThemedText style={styles.saveButtonText}>{loading ? "Saving..." : "Save changes"}</ThemedText>
          </TouchableOpacity>
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1A1D1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2D2E",
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#E6E8EB",
    fontSize: 15,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#151718",
    fontSize: 15,
    fontWeight: "700",
  },
});


