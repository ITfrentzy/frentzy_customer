import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function OrderSummaryScreen() {
  const router = useRouter();
  const {
    name,
    brand,
    imageUrl,
    startDate,
    endDate,
    pickupTime,
    dropoffTime,
    total,
    addons: addonsParam,
    rentalDays: rentalDaysParam,
    pricePerDay: pricePerDayParam,
    type: typeParam,
    year: yearParam,
  } = useLocalSearchParams();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const raw = String(timeStr).trim();
    // If already contains AM/PM, normalize spacing and casing
    if (/\b(am|pm)\b/i.test(raw)) {
      const normalized = raw.replace(
        /\s*(am|pm)\s*$/i,
        (_, ap) => ` ${String(ap).toUpperCase()}`
      );
      return normalized;
    }
    // Expect formats like HH:mm or H:mm; convert to 12h with AM/PM
    const m = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (!m) return raw; // fallback
    let hours = parseInt(m[1], 10);
    const minutes = m[2] ?? "00";
    if (Number.isNaN(hours) || hours < 0 || hours > 23) return raw;
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes} ${suffix}`;
  };

  const rentalDays = (() => {
    try {
      const s = startDate ? new Date(String(startDate)) : null;
      const e = endDate ? new Date(String(endDate)) : null;
      if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
        return Number(rentalDaysParam || 1);
      const ms = Math.max(
        1,
        Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
      );
      return ms;
    } catch {
      return Number(rentalDaysParam || 1);
    }
  })();

  let addons: { id: string; label: string; price: number }[] = [];
  try {
    if (addonsParam) {
      const parsed = JSON.parse(String(addonsParam));
      if (Array.isArray(parsed)) addons = parsed;
    }
  } catch {}

  const paymentMethodLabel = isPaid
    ? paymentMethod === "apple"
      ? "Apple Pay"
      : paymentMethod === "samsung"
      ? "Samsung Pay"
      : "Credit Card"
    : "Not paid yet";

  const handlePay = (method: "card" | "apple" | "samsung") => {
    setPaymentMethod(method);
    setIsPaid(true);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {isPaid ? "Booking Confirmed" : "Review & Pay"}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        {isPaid && (
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <ThemedText style={styles.successTitle}>
              Payment Successful!
            </ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Your booking has been confirmed
            </ThemedText>
          </Animated.View>
        )}

        {/* Vehicle Card */}
        {!isPaid ? (
          <>
            <Animated.View
              style={[
                styles.vehicleCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.vehicleImageContainer}>
                <Image
                  source={{
                    uri:
                      (imageUrl as string) ||
                      "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&auto=format&fit=crop&q=60",
                  }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.vehicleInfo}>
                <ThemedText style={styles.vehicleName}>
                  {String(name || "Vehicle")}
                </ThemedText>
                {brand && (
                  <ThemedText style={styles.vehicleBrand}>
                    {String(brand)}
                  </ThemedText>
                )}
                <View style={styles.vehicleFeatures}>
                  <View style={styles.featureTag}>
                    <Ionicons name="calendar" size={20} color="#4CAF50" />
                    <ThemedText style={styles.featureText}>
                      Pickup: {formatDate(String(startDate || ""))} ·{" "}
                      {formatTime(String(pickupTime || ""))}
                    </ThemedText>
                  </View>
                  <View style={styles.featureTag}>
                    <Ionicons name="calendar" size={20} color="#4CAF50" />
                    <ThemedText style={styles.featureText}>
                      Dropoff: {formatDate(String(endDate || ""))} ·{" "}
                      {formatTime(String(dropoffTime || ""))}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.detailsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <ThemedText style={styles.detailsTitle}>
                Detailed Order
              </ThemedText>
              <View style={{ gap: 10 }}>
                <View
                  style={[
                    styles.detailRow,
                    addons.length === 0 ? styles.detailRowNoBorder : null,
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={styles.detailLabel}>Duration</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {rentalDays} {rentalDays === 1 ? "day" : "days"}
                    </ThemedText>
                  </View>
                </View>

                {pricePerDayParam ? (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="pricetag-outline"
                        size={20}
                        color="#4CAF50"
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Price</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        ${String(pricePerDayParam)} / day × {rentalDays}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.detailValue}>
                      ${Number(pricePerDayParam || 0) * rentalDays}
                    </ThemedText>
                  </View>
                ) : null}

                {addons.length > 0 && (
                  <View>
                    <ThemedText style={styles.detailsTitle}>Add-ons</ThemedText>
                    <View style={{ gap: 6 }}>
                      {addons.map((a, idx) => (
                        <View
                          key={a.id}
                          style={[
                            styles.detailRow,
                            idx === addons.length - 1
                              ? styles.detailRowNoBorder
                              : null,
                          ]}
                        >
                          <View style={styles.detailIcon}>
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#4CAF50"
                            />
                          </View>
                          <View style={styles.detailContent}>
                            <ThemedText style={styles.detailLabel}>
                              {a.label}
                            </ThemedText>
                            <ThemedText style={styles.detailValue}>
                              ${a.price} / day × {rentalDays}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.detailValue}>
                            ${a.price * rentalDays}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {addons.length > 0 ? <View style={styles.orderDivider} /> : null}
              <View style={styles.orderRow}>
                <ThemedText style={styles.orderTotalLabel}>Total</ThemedText>
                <ThemedText style={styles.orderTotalValue}>
                  ${String(total || "0")}
                </ThemedText>
              </View>
              <ThemedText style={[styles.totalNote, { marginTop: 8 }]}>
                Select a payment method to complete your booking.
              </ThemedText>
            </Animated.View>
          </>
        ) : (
          <Animated.View
            style={[
              styles.vehicleCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.vehicleImageContainer}>
              <Image
                source={{
                  uri:
                    (imageUrl as string) ||
                    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&auto=format&fit=crop&q=60",
                }}
                style={styles.vehicleImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.vehicleInfo}>
              <ThemedText style={styles.vehicleName}>
                {String(name || "Vehicle")}
              </ThemedText>
              {brand && (
                <ThemedText style={styles.vehicleBrand}>
                  {String(brand)}
                </ThemedText>
              )}
              <View style={styles.vehicleFeatures}>
                <View style={styles.featureTag}>
                  <Ionicons name="calendar" size={20} color="#4CAF50" />
                  <ThemedText style={styles.featureText}>
                    Pickup: {formatDate(String(startDate || ""))} ·{" "}
                    {formatTime(String(pickupTime || ""))}
                  </ThemedText>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="calendar" size={20} color="#4CAF50" />
                  <ThemedText style={styles.featureText}>
                    Dropoff: {formatDate(String(endDate || ""))} ·{" "}
                    {formatTime(String(dropoffTime || ""))}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Booking Details (paid only) */}
        {isPaid && (
          <Animated.View
            style={[
              styles.detailsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <ThemedText style={styles.detailsTitle}>Booking Details</ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="receipt" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Booking ID</ThemedText>
                <ThemedText style={styles.detailValue}>
                  #FRZ{Date.now().toString().slice(-8)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="card" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>
                  Payment Method
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {paymentMethodLabel}
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Status</ThemedText>
                <View style={styles.statusContainer}>
                  <ThemedText style={styles.statusText}>Confirmed</ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Total Card removed */}
        {false && (
          <Animated.View
            style={[
              styles.totalCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.totalHeader}>
              <ThemedText style={styles.totalTitle}>Total Amount</ThemedText>
              <ThemedText style={styles.totalAmount}>
                ${String(total || "0")}
              </ThemedText>
            </View>
            <View style={styles.totalDivider} />
            <ThemedText style={styles.totalNote}>
              {isPaid
                ? "Payment processed successfully. You will receive a confirmation email shortly."
                : "Select a payment method to complete your booking."}
            </ThemedText>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {!isPaid ? (
            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={[styles.payButton, styles.payCard]}
                activeOpacity={0.9}
                onPress={() => handlePay("card")}
              >
                <Ionicons name="card" size={20} color="#151718" />
                <ThemedText style={styles.payButtonTextDark}>
                  Pay with Credit Card
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payButton, styles.payApple]}
                activeOpacity={0.9}
                onPress={() => handlePay("apple")}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <ThemedText style={styles.payButtonTextLight}>
                  Pay with Apple Pay
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payButton, styles.paySamsung]}
                activeOpacity={0.9}
                onPress={() => handlePay("samsung")}
              >
                <Ionicons name="logo-android" size={20} color="#fff" />
                <ThemedText style={styles.payButtonTextLight}>
                  Pay with Samsung Pay
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => router.push("/(tabs)")}
              >
                <Ionicons name="home" size={20} color="#fff" />
                <ThemedText style={styles.primaryButtonText}>
                  Back to Home
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => router.push("/bookings")}
              >
                <Ionicons name="list" size={20} color="#4CAF50" />
                <ThemedText style={styles.secondaryButtonText}>
                  View Bookings
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#0A0A0A",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 22,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Success Section
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 20,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    color: "#9BA1A6",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  vehicleImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  vehicleImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
  },
  vehicleBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    padding: 8,
    backdropFilter: "blur(10px)",
  },
  vehicleInfo: {
    gap: 12,
  },
  vehicleName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  vehicleBrand: {
    color: "#9BA1A6",
    fontSize: 16,
    fontWeight: "500",
  },
  vehicleFeatures: {
    gap: 8,
  },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76,175,80,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.22)",
  },
  featureText: {
    color: "#B7F7C2",
    fontSize: 13,
    fontWeight: "700",
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  // Detailed Order Card (pre-payment)
  orderCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  orderLabel: {
    color: "#9BA1A6",
    fontSize: 14,
    fontWeight: "500",
  },
  orderValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  orderDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 4,
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  orderIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(76,175,80,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemLabel: {
    color: "#9BA1A6",
    fontSize: 12,
    marginBottom: 4,
  },
  orderItemValue: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  orderChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  orderChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  orderTotalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  orderTotalValue: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "900",
  },
  detailsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  detailRowNoBorder: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(76,175,80,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: "#9BA1A6",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    backgroundColor: "rgba(76,175,80,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  statusText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Total Card
  totalCard: {
    backgroundColor: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  totalAmount: {
    color: "#4CAF50",
    fontSize: 28,
    fontWeight: "900",
  },
  totalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  totalNote: {
    color: "#9BA1A6",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Action Buttons
  actionsContainer: {
    gap: 12,
  },
  paymentButtons: {
    gap: 12,
  },
  payButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  payCard: {
    backgroundColor: "#fff",
  },
  payApple: {
    backgroundColor: "#151718",
    borderWidth: 2,
    borderColor: "#fff",
  },
  paySamsung: {
    backgroundColor: "#122A5C",
    borderWidth: 0,
  },
  payButtonTextDark: {
    color: "#151718",
    fontSize: 16,
    fontWeight: "800",
  },
  payButtonTextLight: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "700",
  },
});
