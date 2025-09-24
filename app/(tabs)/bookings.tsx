import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BookingCardData {
  id: string;
  vehicleName: string;
  brand?: string;
  imageUrl?: string;
  startDate: string; // ISO
  startTime: string; // HH:mm or with AM/PM
  endDate: string;
  endTime: string;
  total: number;
  status: "upcoming" | "completed" | "cancelled";
}

const MOCK_BOOKINGS: BookingCardData[] = [
  {
    id: "bk_1001",
    vehicleName: "Model 3 Long Range",
    brand: "Tesla",
    imageUrl:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=60",
    startDate: new Date().toISOString().slice(0, 10),
    startTime: "09:00 AM",
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    endTime: "09:00 AM",
    total: 189,
    status: "upcoming",
  },
  {
    id: "bk_1000",
    vehicleName: "A4 Premium",
    brand: "Audi",
    imageUrl:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=60",
    startDate: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    startTime: "10:00 AM",
    endDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    endTime: "10:00 AM",
    total: 120,
    status: "completed",
  },
];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<"upcoming" | "completed" | "cancelled">(
    "upcoming"
  );
  const [refreshing, setRefreshing] = useState(false);

  const data = useMemo(() => {
    return MOCK_BOOKINGS.filter((b) => b.status === filter);
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderHeader = () => (
    <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle} numberOfLines={1}>
        Bookings
      </ThemedText>
      <View style={styles.headerSide} />
    </View>
  );

  const renderFilters = () => (
    <View style={styles.segmentRow}>
      {[
        { key: "upcoming", label: "Upcoming" },
        { key: "completed", label: "Past" },
        { key: "cancelled", label: "Cancelled" },
      ].map((seg) => {
        const isActive = filter === (seg.key as any);
        return (
          <TouchableOpacity
            key={seg.key}
            onPress={() => setFilter(seg.key as any)}
            activeOpacity={0.9}
            style={[styles.segmentChip, isActive && styles.segmentChipActive]}
          >
            <ThemedText
              style={[
                styles.segmentLabel,
                isActive && styles.segmentLabelActive,
              ]}
            >
              {seg.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const statusBadge = (status: BookingCardData["status"]) => {
    const styleMap = {
      upcoming: {
        bg: "rgba(76,175,80,0.14)",
        color: "#4CAF50",
        label: "Upcoming",
      },
      completed: {
        bg: "rgba(255,255,255,0.14)",
        color: "#E6E8EB",
        label: "Completed",
      },
      cancelled: {
        bg: "rgba(255,107,107,0.14)",
        color: "#FF6B6B",
        label: "Cancelled",
      },
    } as const;
    const s = styleMap[status];
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <ThemedText style={[styles.badgeText, { color: s.color }]}>
          {s.label}
        </ThemedText>
      </View>
    );
  };

  const renderCard = ({ item }: { item: BookingCardData }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push(`/order-summary`)}
    >
      <View style={styles.cardImageWrap}>
        <Image
          source={{
            uri:
              item.imageUrl ||
              "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=60",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardTopRow}>{statusBadge(item.status)}</View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <ThemedText style={styles.cardTitle} numberOfLines={1}>
            {item.vehicleName}
          </ThemedText>
          {item.brand ? (
            <ThemedText style={styles.cardBrand}>{item.brand}</ThemedText>
          ) : null}
        </View>

        <View style={styles.cardChipsRow}>
          <View style={styles.chip}>
            <Ionicons name="calendar" size={16} color="#9BA1A6" />
            <ThemedText style={styles.chipText}>
              {item.startDate} · {item.startTime}
            </ThemedText>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#9BA1A6" />
          <View style={styles.chip}>
            <Ionicons name="calendar" size={16} color="#9BA1A6" />
            <ThemedText style={styles.chipText}>
              {item.endDate} · {item.endTime}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={styles.totalValue}>${item.total}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="calendar-outline" size={56} color="#8A9196" />
      <ThemedText style={styles.emptyTitle}>No {filter} bookings</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Your bookings will appear here once you make them.
      </ThemedText>
      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.9}
        onPress={() => router.push("/")}
      >
        <Ionicons name="search" size={18} color="#151718" />
        <ThemedText style={styles.ctaButtonText}>Find a car</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}
      {renderFilters()}

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderCard}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151718",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
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
  },
  headerSide: { width: 44 },

  segmentRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
  },
  segmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  segmentChipActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  segmentLabel: {
    color: "#E6E8EB",
    fontSize: 13,
    fontWeight: "600",
  },
  segmentLabelActive: {
    color: "#151718",
    fontWeight: "800",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  card: {
    backgroundColor: "#1A1D1E",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2D2E",
  },
  cardImageWrap: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#2A2D2E",
  },
  cardTopRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardBody: {
    padding: 12,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  cardBrand: {
    color: "#9BA1A6",
    fontSize: 13,
    fontWeight: "600",
  },
  cardChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  chipText: {
    color: "#9BA1A6",
    fontSize: 12,
    fontWeight: "700",
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#9BA1A6",
    fontSize: 12,
  },
  totalValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: "#E6E8EB",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#9BA1A6",
    textAlign: "center",
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaButtonText: {
    color: "#151718",
    fontWeight: "800",
  },
});
