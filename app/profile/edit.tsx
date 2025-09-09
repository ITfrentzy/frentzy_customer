import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toDateString } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [showNationalityList, setShowNationalityList] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [countries, setCountries] = useState<
    Array<{ name: string; code: string; flag: string; iso2?: string }>
  >([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [examplesMap, setExamplesMap] = useState<Record<string, string>>({});
  const [selectedIso2, setSelectedIso2] = useState<string | undefined>(
    undefined
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const fieldPositionsRef = useRef<
    Record<string, { y: number; height: number }>
  >({});
  const registerField = (key: string) => (e: any) => {
    const y = e?.nativeEvent?.layout?.y || 0;
    const height = e?.nativeEvent?.layout?.height || 0;
    fieldPositionsRef.current[key] = { y, height };
  };
  const scrollToField = (key: string) => {
    requestAnimationFrame(() => {
      const pos = fieldPositionsRef.current[key];
      if (!pos) return;
      const { y, height } = pos;
      const visibleBottom = scrollY + windowHeight - keyboardHeight - 24;
      const fieldBottom = y + height;
      if (fieldBottom > visibleBottom) {
        const targetY = Math.max(0, y - 24);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }
    });
  };

  // Identity and status fields inspired by requirements
  type StatusType = "citizen" | "resident" | "gulf" | "visitor";
  const [status, setStatus] = useState<StatusType>("resident");
  const [idNumber, setIdNumber] = useState("");
  const [idVersion, setIdVersion] = useState<number>(1);
  const [borderNumber, setBorderNumber] = useState("");
  const [driverLicenseNo, setDriverLicenseNo] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState<string>("");
  const [idExpiry, setIdExpiry] = useState("");
  const [dlExpiry, setDlExpiry] = useState("");

  // Single date picker modal
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<
    "id" | "dl" | "dob" | null
  >(null);
  const [tempDate, setTempDate] = useState<string>(toDateString(new Date()));
  const [iosTempDate, setIosTempDate] = useState<Date>(new Date());
  const [showAndroidNativePicker, setShowAndroidNativePicker] = useState(false);

  const openDatePicker = (target: "id" | "dl" | "dob", initial: string) => {
    Keyboard.dismiss();
    setDatePickerTarget(target);
    setTempDate(initial || toDateString(new Date()));
    setIosTempDate(initial ? new Date(initial) : new Date());
    if (Platform.OS === "android") {
      setShowAndroidNativePicker(true);
      return;
    }
    setDatePickerOpen(true);
  };
  const onSelectDate = (day: DateData) => {
    setTempDate(day.dateString);
  };
  const confirmDate = () => {
    const finalDate =
      Platform.OS === "ios" ? toDateString(iosTempDate) : tempDate;
    if (datePickerTarget === "id") setIdExpiry(finalDate);
    if (datePickerTarget === "dl") setDlExpiry(finalDate);
    if (datePickerTarget === "dob") setDob(finalDate);
    setDatePickerOpen(false);
  };

  // Per-country national prefix and local number length (from ITU E.164 overview via IBAN table)
  // National prefix is used domestically and should be omitted with international country code
  const codeToNumbering: Record<
    string,
    { nationalPrefix: string | null; maxDigits: number; hint: string }
  > = {
    "+966": { nationalPrefix: "0", maxDigits: 9, hint: "5XXXXXXXX" }, // Saudi Arabia
    "+971": { nationalPrefix: "0", maxDigits: 9, hint: "5XXXXXXXX" }, // United Arab Emirates (8 to 9 digits → max 9)
    "+965": { nationalPrefix: null, maxDigits: 8, hint: "5XXXXXXX" }, // Kuwait
    "+974": { nationalPrefix: null, maxDigits: 8, hint: "3XXXXXXX" }, // Qatar
    "+973": { nationalPrefix: null, maxDigits: 8, hint: "3XXXXXXX" }, // Bahrain
    "+968": { nationalPrefix: null, maxDigits: 8, hint: "9XXXXXXX" }, // Oman
    "+20": { nationalPrefix: "0", maxDigits: 10, hint: "1XXXXXXXXX" }, // Egypt (mobiles)
    "+1": { nationalPrefix: "1", maxDigits: 10, hint: "XXXXXXXXXX" }, // US/Canada (NANP)
    "+44": { nationalPrefix: "0", maxDigits: 10, hint: "7XXXXXXXXX" }, // United Kingdom (7 to 10 → max 10)
    "+49": { nationalPrefix: "0", maxDigits: 11, hint: "1XXXXXXXXXX" }, // Germany (var. → cap at 11 common max)
    "+33": { nationalPrefix: "0", maxDigits: 9, hint: "6XXXXXXXX" }, // France
    "+34": { nationalPrefix: null, maxDigits: 9, hint: "6XXXXXXXX" }, // Spain
    "+39": { nationalPrefix: "0", maxDigits: 10, hint: "3XXXXXXXXX" }, // Italy (mobiles commonly 10)
    "+61": { nationalPrefix: "0", maxDigits: 9, hint: "4XXXXXXXX" }, // Australia
    "+62": { nationalPrefix: "0", maxDigits: 10, hint: "8XXXXXXXXX" }, // Indonesia
    "+63": { nationalPrefix: "0", maxDigits: 10, hint: "9XXXXXXXXX" }, // Philippines
    "+65": { nationalPrefix: null, maxDigits: 8, hint: "8XXXXXXX" }, // Singapore
    "+81": { nationalPrefix: "0", maxDigits: 10, hint: "8XXXXXXXXX" }, // Japan
    "+82": { nationalPrefix: "0", maxDigits: 10, hint: "1XXXXXXXXX" }, // South Korea
    "+86": { nationalPrefix: "0", maxDigits: 11, hint: "1XXXXXXXXXX" }, // China
    "+90": { nationalPrefix: "0", maxDigits: 10, hint: "5XXXXXXXXX" }, // Turkey
    "+92": { nationalPrefix: "0", maxDigits: 10, hint: "3XXXXXXXXX" }, // Pakistan
    "+98": { nationalPrefix: "0", maxDigits: 10, hint: "9XXXXXXXXX" }, // Iran
    "+212": { nationalPrefix: "0", maxDigits: 9, hint: "6XXXXXXXX" }, // Morocco
    "+216": { nationalPrefix: null, maxDigits: 8, hint: "2XXXXXXX" }, // Tunisia
    "+218": { nationalPrefix: "0", maxDigits: 9, hint: "9XXXXXXXX" }, // Libya
  };

  const numbering = codeToNumbering[phoneCode] || {
    nationalPrefix: null,
    maxDigits: 10,
    hint: "XXXXXXXXXX",
  };
  const phoneExample =
    selectedIso2 && examplesMap[selectedIso2]
      ? examplesMap[selectedIso2]
      : undefined;
  const phoneExampleDigits = phoneExample
    ? phoneExample.replace(/\D/g, "")
    : "";
  const phoneMax = phoneExampleDigits
    ? phoneExampleDigits.length
    : numbering.maxDigits;
  const phoneFirst3 = phoneExampleDigits ? phoneExampleDigits.slice(0, 3) : "";
  const phoneHintBase = phoneFirst3 || numbering.hint;
  const phoneHint = numbering.hint;

  // Compute dropdown max heights based on keyboard visibility
  const dropdownMaxHeight = Math.max(260, windowHeight - keyboardHeight - 120);
  const listMaxHeight = Math.max(160, dropdownMaxHeight - 120);
  // Keep ScrollView bottom padding minimal while keyboard is open
  const extraScrollPadding = 0;

  const idLabel = (() => {
    switch (status) {
      case "citizen":
        return "National ID";
      case "resident":
        return "Iqama";
      case "gulf":
        return "Gulf National Id";
      case "visitor":
        return "Passport No.";
      default:
        return "ID";
    }
  })();

  const idExpiryLabel = (() => {
    switch (status) {
      case "citizen":
        return "National ID Expiry Date";
      case "resident":
        return "Iqama expiry date";
      case "gulf":
        return "Gulf Id Expiry Date";
      case "visitor":
        return "Passport Expiry Date";
      default:
        return "ID Expiry Date";
    }
  })();

  useEffect(() => {
    // Enforce max length when country code changes
    if (phone.length > phoneMax) {
      setPhone(phone.slice(0, phoneMax));
    }
  }, [phoneCode, phoneMax]);

  // Keep dropdown card above the keyboard
  useEffect(() => {
    const onShow = (e: any) =>
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener("keyboardDidShow", onShow);
    const subHide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

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
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/codes"
        );
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
        const mapped: Array<{
          name: string;
          code: string;
          flag: string;
          iso2?: string;
        }> = ((json && json.data) || [])
          .map((c: any) => {
            const name = c?.name as string | undefined;
            const code = c?.dial_code as string | undefined;
            const iso2 = c?.code as string | undefined;
            if (!name || !code) return null;
            return {
              name,
              code,
              flag: toFlag(iso2),
              iso2: iso2?.toUpperCase(),
            };
          })
          .filter(Boolean)
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
        const res = await fetch(
          "https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.53/examples.mobile.json"
        );
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
    const { error } = await supabase
      .from("customer")
      .update({ full_name: fullName, email, phone: combinedPhone })
      .eq("UID", (user as any)?.UID || user.id);
    if (error) {
      console.warn("Profile save error:", error.message);
    }
    try {
      // Refresh auth context so Account screen gets latest name
      const { reloadUser } = (await import("@/context/AuthContext")) as any;
      if (typeof reloadUser === "function") await reloadUser();
    } catch {}
    setSaving(false);
    router.back();
  };

  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerRow, { marginBottom: 10 }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          Profile
        </ThemedText>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={10}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.form,
              { paddingBottom: 24 + extraScrollPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ref={(r) => {
              scrollRef.current = r;
            }}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Basic info</ThemedText>
              <ThemedText style={styles.sectionLabel}>Renter Type</ThemedText>
              <View style={styles.statusGrid}>
                {[
                  { key: "citizen", label: "Citizen" },
                  { key: "resident", label: "Resident" },
                  { key: "gulf", label: "Gulf citizen" },
                  { key: "visitor", label: "Visitor" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.statusButton,
                      status === (opt.key as any) && styles.statusButtonActive,
                    ]}
                    onPress={() => setStatus(opt.key as any)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        status === (opt.key as any) && styles.statusTextActive,
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              <ThemedText style={styles.label}>Full name</ThemedText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor="#9BA1A6"
                style={styles.input}
                onFocus={() => scrollToField("fullName")}
                onLayout={registerField("fullName")}
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
                onFocus={() => scrollToField("email")}
                onLayout={registerField("email")}
              />
            </View>

            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>
                Identity & licenses
              </ThemedText>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={styles.inlineLabelRow}>
                    <ThemedText style={styles.label}>
                      {idLabel}{" "}
                      <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                    </ThemedText>
                    {status === "visitor" ? (
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color="#9BA1A6"
                      />
                    ) : null}
                  </View>
                  <TextInput
                    value={idNumber}
                    onChangeText={(t) =>
                      setIdNumber(t.replace(/[^0-9A-Za-z]/g, ""))
                    }
                    keyboardType={
                      status === "visitor" ? "default" : "number-pad"
                    }
                    placeholder={
                      status === "resident" ? "Starts with 2, 10 digits" : ""
                    }
                    placeholderTextColor="#9BA1A6"
                    style={styles.input}
                    onFocus={() => scrollToField("idNumber")}
                    onLayout={registerField("idNumber")}
                    maxLength={status === "resident" ? 10 : 32}
                  />
                </View>
                {status === "resident" ? (
                  <View style={{ flex: 0.5 }}>
                    <ThemedText style={styles.label}>
                      Version{" "}
                      <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                    </ThemedText>
                    <View style={styles.versionRow}>
                      <TouchableOpacity
                        style={styles.versionBtn}
                        onPress={() => setIdVersion((v) => Math.max(1, v - 1))}
                      >
                        <ThemedText style={styles.versionBtnText}>—</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.versionValue}>
                        {idVersion}
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.versionBtn}
                        onPress={() => setIdVersion((v) => v + 1)}
                      >
                        <ThemedText style={styles.versionBtnText}>+</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>

              {status === "visitor" ? (
                <View>
                  <View style={styles.inlineLabelRow}>
                    <ThemedText style={styles.label}>Border No</ThemedText>
                    <Ionicons
                      name="information-circle-outline"
                      size={14}
                      color="#9BA1A6"
                    />
                  </View>
                  <TextInput
                    value={borderNumber}
                    onChangeText={(t) => setBorderNumber(t.replace(/\D/g, ""))}
                    keyboardType="number-pad"
                    placeholderTextColor="#9BA1A6"
                    style={styles.input}
                    onFocus={() => scrollToField("borderNumber")}
                    onLayout={registerField("borderNumber")}
                    maxLength={16}
                  />
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[styles.label, styles.labelTight]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {idExpiryLabel}{" "}
                    <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.input, styles.codeSelector]}
                    onPress={() => openDatePicker("id", idExpiry)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.codeText,
                        !idExpiry && { color: "#9BA1A6", fontWeight: "400" },
                      ]}
                    >
                      {idExpiry || "YYYY-MM-DD"}
                    </ThemedText>
                    <Ionicons name="calendar" size={16} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[styles.label, styles.labelTight]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Driver License Expiry Date{" "}
                    <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.input, styles.codeSelector]}
                    onPress={() => openDatePicker("dl", dlExpiry)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.codeText,
                        !dlExpiry && { color: "#9BA1A6", fontWeight: "400" },
                      ]}
                    >
                      {dlExpiry || "YYYY-MM-DD"}
                    </ThemedText>
                    <Ionicons name="calendar" size={16} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[styles.label, styles.labelTight]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Driver License No.{" "}
                    <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    value={driverLicenseNo}
                    onChangeText={(t) =>
                      setDriverLicenseNo(t.replace(/[^0-9A-Za-z]/g, ""))
                    }
                    keyboardType="default"
                    placeholderTextColor="#9BA1A6"
                    style={styles.input}
                    onFocus={() => scrollToField("driverLicenseNo")}
                    onLayout={registerField("driverLicenseNo")}
                    maxLength={20}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[styles.label, styles.labelTight]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Date Of Birth{" "}
                    <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.input, styles.codeSelector]}
                    onPress={() => openDatePicker("dob", dob)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.codeText,
                        !dob && { color: "#9BA1A6", fontWeight: "400" },
                      ]}
                    >
                      {dob || "YYYY-MM-DD"}
                    </ThemedText>
                    <Ionicons name="calendar" size={16} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>
                    Nationality{" "}
                    <ThemedText style={{ color: "#ff6b6b" }}>*</ThemedText>
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.input, styles.codeSelector]}
                    onPress={() => setShowNationalityList(true)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.codeText}>
                      {nationality || "Select nationality"}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={16} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { marginHorizontal: 16, marginTop: 8, marginBottom: 24 },
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#151718" />
              ) : (
                <ThemedText style={styles.buttonText}>Save changes</ThemedText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {showCodeList ? (
        <View style={styles.dropdownOverlay}>
          <View
            style={[
              styles.dropdownCard,
              { marginBottom: keyboardHeight, maxHeight: dropdownMaxHeight },
            ]}
          >
            <View style={styles.dropdownHeaderRow}>
              <ThemedText style={styles.dropdownTitle}>
                Select country code
              </ThemedText>
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
            <ScrollView
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator={false}
            >
              {(countries || [])
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(codeSearch.toLowerCase()) ||
                    c.code.includes(codeSearch)
                )
                .map((c) => (
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
                    <ThemedText style={styles.dropdownFlag}>
                      {c.flag}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.dropdownCountry}>
                        {c.name}
                      </ThemedText>
                      <ThemedText style={styles.dropdownCode}>
                        {c.code}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
      {/* Android native spinner picker */}
      {Platform.OS === "android" && showAndroidNativePicker ? (
        <DateTimePicker
          value={iosTempDate}
          mode="date"
          display="spinner"
          maximumDate={datePickerTarget === "dob" ? new Date() : undefined}
          onChange={(event, selectedDate) => {
            if ((event as any)?.type !== "dismissed" && selectedDate) {
              const final = toDateString(selectedDate);
              if (datePickerTarget === "id") setIdExpiry(final);
              if (datePickerTarget === "dl") setDlExpiry(final);
              if (datePickerTarget === "dob") setDob(final);
            }
            setShowAndroidNativePicker(false);
          }}
          themeVariant="dark"
        />
      ) : null}
      {/* Single Date Picker Modal */}
      <Modal
        visible={datePickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View style={styles.dropdownOverlay}>
          <View style={[styles.dropdownCard, { paddingBottom: 8 }]}>
            <View style={styles.dropdownHeaderRow}>
              <ThemedText style={styles.dropdownTitle}>Select date</ThemedText>
              <TouchableOpacity onPress={confirmDate}>
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            {Platform.OS === "ios" ? (
              <View
                style={{
                  backgroundColor: "#1b1e1f",
                  borderRadius: 12,
                  padding: 8,
                  alignItems: "center",
                }}
              >
                <DateTimePicker
                  value={iosTempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={
                    datePickerTarget === "dob" ? new Date() : undefined
                  }
                  onChange={(e, d) => {
                    if (d) setIosTempDate(d);
                  }}
                  style={{ width: "100%" }}
                />
              </View>
            ) : (
              <Calendar
                style={{ alignSelf: "stretch" }}
                current={tempDate}
                maxDate={
                  datePickerTarget === "dob"
                    ? toDateString(new Date())
                    : undefined
                }
                onDayPress={onSelectDate}
                markedDates={{
                  [tempDate]: {
                    selected: true,
                    selectedColor: "#fff",
                    selectedTextColor: "#000",
                  },
                }}
                enableSwipeMonths
                hideExtraDays={false}
                showSixWeeks
                theme={{
                  calendarBackground: "#1b1e1f",
                  textSectionTitleColor: "#fff",
                  monthTextColor: "#fff",
                  dayTextColor: "#fff",
                  todayTextColor: "#fff",
                  selectedDayBackgroundColor: "#fff",
                  selectedDayTextColor: "#000",
                  arrowColor: "#fff",
                  textDisabledColor: "#9BA1A6",
                }}
              />
            )}
            {Platform.OS !== "ios" ? (
              <View style={{ paddingTop: 8 }}>
                <TouchableOpacity
                  onPress={confirmDate}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <ThemedText
                    style={{
                      color: "#151718",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Confirm
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
      {showNationalityList ? (
        <View style={styles.dropdownOverlay}>
          <View
            style={[
              styles.dropdownCard,
              { marginBottom: keyboardHeight, maxHeight: dropdownMaxHeight },
            ]}
          >
            <View style={styles.dropdownHeaderRow}>
              <ThemedText style={styles.dropdownTitle}>
                Select nationality
              </ThemedText>
              <TouchableOpacity onPress={() => setShowNationalityList(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Search country"
              placeholderTextColor="#9BA1A6"
              value={nationalitySearch}
              onChangeText={setNationalitySearch}
              style={styles.dropdownSearch}
            />
            <ScrollView
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator={false}
            >
              {(countries || [])
                .filter((c) =>
                  c.name.toLowerCase().includes(nationalitySearch.toLowerCase())
                )
                .map((c) => (
                  <TouchableOpacity
                    key={c.name + c.code}
                    style={styles.dropdownItemRow}
                    onPress={() => {
                      setNationality(c.name);
                      setShowNationalityList(false);
                      setNationalitySearch("");
                    }}
                  >
                    <ThemedText style={styles.dropdownFlag}>
                      {c.flag}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.dropdownCountry}>
                        {c.name}
                      </ThemedText>
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
  container: { flex: 1, backgroundColor: "#151718" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  form: { gap: 8 },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
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
  label: { color: "#9BA1A6", fontSize: 12, marginTop: 8, marginBottom: 6 },
  labelTight: { marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
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
  sectionLabel: {
    color: "#9BA1A6",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  statusButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.12)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
  },
  statusButtonActive: { backgroundColor: "#fff", borderColor: "#fff" },
  statusText: { color: "#C8CDD2", fontSize: 14, fontWeight: "600" },
  statusTextActive: { color: "#151718" },
  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  versionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  versionBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  versionValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
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
  },
  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  footerBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  primaryBtnFull: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnFullText: {
    color: "#151718",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonText: { color: "#151718", fontSize: 16, fontWeight: "700" },
});
