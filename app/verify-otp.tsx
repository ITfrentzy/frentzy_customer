import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { verifyOtp, loading, ackJustLoggedIn, requestOtp } = useAuth();
  const params = useLocalSearchParams();
  const phone = useMemo(() => (params?.phone as string) || "", [params]);

  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([null, null, null, null]);
  const lastSubmittedCodeRef = useRef<string | null>(null);
  const [invalidAttempt, setInvalidAttempt] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Focus the first box on mount
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // When all filled, auto submit
  useEffect(() => {
    const code = digits.join("");
    if (code.length !== 4) return;
    if (isVerifying) return;
    if (lastSubmittedCodeRef.current === code) return; // prevent repeat on same code
    lastSubmittedCodeRef.current = code;
    setInvalidAttempt(false);
    if (code.length === 4) {
      (async () => {
        setIsVerifying(true);
        try {
          const ok = await verifyOtp(phone, code);
          if (ok) {
            ackJustLoggedIn();
            Keyboard.dismiss();
            // Prefer returning to previous screen if possible; avoid pushing new routes
            const from = Array.isArray((params as any)?.from)
              ? (params as any).from[0]
              : (params as any)?.from;
            const hasVehicleId = (params as any)?.id != null;
            if (from === "vehicle" || hasVehicleId) {
              if (
                typeof (navigation as any)?.canGoBack === "function" &&
                navigation.canGoBack()
              ) {
                navigation.goBack();
              } else {
                const replaceParams: any = { ...(params as any) };
                router.replace({
                  pathname: "/vehicle/[id]",
                  params: replaceParams,
                });
              }
            } else {
              try {
                navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
              } catch {
                router.replace("/(tabs)");
              }
            }
          } else {
            // Mark invalid; do not re-attempt until user changes input
            setInvalidAttempt(true);
          }
        } finally {
          setIsVerifying(false);
        }
      })();
    }
  }, [digits, isVerifying]);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleChange = (index: number, text: string) => {
    const onlyDigits = (text || "").replace(/\D+/g, "");
    let next = [...digits];

    // Paste support: if user pastes all 4 from SMS
    if (onlyDigits.length >= 4) {
      next = onlyDigits.slice(0, 4).split("");
      setDigits(next);
      inputsRef.current[3]?.blur();
      setInvalidAttempt(false);
      return;
    }

    // Single char input
    const char = onlyDigits.slice(-1);
    next[index] = char;
    setDigits(next);
    setInvalidAttempt(false);

    if (char && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        style={styles.backButtonAbs}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ThemedText style={styles.title}>Enter verification code</ThemedText>
      <ThemedText style={styles.subtitle}>We sent a 4-digit code to</ThemedText>
      <ThemedText style={styles.phone}>{maskPhone(phone)}</ThemedText>

      <View style={styles.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={d}
            onChangeText={(t) => handleChange(i, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            style={[
              styles.otpBox,
              d ? styles.otpBoxFilled : null,
              invalidAttempt ? styles.otpBoxError : null,
            ]}
            keyboardType={
              Platform.select({ ios: "number-pad", android: "numeric" }) as any
            }
            textContentType={
              Platform.OS === "ios"
                ? ("oneTimeCode" as any)
                : ("oneTimeCode" as any)
            }
            autoComplete={
              Platform.select({
                ios: "one-time-code",
                android: "sms-otp",
              }) as any
            }
            maxLength={1}
            returnKeyType="next"
            importantForAutofill="yes"
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
            selectionColor="#fff"
            placeholder=""
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((prev) => (prev === i ? null : prev))}
          />
        ))}
      </View>

      {isVerifying ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#fff" />
            <ThemedText style={styles.loadingText}>Verifying…</ThemedText>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={async () => {
          if (cooldown > 0) return;
          try {
            await requestOtp(phone);
            setCooldown(30);
          } catch {}
        }}
        disabled={cooldown > 0}
        accessibilityRole="button"
        accessibilityLabel="Resend verification code"
        style={[styles.resendLink, cooldown > 0 && { opacity: 0.6 }]}
      >
        <ThemedText style={styles.resendText}>
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Didn’t get a code? Resend"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.replace({
            pathname: "/login",
            params: { ...(params as any), phone: "", clear: "1" } as any,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Change phone number"
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <ThemedText
          style={{
            color: "#9BA1A6",
            textDecorationLine: "underline",
            fontSize: 14,
          }}
        >
          Change phone number
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const BOX = 64;

function maskPhone(full: string) {
  if (!full) return "";
  const trimmed = full.replace(/\s+/g, "");
  const isPlus = trimmed.startsWith("+");
  let prefix = "";
  let rest = trimmed;
  if (isPlus) {
    const m = /^\+(\d{1,4})/.exec(trimmed);
    prefix = m ? `+${m[1]} ` : "+";
    rest = trimmed.slice((m?.[0] || "+").length);
  }
  const last = rest.slice(-4);
  const maskedCount = Math.max(
    3,
    Math.min(6, Math.max(0, rest.length - last.length))
  );
  return `${prefix}${"•".repeat(maskedCount)} ${last}`.trim();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151718",
    padding: 20,
    justifyContent: "center",
  },
  backButtonAbs: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9BA1A6",
    fontSize: 16,
    textAlign: "center",
  },
  phone: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  otpBox: {
    width: BOX,
    height: BOX,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    textAlign: "center",
    fontSize: 24,
  },
  otpBoxFilled: {
    borderColor: "#fff",
  },
  otpBoxFocused: {
    borderColor: "#A8B1FF",
    shadowColor: "#A8B1FF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  otpBoxError: {
    borderColor: "#E5484D",
  },
  loadingRow: { marginTop: 16, alignItems: "center" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: "rgba(24,26,28,0.95)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
    alignItems: "center",
    minWidth: 160,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: "#E5484D",
    textAlign: "center",
    marginTop: 12,
  },
  resendLink: {
    marginTop: 12,
    alignItems: "center",
  },
  resendText: {
    color: "#9BA1A6",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
