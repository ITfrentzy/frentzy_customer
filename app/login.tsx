import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getExampleNumber, isPossiblePhoneNumber, isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import PhoneInput from "react-native-phone-number-input";

export default function LoginScreen() {
  const router = useRouter();
  const { requestOtp, loading } = useAuth();
  const [phoneE164, setPhoneE164] = useState<string | undefined>(undefined);
  const [isValid, setIsValid] = useState<boolean>(false);
  const params = useLocalSearchParams();
  const phoneRef = useRef<any>(null);
  const prevDigitsRef = useRef<string>("");
  const prevPossibleRef = useRef<boolean>(false);
  const [raw, setRaw] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string>("SA");
  const [selectedLabel, setSelectedLabel] = useState<string>("🇸🇦");
  const [selectedCallingCode, setSelectedCallingCode] = useState<string>("+966");
  const [phonePlaceholder, setPhonePlaceholder] = useState<string>("Phone number");

  const isoToEmojiFlag = (iso2?: string) => {
    if (!iso2) return "";
    const upper = iso2.toUpperCase();
    return upper
      .split("")
      .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
      .join("");
  };

  const computePlaceholder = (iso2: string) => {
    try {
      const ex: any = getExampleNumber(iso2 as any, examples as any);
      const national: string = (ex?.formatNational?.() || ex?.nationalNumber || "").toString();
      if (!national) return "Phone number";
      const digits = national.replace(/\D+/g, "");
      const keep = Math.min(2, Math.max(1, digits.length));
      let kept = 0;
      const masked = national.replace(/\d/g, (d) => {
        if (kept < keep) {
          kept += 1;
          return d;
        }
        return "x";
      });
      const compact = masked.toUpperCase().replace(/\s+/g, "");
      return compact;
    } catch {
      return "Phone number";
    }
  };

  const handlePhoneChange = (text: string) => {
    const digits = (text || "").replace(/\D+/g, "");
    const prevDigits = prevDigitsRef.current || "";
    const isIncreasing = digits.length > prevDigits.length;

    // Check plausibility using parsed number for the selected country
    let possibleNow = true;
    try {
      const parsed = parsePhoneNumber(digits, selectedCode as any);
      possibleNow = parsed ? parsed.isPossible() : digits.length === 0;
    } catch {
      possibleNow = true; // don't block typing on parsing errors
    }

    // Block only when previously possible and now would become impossible (i.e. too long)
    if (isIncreasing && prevPossibleRef.current && !possibleNow) {
      return; // ignore extra input beyond max
    }

    setRaw(digits);

    // Keep E.164 only when valid
    try {
      const parsed = parsePhoneNumber(digits, selectedCode as any);
      const e164 = parsed?.number;
      const valid = !!(e164 && isValidPhoneNumber(e164));
      setIsValid(valid);
      setPhoneE164(valid ? e164 : undefined);
    } catch {
      setIsValid(false);
      setPhoneE164(undefined);
    }

    // Update refs for next change
    prevDigitsRef.current = digits;
    prevPossibleRef.current = possibleNow;
  };

  // Sync selected country from outside via route params: country / defaultCode / iso2
  useEffect(() => {
    const p: any = params || {};
    const incoming = (p.country || p.defaultCode || p.iso2 || "").toString().toUpperCase();
    if (incoming && incoming.length === 2 && incoming !== selectedCode) {
      setSelectedCode(incoming);
      setSelectedLabel(isoToEmojiFlag(incoming));
      setPhonePlaceholder(computePlaceholder(incoming));
    }
  }, [params]);

  // If phone is provided from outside, reflect it in the input and compute validity
  useEffect(() => {
    const p: any = params || {};
    const incomingPhone = typeof p.phone === "string" ? p.phone : undefined;
    const shouldClear = (p.clear === "1" || p.clear === 1 || p.clear === true) as boolean;
    if (shouldClear) {
      prevDigitsRef.current = "";
      prevPossibleRef.current = false;
      setRaw("");
      setPhoneE164(undefined);
      setIsValid(false);
    } else if (incomingPhone) {
      handlePhoneChange(incomingPhone);
    }
    // Re-run if selected country changes to update flag
    try {
      const cc = (phoneRef as any)?.current?.getCallingCode?.();
      if (cc) setSelectedCallingCode(`+${cc}`);
    } catch {}
    // Recompute possibility baseline for current digits with new country
    try {
      const digits = prevDigitsRef.current || "";
      const possible = isPossiblePhoneNumber(digits as any, selectedCode as any) as unknown as boolean;
      prevPossibleRef.current = possible;
    } catch {
      prevPossibleRef.current = true;
    }
    // Update placeholder for current/changed country
    setPhonePlaceholder(computePlaceholder(selectedCode));
  }, [selectedCode]);

  const onSubmit = async () => {
    if (!isValid || !phoneE164) return;
    await requestOtp(phoneE164);
    // Navigate to separate OTP screen; final navigation happens after verification
    router.replace({ pathname: "/verify-otp" as any, params: { ...(params as any), phone: phoneE164 } as any });
  };

  return (
    <>
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign in</ThemedText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={() => (phoneRef as any)?.current?.setState?.({ modalVisible: true })}
          activeOpacity={0.7}
          style={styles.externalFlagButton}
        >
          <Ionicons name="chevron-down" size={16} color="#9BA1A6" />
          <ThemedText style={styles.flagText}>{selectedLabel}</ThemedText>
          <ThemedText style={styles.callingCodeText}>{selectedCallingCode}</ThemedText>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          {/* @ts-expect-error Upstream types not compatible with React 19 JSX */}
          <PhoneInput
            ref={phoneRef}
            defaultCode={selectedCode as any}
            key={`phone-${selectedCode}`}
            value={raw}
            onChangeText={handlePhoneChange}
            onChangeCountry={(country: any) => {
              const iso2 = (country?.cca2 || country?.code || country?.alpha2 || selectedCode || "SA").toString().toUpperCase();
              setSelectedCode(iso2);
              setSelectedLabel(isoToEmojiFlag(iso2));
              const calling = country?.callingCode;
              const cc = Array.isArray(calling) ? calling[0] : calling;
              if (cc) setSelectedCallingCode(`+${cc}`);
            }}
            textInputProps={{
              editable: !loading,
              placeholder: phonePlaceholder,
              keyboardType: "phone-pad",
              placeholderTextColor: "#9BA1A6",
              textContentType: "telephoneNumber",
              autoComplete: "tel" as any,
            }}
            layout="first"
            containerStyle={styles.phoneInputContainer}
            textContainerStyle={styles.phoneTextContainer}
            textInputStyle={styles.phoneTextInput}
            codeTextStyle={styles.hiddenCallingCode}
            flagButtonStyle={styles.hiddenFlagButton}
            countryPickerButtonStyle={styles.hiddenFlagButton}
            disableArrowIcon={true}
            withDarkTheme
          />
        </View>
      </View>
      {(() => { const disabledSend = loading || !isValid || raw.length === 0; return (
      <TouchableOpacity style={[styles.button, disabledSend && { opacity: 0.6 }]} onPress={onSubmit} disabled={disabledSend}>
        {loading ? <ActivityIndicator color="#151718" /> : <ThemedText style={styles.buttonText}>Send code</ThemedText>}
      </TouchableOpacity>
      ); })()}
      
    </ThemedView>
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
  button: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#151718", fontSize: 16, fontWeight: "700" },
  phoneInputContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    
    borderColor: "rgba(230, 232, 235, 0.14)",
    width: "100%",
    height: 48,
  },
  phoneTextContainer: {
    backgroundColor: "transparent",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 0,
    paddingLeft: 0,
  },
  phoneTextInput: {
    color: "#fff",
    height: 48,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: 15
  },
  hiddenCallingCode: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
    left: -9999,
    top: -9999,
  },
  phoneFlagButton: {
    paddingHorizontal: 6,
    marginLeft: 0,
    transform: [{ scale: 1.25 }],
  },
  hiddenFlagButton: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
    overflow: "hidden",
    left: -9999,
    top: -9999,
  },
  externalFlagButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
    paddingHorizontal: 10,
    height: 48,
  },
  dropdownInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 2,
  },
  dropdownInlineArrow: {
    color: "#9BA1A6",
    fontSize: 16,
    marginLeft: 4,
  },
  dropdownInlineText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 2,
  },
  flagText: {
    fontSize: 20,
    marginRight: 6,
  },
  callingCodeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
});


