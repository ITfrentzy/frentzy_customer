import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { requestOtp, verifyOtp, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const params = useLocalSearchParams();
  const [phoneCode, setPhoneCode] = useState<string>("+966");
  const [showCodeList, setShowCodeList] = useState<boolean>(false);
  const [codeSearch, setCodeSearch] = useState<string>("");
  const [countries, setCountries] = useState<Array<{ name: string; code: string; flag: string }>>([]);

  useEffect(() => {
    const loadCodes = async () => {
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/codes");
        const json = await res.json();
        const toFlag = (iso2: string | undefined): string => {
          if (!iso2) return "";
          const upper = iso2.toUpperCase();
          return upper
            .split("")
            .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
            .join("");
        };
        const mapped: Array<{ name: string; code: string; flag: string }> = ((json && json.data) || [])
          .map((c: any) => {
            const name = c?.name as string | undefined;
            const code = c?.dial_code as string | undefined;
            const iso2 = c?.code as string | undefined;
            if (!name || !code) return null;
            return { name, code, flag: toFlag(iso2) };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCountries(mapped as any);
      } catch {
        setCountries([{ name: "Saudi Arabia", code: "+966", flag: "🇸🇦" }]);
      }
    };
    loadCodes();
  }, []);

  const onSubmit = async () => {
    const fullPhone = `${phoneCode || ""}${phone || ""}`.trim();
    await requestOtp(fullPhone);
    // Navigate to separate OTP screen; final navigation happens after verification
    router.replace({ pathname: "/verify-otp", params: { phone: fullPhone, ...(params as any) } as any });
  };

  return (
    <>
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign in</ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          style={[styles.input, styles.codeSelector]}
          onPress={() => setShowCodeList(true)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.codeText}>{phoneCode}</ThemedText>
          <Ionicons name="chevron-down" size={16} color="#9BA1A6" />
        </TouchableOpacity>
        <TextInput
          placeholder="Phone number"
          placeholderTextColor="#9BA1A6"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { flex: 1 }]}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#151718" /> : <ThemedText style={styles.buttonText}>Send code</ThemedText>}
      </TouchableOpacity>
      
    </ThemedView>
    {/* Country code list */}
    <Modal visible={showCodeList} animationType="fade" transparent onRequestClose={() => setShowCodeList(false)}>
      <View style={styles.dropdownOverlay}>
        <View style={[styles.dropdownCard, { paddingBottom: 8 }]}> 
          <View style={styles.dropdownHeaderRow}>
            <ThemedText style={styles.dropdownTitle}>Select country code</ThemedText>
            <TouchableOpacity onPress={() => setShowCodeList(false)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Search country or code"
            placeholderTextColor="#9BA1A6"
            value={codeSearch}
            onChangeText={setCodeSearch}
            style={styles.dropdownSearch}
          />
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {(countries || [])
              .filter((c) =>
                c.name.toLowerCase().includes(codeSearch.toLowerCase()) || c.code.includes(codeSearch)
              )
              .map((c) => (
                <TouchableOpacity
                  key={c.code + c.name}
                  style={styles.dropdownItemRow}
                  onPress={() => {
                    setPhoneCode(c.code);
                    setShowCodeList(false);
                    setCodeSearch("");
                  }}
                >
                  <ThemedText style={styles.dropdownFlag}>{c.flag}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.dropdownCountry}>{c.name}</ThemedText>
                    <ThemedText style={styles.dropdownCode}>{c.code}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
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
  codeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 110,
  },
  codeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#151718", fontSize: 16, fontWeight: "700" },
  dropdownOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dropdownCard: {
    backgroundColor: "#1b1e1f",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dropdownHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dropdownTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dropdownSearch: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    marginBottom: 10,
  },
  dropdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,232,235,0.08)",
    gap: 10,
  },
  dropdownFlag: { fontSize: 18 },
  dropdownCountry: { color: "#fff", fontSize: 14, fontWeight: "600" },
  dropdownCode: { color: "#9BA1A6", fontSize: 12 },
});


