import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+966");
  const [phoneFlag, setPhoneFlag] = useState("🇸🇦");
  const [showCodeList, setShowCodeList] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [countries, setCountries] = useState<Array<{ name: string; code: string; flag: string; iso2?: string }>>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [examplesMap, setExamplesMap] = useState<Record<string, string>>({});
  const [selectedIso2, setSelectedIso2] = useState<string | undefined>(undefined);

  // Per-country local number length and hint
  const codeToFormat: Record<string, { max: number; hint: string }> = {
    "+966": { max: 9, hint: "5XXXXXXXX" }, // SA
    "+971": { max: 9, hint: "5XXXXXXXX" }, // UAE
    "+965": { max: 8, hint: "5XXXXXXX" }, // Kuwait
    "+974": { max: 8, hint: "3XXXXXXX" }, // Qatar
    "+973": { max: 8, hint: "3XXXXXXX" }, // Bahrain
    "+968": { max: 8, hint: "9XXXXXXX" }, // Oman
    "+20": { max: 10, hint: "1XXXXXXXXX" }, // Egypt mobiles
    "+1": { max: 10, hint: "XXXXXXXXXX" }, // US/Canada
    "+44": { max: 10, hint: "7XXXXXXXXX" }, // UK mobiles
    "+49": { max: 11, hint: "1XXXXXXXXXX" },
    "+33": { max: 9, hint: "6XXXXXXXX" },
    "+34": { max: 9, hint: "6XXXXXXXX" },
    "+39": { max: 10, hint: "3XXXXXXXXX" },
    "+61": { max: 9, hint: "4XXXXXXXX" },
    "+62": { max: 10, hint: "8XXXXXXXXX" },
    "+63": { max: 10, hint: "9XXXXXXXXX" },
    "+65": { max: 8, hint: "8XXXXXXX" },
    "+81": { max: 10, hint: "8XXXXXXXXX" },
    "+82": { max: 10, hint: "1XXXXXXXXX" },
    "+86": { max: 11, hint: "1XXXXXXXXXX" },
    "+90": { max: 10, hint: "5XXXXXXXXX" },
    "+92": { max: 10, hint: "3XXXXXXXXX" },
    "+98": { max: 10, hint: "9XXXXXXXXX" },
    "+212": { max: 9, hint: "6XXXXXXXX" },
    "+216": { max: 8, hint: "2XXXXXXX" },
    "+218": { max: 9, hint: "9XXXXXXXX" },
  };

  const phoneFormat = (codeToFormat[phoneCode] || { max: 10, hint: "XXXXXXXXXX" });
  const phoneExample = selectedIso2 && examplesMap[selectedIso2] ? examplesMap[selectedIso2] : undefined;
  const phoneExampleDigits = phoneExample ? phoneExample.replace(/\D/g, "") : "";
  const phoneMax = phoneExampleDigits ? phoneExampleDigits.length : phoneFormat.max;
  const phoneFirst3 = phoneExampleDigits ? phoneExampleDigits.slice(0, 3) : "";
  const phoneHint = phoneFirst3 || phoneFormat.hint;

  useEffect(() => {
    // Enforce max length when country code changes
    if (phone.length > phoneFormat.max) {
      setPhone(phone.slice(0, phoneFormat.max));
    }
  }, [phoneCode]);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("customer")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName((data as any).full_name || "");
        setEmail((data as any).email || "");
        const rawPhone = (data as any).phone || "";
        const match = String(rawPhone).match(/^(\+\d{1,4})\s*(.*)$/);
        if (match) {
          setPhoneCode(match[1]);
          setPhone(match[2]);
        } else {
          setPhone(String(rawPhone));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    const loadCodes = async () => {
      try {
        setCodesLoading(true);
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/codes");
        const json = await res.json();
        const toFlag = (iso2: string | undefined): string => {
          if (!iso2) return "";
          const upper = iso2.toUpperCase();
          // Convert ISO2 letters to regional indicator symbols
          return upper
            .split("")
            .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
            .join("");
        };
        const mapped: Array<{ name: string; code: string; flag: string; iso2?: string }> = ((json && json.data) || [])
          .map((c: any) => {
            const name = c?.name as string | undefined;
            const code = c?.dial_code as string | undefined;
            const iso2 = c?.code as string | undefined;
            if (!name || !code) return null;
            return { name, code, flag: toFlag(iso2), iso2: iso2?.toUpperCase() };
          })
          .filter(Boolean)
          .filter((c: any) => c.name !== "Israel" && c.code !== "+972")
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCountries(mapped as any);
      } catch (e) {
        setCountries([{ name: "Saudi Arabia", code: "+966", flag: "🇸🇦" }]);
      } finally {
        setCodesLoading(false);
      }
    };
    loadCodes();
  }, []);

  // Load phone examples map
  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.53/examples.mobile.json");
        const json = await res.json();
        setExamplesMap(json || {});
      } catch (e) {
        setExamplesMap({});
      }
    };
    loadExamples();
  }, []);

  // If countries loaded, set selectedIso2 from current phoneCode
  useEffect(() => {
    if (!countries || countries.length === 0) return;
    const found = countries.find((c) => c.code === phoneCode);
    setSelectedIso2(found?.iso2);
  }, [countries, phoneCode]);

  const onSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    const combinedPhone = `${phoneCode || ""}${phone || ""}`;
    await supabase
      .from("customer")
      .update({ full_name: fullName, email, phone: combinedPhone })
      .eq("id", user.id);
    setSaving(false);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Edit personal information</ThemedText>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.form}>
          <ThemedText style={styles.label}>Full name</ThemedText>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor="#9BA1A6"
            style={styles.input}
          />
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
            placeholderTextColor="#9BA1A6"
            style={styles.input}
          />
          <ThemedText style={styles.label}>Phone</ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 0.5 }}>
              <TouchableOpacity
                style={[styles.input, styles.codeSelector]}
                onPress={() => setShowCodeList((v) => !v)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.codeText}>{phoneFlag} {phoneCode}</ThemedText>
                <Ionicons name={showCodeList ? "chevron-up" : "chevron-down"} size={16} color="#9BA1A6" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              keyboardType="phone-pad"
              placeholder={phoneFormat.hint}
              placeholderTextColor="#9BA1A6"
              maxLength={phoneFormat.max}
              style={[styles.input, { flex: 1 } ]}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#151718" />
            ) : (
              <ThemedText style={styles.buttonText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}
      {showCodeList ? (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownCard}>
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
            <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
              {(countries || []).filter((c) =>
                c.name.toLowerCase().includes(codeSearch.toLowerCase()) || c.code.includes(codeSearch)
              ).map((c) => (
                <TouchableOpacity
                  key={c.code + c.name}
                  style={styles.dropdownItemRow}
                  onPress={() => {
                    setPhoneCode(c.code);
                    setPhoneFlag(c.flag);
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
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#151718", padding: 20 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  form: { gap: 8 },
  label: { color: "#9BA1A6", fontSize: 12, marginTop: 8 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  codeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dropdown: {
    backgroundColor: "#1b1e1f",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
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
    paddingBottom: 16,
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
  button: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#151718", fontSize: 16, fontWeight: "700" },
});


