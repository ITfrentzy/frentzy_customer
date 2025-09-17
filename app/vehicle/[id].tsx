import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { user, justLoggedIn, ackJustLoggedIn } = useAuth();
  const {
    id,
    name,
    brand,
    price,
    imageUrl,
    year,
    type,
    discount,
    startDate,
    endDate,
    pickupTime,
    dropoffTime,
    seats,
    transmission,
    distance,
  } = useLocalSearchParams();

  const screenWidth = Dimensions.get("window").width;
  const sheetMaxHeight = Math.round(Dimensions.get("window").height * 0.6);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const validateProfileAndMaybeShow = async (): Promise<boolean> => {
    try {
      if (!user) return false;
      const [{ data: base }, { data: info }] = await Promise.all([
        supabase
          .from("customer")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("customer_info")
          .select(
            [
              "renter_type",
              "national_id",
              "national_id_expiry_date",
              "resident_id",
              "resident_id_expiry_date",
              "gulf_national_id",
              "gulf_national_id_expiry_date",
              "passport_no",
              "passport_expiry_date",
              "license_expiry_date",
              "license_number",
              "date_of_birth",
              "nationality",
              "phone_number",
              "version",
              "border_nnumber",
            ].join(", ")
          )
          .eq("customer_id", user.id)
          .maybeSingle(),
      ]);
      const missing: string[] = [];
      const renterType = String((info as any)?.renter_type || "")
        .trim()
        .toLowerCase();

      // Common required fields (match Edit screen canSave)
      const nationalityVal = String((info as any)?.nationality || "").trim();
      const dlNo = String((info as any)?.license_number || "").trim();
      const dlExp = String((info as any)?.license_expiry_date || "").trim();
      const dob = String((info as any)?.date_of_birth || "").trim();

      if (!nationalityVal) missing.push("Nationality");
      if (!dlNo) missing.push("Driver license no.");
      if (!dlExp) missing.push("Driver license expiry date");
      if (!dob) missing.push("Date of birth");

      const statusMissing: string[] = [];
      const idVer = (info as any)?.version;
      if (renterType === "resident") {
        const rId = String((info as any)?.resident_id || "").trim();
        const rExp = String(
          (info as any)?.resident_id_expiry_date || ""
        ).trim();
        if (!rId) statusMissing.push("Resident ID");
        if (!(typeof idVer === "number" && idVer >= 1))
          statusMissing.push("Version");
        if (!rExp) statusMissing.push("Resident ID expiry date");
      } else if (renterType === "citizen") {
        const cId = String((info as any)?.national_id || "").trim();
        const cExp = String(
          (info as any)?.national_id_expiry_date || ""
        ).trim();
        if (!cId) statusMissing.push("National ID");
        if (!cExp) statusMissing.push("National ID expiry date");
      } else if (renterType === "gulf") {
        const gId = String((info as any)?.gulf_national_id || "").trim();
        const gExp = String(
          (info as any)?.gulf_national_id_expiry_date || ""
        ).trim();
        if (!gId) statusMissing.push("Gulf National ID");
        if (!gExp) statusMissing.push("Gulf ID expiry date");
      } else if (renterType === "visitor") {
        const pNum = String((info as any)?.passport_no || "").trim();
        const pExp = String((info as any)?.passport_expiry_date || "").trim();
        if (!pNum) statusMissing.push("Passport No.");
        if (!pExp) statusMissing.push("Passport expiry date");
        // Border number is optional per Edit screen
      }

      if (!renterType) {
        if (!missing.includes("Renter Type")) missing.push("Renter Type");
      } else if (statusMissing.length > 0) {
        if (!missing.includes("Renter Type")) missing.push("Renter Type");
        missing.push(...statusMissing);
      }

      if (missing.length > 0) {
        setMissingFields(missing);
        setShowProfileModal(true);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user && justLoggedIn) {
        validateProfileAndMaybeShow().finally(() => ackJustLoggedIn());
      }
      return () => {};
    }, [user, justLoggedIn])
  );

  const parsedPrice = useMemo(() => {
    const n = Number(price ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [price]);

  const parsedDiscount = useMemo(() => {
    const disc = Number(
      discount ?? (String(type).toLowerCase() === "ev" ? 12 : 0)
    );
    return Number.isFinite(disc) ? disc : 0;
  }, [discount, type]);

  const finalPrice = useMemo(() => {
    return parsedDiscount > 0
      ? Math.round(parsedPrice * (1 - parsedDiscount / 100))
      : parsedPrice;
  }, [parsedPrice, parsedDiscount]);

  const photos = useMemo(() => {
    const cover =
      (imageUrl as string) ||
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&auto=format&fit=crop&q=60";
    const fallbacks = [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=60",
    ];
    return [cover, ...fallbacks];
  }, [imageUrl]);

  const [selectedAdditionals, setSelectedAdditionals] = useState<
    Record<string, boolean>
  >({});
  const [expandedAdditionals, setExpandedAdditionals] = useState<
    Record<string, boolean>
  >({});
  const [overflowAdditionals, setOverflowAdditionals] = useState<
    Record<string, boolean>
  >({});
  const additionals = useMemo(
    () => [
      {
        id: "gps",
        label: "GPS Navigation",
        description: "Turn‑by‑turn navigation with real‑time traffic",
        price: 5,
      },
      {
        id: "seat",
        label: "Child Seat",
        description: "ECE R44/04 certified seat for 9–18 kg (Group 1)",
        price: 7,
      },
      {
        id: "driver",
        label: "Additional Driver",
        description: "Authorize one more driver on the rental",
        price: 10,
      },
      {
        id: "wifi",
        label: "Wi‑Fi Hotspot",
        description: "4G hotspot up to 5 devices, unlimited local data",
        price: 6,
      },
    ],
    []
  );

  const features = useMemo(
    () => [
      { id: "ac", label: "A/C", icon: "snow" },
      { id: "bt", label: "Bluetooth", icon: "bluetooth" },
      { id: "cam", label: "Rear Camera", icon: "camera" },
      { id: "auto", label: "Automatic", icon: "settings" },
    ],
    []
  );

  const extrasPerDay = useMemo(() => {
    return additionals.reduce(
      (sum, a) => (selectedAdditionals[a.id] ? sum + a.price : sum),
      0
    );
  }, [additionals, selectedAdditionals]);

  const rentalDays = useMemo(() => {
    const s = startDate ? new Date(String(startDate)) : null;
    const e = endDate ? new Date(String(endDate)) : null;
    if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
      return 1;
    const ms = Math.max(
      1,
      Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    );
    return ms;
  }, [startDate, endDate]);

  const perDayTotal = useMemo(
    () => finalPrice + extrasPerDay,
    [finalPrice, extrasPerDay]
  );
  const grandTotal = useMemo(
    () => perDayTotal * rentalDays,
    [perDayTotal, rentalDays]
  );
  const originalPerDayTotal = useMemo(
    () => parsedPrice + extrasPerDay,
    [parsedPrice, extrasPerDay]
  );
  const originalGrandTotal = useMemo(
    () => originalPerDayTotal * rentalDays,
    [originalPerDayTotal, rentalDays]
  );
  const savingsTotal = useMemo(() => {
    if (parsedDiscount <= 0) return 0;
    const perDaySavings = Math.max(0, parsedPrice - finalPrice);
    return perDaySavings * rentalDays;
  }, [parsedDiscount, parsedPrice, finalPrice, rentalDays]);
  const baseSubtotal = useMemo(
    () => finalPrice * rentalDays,
    [finalPrice, rentalDays]
  );
  const extrasSubtotal = useMemo(
    () => extrasPerDay * rentalDays,
    [extrasPerDay, rentalDays]
  );
  const [showPriceSheet, setShowPriceSheet] = useState<boolean>(false);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.title} numberOfLines={1}>
          {name || "Car"}
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / screenWidth
              );
              setActiveIdx(idx);
            }}
          >
            {photos.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={[styles.heroImage, { width: screenWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIdx && styles.dotActive]}
              />
            ))}
          </View>
          {parsedDiscount > 0 && (
            <View style={styles.discountBadge}>
              <ThemedText style={styles.discountText}>
                Save {parsedDiscount}%
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
          {brand ? (
            <ThemedText style={styles.brandYear}>{brand as string}</ThemedText>
          ) : null}
          <View style={styles.specGrid}>
            <View style={styles.specTile}>
              <View style={styles.specTileRow}>
                <View style={styles.specIconWrap}>
                  <Ionicons name="pricetag-outline" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.specLabel}>Price</ThemedText>
                  <ThemedText style={styles.specValue}>
                    ${finalPrice} / day
                  </ThemedText>
                </View>
              </View>
            </View>
            {type ? (
              <View style={styles.specTile}>
                <View style={styles.specTileRow}>
                  <View style={styles.specIconWrap}>
                    <Ionicons name="car" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.specLabel}>Type</ThemedText>
                    <ThemedText style={styles.specValue}>{type}</ThemedText>
                  </View>
                </View>
              </View>
            ) : null}
            {seats ? (
              <View style={styles.specTile}>
                <View style={styles.specTileRow}>
                  <View style={styles.specIconWrap}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.specLabel}>Seats</ThemedText>
                    <ThemedText style={styles.specValue}>{seats}</ThemedText>
                  </View>
                </View>
              </View>
            ) : null}
            {transmission ? (
              <View style={styles.specTile}>
                <View style={styles.specTileRow}>
                  <View style={styles.specIconWrap}>
                    <Ionicons name="settings" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.specLabel}>
                      Transmission
                    </ThemedText>
                    <ThemedText style={styles.specValue}>
                      {transmission}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : null}
            {distance ? (
              <View style={styles.specTile}>
                <View style={styles.specTileRow}>
                  <View style={styles.specIconWrap}>
                    <Ionicons name="location-outline" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.specLabel}>Distance</ThemedText>
                    <ThemedText style={styles.specValue}>
                      {distance} km away
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : null}
            {year ? (
              <View style={styles.specTile}>
                <View style={styles.specTileRow}>
                  <View style={styles.specIconWrap}>
                    <Ionicons name="time-outline" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.specLabel}>Year</ThemedText>
                    <ThemedText style={styles.specValue}>
                      {year as string}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Features</ThemedText>
            <View style={styles.featuresRow}>
              {features.map((f) => (
                <View key={f.id} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={16} color="#9BA1A6" />
                  <ThemedText style={styles.featureText}>{f.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Additionals</ThemedText>
            <View style={styles.additionalsCol}>
              {additionals.map((a) => {
                const isOn = !!selectedAdditionals[a.id];
                const isExpanded = !!expandedAdditionals[a.id];
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.additionalRow,
                      isOn && styles.additionalRowOn,
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedAdditionals((prev) => ({
                        ...prev,
                        [a.id]: !prev[a.id],
                      }))
                    }
                  >
                    <View style={styles.additionalLeftRow}>
                      <View style={[styles.toggle, isOn && styles.toggleOn]}>
                        {isOn ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#151718"
                          />
                        ) : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.additionalLabel}>
                          {a.label}
                        </ThemedText>

                        {/* Hidden measurer to detect overflow */}
                        {a.description ? (
                          <ThemedText
                            style={[
                              styles.additionalDescription,
                              { position: "absolute", opacity: 0, height: 0 },
                            ]}
                            onTextLayout={(e) => {
                              const isOverflow = e.nativeEvent.lines.length > 1;
                              setOverflowAdditionals((prev) =>
                                prev[a.id] === isOverflow
                                  ? prev
                                  : { ...prev, [a.id]: isOverflow }
                              );
                            }}
                          >
                            {a.description}
                          </ThemedText>
                        ) : null}
                        {a.description ? (
                          <ThemedText
                            style={styles.additionalDescription}
                            numberOfLines={isExpanded ? undefined : 1}
                            ellipsizeMode="tail"
                          >
                            {a.description}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.additionalRightCol}>
                      <ThemedText style={styles.additionalPrice}>
                        +${a.price} / day
                      </ThemedText>
                      {a.description &&
                      (overflowAdditionals[a.id] || isExpanded) ? (
                        <TouchableOpacity
                          style={styles.arrowButton}
                          activeOpacity={0.7}
                          onPress={() =>
                            setExpandedAdditionals((prev) => ({
                              ...prev,
                              [a.id]: !prev[a.id],
                            }))
                          }
                        >
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9BA1A6"
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Price details moved to bottom sheet; removed inline card */}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.totalCol}
          activeOpacity={0.8}
          onPress={() => setShowPriceSheet(true)}
        >
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={styles.totalValue}>${grandTotal}</ThemedText>
          <View style={styles.metaBlock}>
            <View style={styles.metaRowSmall}>
              <Ionicons name="pricetag-outline" size={14} color="#9BA1A6" />
              <ThemedText style={styles.totalMeta}>
                Base ${finalPrice} / day
              </ThemedText>
              {savingsTotal > 0 ? (
                <ThemedText style={styles.totalStrike}>
                  {" "}
                  ${parsedPrice} / day
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.metaRowSmall}>
              <Ionicons name="calendar-outline" size={14} color="#9BA1A6" />
              <ThemedText style={styles.totalMeta}>
                {rentalDays} {rentalDays === 1 ? "day" : "days"}
              </ThemedText>
              {extrasPerDay > 0 ? (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={14}
                    color="#9BA1A6"
                  />
                  <ThemedText style={styles.totalMeta}>
                    {Object.values(selectedAdditionals).filter(Boolean).length}{" "}
                    Add-ons
                  </ThemedText>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => {
            if (!user) {
              router.push({
                pathname: "/login",
                params: {
                  from: "vehicle",
                  id,
                  name,
                  brand,
                  price,
                  imageUrl,
                  year,
                  type,
                  startDate,
                  endDate,
                  pickupTime,
                  dropoffTime,
                  seats,
                  transmission,
                  distance,
                },
              });
              return;
            }
            // If logged in, ensure profile is complete before proceeding
            (async () => {
              const ok = await validateProfileAndMaybeShow();
              if (ok) {
                const selectedAddons = Object.entries(selectedAdditionals)
                  .filter(([, on]) => !!on)
                  .map(([aid]) => {
                    const item = additionals.find((a) => a.id === aid);
                    return item
                      ? { id: item.id, label: item.label, price: item.price }
                      : { id: aid, label: aid, price: 0 };
                  });

                router.push({
                  pathname: "/order-summary",
                  params: {
                    id,
                    name,
                    brand,
                    imageUrl,
                    year,
                    type,
                    startDate,
                    endDate,
                    pickupTime,
                    dropoffTime,
                    seats,
                    transmission,
                    distance,
                    total: String(grandTotal),
                    rentalDays: String(rentalDays),
                    addons: JSON.stringify(selectedAddons),
                    pricePerDay: String(finalPrice),
                  },
                });
              }
            })();
          }}
        >
          <Ionicons name="card" size={18} color="#151718" />
          <ThemedText style={styles.payButtonText}>
            Pay ${grandTotal}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {showPriceSheet && (
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { maxHeight: sheetMaxHeight }]}>
            <View style={styles.sheetHeaderRow}>
              <ThemedText style={styles.sheetTitle}>Price details</ThemedText>
              <TouchableOpacity onPress={() => setShowPriceSheet(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: sheetMaxHeight - 80 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.priceCard}>
                <View style={[styles.priceRow, { marginBottom: 4 }]}>
                  <ThemedText style={styles.priceLabel}>Trip</ThemedText>
                  <View style={{ flex: 1 }} />
                  <ThemedText style={styles.priceValueRow}>
                    {String(startDate || "")}{" "}
                    {pickupTime ? `· ${pickupTime}` : ""} →{" "}
                    {String(endDate || "")}{" "}
                    {dropoffTime ? `· ${dropoffTime}` : ""}
                  </ThemedText>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.addonItemRow}>
                  <View style={styles.addonLeft}>
                    <ThemedText style={styles.addonLabel}>
                      {String(name || "Car")}
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <ThemedText style={styles.addonSubLabel}>
                        ${finalPrice} / day × {rentalDays}
                      </ThemedText>
                      {savingsTotal > 0 ? (
                        <ThemedText style={styles.totalStrike}>
                          ${parsedPrice} / day
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  <ThemedText style={styles.addonTotal}>
                    ${baseSubtotal}
                  </ThemedText>
                </View>
                {/* Removed aggregate Add‑ons row; itemized breakdown below */}
                {extrasPerDay > 0 ? (
                  <View style={{ marginTop: 6, gap: 8 }}>
                    {Object.entries(selectedAdditionals)
                      .filter(([, on]) => !!on)
                      .map(([aid]) => {
                        const item = additionals.find((a) => a.id === aid);
                        if (!item) return null;
                        return (
                          <View key={aid} style={styles.addonItemRow}>
                            <View style={styles.addonLeft}>
                              <ThemedText style={styles.addonLabel}>
                                {item.label}
                              </ThemedText>
                              <ThemedText style={styles.addonSubLabel}>
                                ${item.price} / day × {rentalDays}
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.addonTotal}>
                              ${item.price * rentalDays}
                            </ThemedText>
                          </View>
                        );
                      })}
                  </View>
                ) : null}
                {savingsTotal > 0 ? (
                  <View style={styles.priceRow}>
                    <ThemedText style={styles.priceLabel}>Discount</ThemedText>
                    <ThemedText style={styles.priceValueRow}>−</ThemedText>
                    <ThemedText style={[styles.priceValueRow, styles.negative]}>
                      −${savingsTotal}
                    </ThemedText>
                  </View>
                ) : null}
                <View style={styles.priceRow}>
                  <ThemedText style={[styles.priceLabel, styles.totalRowLabel]}>
                    Total
                  </ThemedText>
                  <View style={{ flex: 1 }} />
                  <ThemedText style={styles.totalRowValue}>
                    ${grandTotal}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Profile completion modal */}
      <Modal
        visible={showProfileModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalCard}>
            <ThemedText style={styles.profileModalTitle}>
              Complete your profile
            </ThemedText>
            <ThemedText style={styles.profileModalText}>
              To proceed with payment, please complete your profile information.
            </ThemedText>
            {missingFields.length > 0 ? (
              <View style={styles.profileMissingList}>
                {missingFields.map((f) => (
                  <View key={f} style={styles.profileMissingItem}>
                    <Ionicons name="alert-circle" size={16} color="#ffcc00" />
                    <ThemedText style={styles.profileMissingText}>
                      {f} is required
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.profileModalButtons}>
              <TouchableOpacity
                style={styles.profilePrimaryBtn}
                onPress={() => {
                  setShowProfileModal(false);
                  router.push("/profile/edit");
                }}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.profilePrimaryBtnText}>
                  Complete profile
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileSecondaryBtn}
                onPress={() => setShowProfileModal(false)}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.profileSecondaryBtnText}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#333",
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discountText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 12,
  },
  infoCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  brandYear: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 0,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  specTile: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  specTileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  specIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  specLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginBottom: 4,
  },
  specValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  featureText: {
    color: "#fff",
    fontSize: 13,
  },
  additionalsCol: {
    gap: 10,
  },
  additionalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    minHeight: 56,
  },
  additionalLeftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  additionalRowOn: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  toggle: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
    backgroundColor: "transparent",
  },
  toggleOn: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  additionalLabel: {
    color: "#fff",
    flex: 1,
    flexShrink: 1,
  },
  additionalDescription: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginBottom: 12,
    flexShrink: 1,
  },
  moreLessLink: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  descRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 0,
  },
  additionalPrice: {
    color: "#fff",
    fontWeight: "700",
  },
  additionalRightCol: {
    alignItems: "flex-end",
    gap: 8,
    justifyContent: "flex-start",
  },
  arrowButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(230,232,235,0.14)",
  },
  totalCol: {
    flex: 1,
    paddingRight: 12,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 2,
  },
  totalValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  totalMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  metaBlock: {
    marginTop: 4,
    gap: 2,
  },
  metaRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaList: {
    marginTop: 6,
    gap: 6,
  },
  metaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItemTextWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priceLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },
  priceValueRow: {
    color: "#fff",
    fontSize: 14,
  },
  addonItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,232,235,0.08)",
  },
  addonLeft: {
    flex: 1,
  },
  addonLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  addonSubLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },
  addonTotal: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "rgba(230,232,235,0.14)",
  },
  totalRowLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  totalStrike: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "line-through",
  },
  negative: {
    color: "#ffcccc",
  },
  savingsPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savingsPillText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 12,
  },
  priceStrike: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  priceStrikeInline: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "line-through",
  },
  payButton: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  payButtonText: {
    color: "#151718",
    fontWeight: "700",
    fontSize: 16,
  },
  sheetOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#1b1e1f",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profileModalCard: {
    backgroundColor: "#1b1e1f",
    borderRadius: 16,
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  profileModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  profileModalText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginBottom: 10,
  },
  profileMissingList: {
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  profileMissingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileMissingText: {
    color: "#fff",
    fontSize: 14,
  },
  profileModalButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  profilePrimaryBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  profilePrimaryBtnText: {
    color: "#151718",
    fontSize: 15,
    fontWeight: "800",
  },
  profileSecondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  profileSecondaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
