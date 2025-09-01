import { ThemedText } from "@/components/ThemedText";
import type { Suggestion } from "@/types/location";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type LocationSearchProps = {
  onSelect: (suggestion: Suggestion) => void;
  initial?: Suggestion | null;
};

export function LocationSearch({ onSelect, initial }: LocationSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapSuggestion = (item: any, idx: number): Suggestion | null => {
    const cls = item.class as string | undefined;
    const typ = item.type as string | undefined;
    let kind: Suggestion["kind"] = "address";

    // Allow cities/towns (including administrative boundaries), airports and stations. Filter out regions, states, countries, etc.
    if (
      cls === "place" &&
      ["city", "town", "village", "hamlet"].includes(typ ?? "")
    ) {
      kind = "city";
    } else if (
      cls === "boundary" &&
      typ === "administrative" &&
      ["city", "town"].includes((item.addresstype as string | undefined) ?? "")
    ) {
      kind = "city";
    } else if (cls === "aeroway" && (typ === "aerodrome" || typ === "terminal")) {
      kind = "airport";
    } else if (
      (cls === "railway" && typ === "station") ||
      (cls === "public_transport" && typ === "station")
    ) {
      kind = "station";
    } else {
      return null;
    }

    const addr = (item.address ?? {}) as Record<string, string | undefined>;
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.municipality ||
      (item.name as string | undefined);
    const country = addr.country || undefined;
    const label = [city, country].filter(Boolean).join(", ");

    return {
      id: `${item.place_id ?? idx}`,
      label: String(label || item.display_name || item.name || "Unknown"),
      lat: Number(item.lat),
      lon: Number(item.lon),
      kind,
    };
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!visible) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const originalQuery = query.trim();

        // Query both generic and structured city endpoints to improve partial matching
        const urlQ = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=15&dedupe=1&q=${encodeURIComponent(
          originalQuery
        )}`;
        const urlCity = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=15&dedupe=1&city=${encodeURIComponent(
          originalQuery
        )}`;

        const headers = {
          "User-Agent": "frentzy-app/1.0",
          Accept: "application/json",
        } as const;

        const [resQ, resCity] = await Promise.all([
          fetch(urlQ, { headers }),
          fetch(urlCity, { headers }),
        ]);

        const [dataQ, dataCity] = (await Promise.all([
          resQ.json(),
          resCity.json(),
        ])) as [Array<any>, Array<any>];

        // Merge and deduplicate by place_id
        const all = [...(dataQ || []), ...(dataCity || [])];
        const uniqueByPlaceId = Array.from(
          new Map(all.map((it) => [it.place_id ?? `${it.lat},${it.lon}`, it])).values()
        );

        // Filter for cities, towns (including administrative city/town), airports, and stations only
        const cityResults = uniqueByPlaceId.filter((item) => {
          const cls = item.class as string | undefined;
          const typ = item.type as string | undefined;
          const addresstype = item.addresstype as string | undefined;
          const isPlaceCity =
            cls === "place" && ["city", "town", "village", "hamlet"].includes(typ ?? "");
          const isAdminCity =
            cls === "boundary" && typ === "administrative" && ["city", "town"].includes(addresstype ?? "");
          const isAirport = cls === "aeroway" && ["aerodrome", "terminal"].includes(typ ?? "");
          const isStation =
            (cls === "railway" && typ === "station") ||
            (cls === "public_transport" && typ === "station");
          return isPlaceCity || isAdminCity || isAirport || isStation;
        });

        const mappedSuggestions = cityResults
          .map(mapSuggestion)
          .filter((s): s is Suggestion => Boolean(s));

        // Basic ranking to surface better partial matches
        const qLower = originalQuery.toLowerCase();
        mappedSuggestions.sort((a, b) => {
          const aLabel = a.label.toLowerCase();
          const bLabel = b.label.toLowerCase();
          const aStarts = aLabel.startsWith(qLower) ? 1 : 0;
          const bStarts = bLabel.startsWith(qLower) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          const aIncludes = aLabel.includes(qLower) ? 1 : 0;
          const bIncludes = bLabel.includes(qLower) ? 1 : 0;
          if (aIncludes !== bIncludes) return bIncludes - aIncludes;
          return aLabel.length - bLabel.length;
        });

        setSuggestions(mappedSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  // Seed initial value when provided
  useEffect(() => {
    if (initial) {
      setSelected(initial);
      setQuery(initial.label);
    }
  }, [initial]);

  const handleSelect = (s: Suggestion) => {
    setSelected(s);
    setQuery(s.label);
    setVisible(false);
    onSelect(s);
  };

  const useCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({});
      const geos = await ExpoLocation.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const first = geos[0] as any;
      const city =
        first.city || first.subregion || first.district || first.name;
      const country = first.country;
      const label = [city, country].filter(Boolean).join(", ");
      const suggestion: Suggestion = {
        id: `current-${Date.now()}`,
        label: label || "Current location",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        kind: "address",
      };
      handleSelect(suggestion);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <ThemedText style={styles.label}>Location</ThemedText>
      <TouchableOpacity
        style={styles.locationInputRow}
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="search" size={18} color="#687076" />
        <ThemedText
          style={[styles.locationInputText, !selected && { color: "#9BA1A6" }]}
        >
          {selected ? selected.label : "City, airport, station..."}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <ThemedText type="title">Search location</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.locationInputRowFull}>
              <Ionicons name="search" size={18} color="#9BA1A6" />
              <TextInput
                style={styles.locationInput}
                placeholder="City, airport, station..."
                placeholderTextColor="#9BA1A6"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                autoFocus
              />
              {loading ? (
                <ActivityIndicator size="small" color="#0a7ea4" />
              ) : selected ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelected(null);
                    setQuery("");
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#9BA1A6" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.suggestionPanel}>
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={useCurrentLocation}
            >
              <Ionicons name="locate" size={18} color="#9BA1A6" />
              <ThemedText style={styles.suggestionText}>
                Use current location
              </ThemedText>
            </TouchableOpacity>

            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestionItem}
                onPress={() => handleSelect(s)}
              >
                <Ionicons
                  name={
                    s.kind === "airport"
                      ? "airplane"
                      : s.kind === "city"
                      ? "business"
                      : s.kind === "station"
                      ? "train"
                      : "location"
                  }
                  size={18}
                  color="#9BA1A6"
                />
                <ThemedText style={styles.suggestionText} numberOfLines={2}>
                  {s.label}
                </ThemedText>
              </TouchableOpacity>
            ))}

            {!loading &&
              query.trim().length >= 2 &&
              suggestions.length === 0 && (
                <View style={styles.noResultsRow}>
                  <ThemedText style={styles.noResultsText}>
                    No results
                  </ThemedText>
                </View>
              )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  locationWrapper: {
    position: "relative",
  },
  locationInputRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationInputRowFull: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: "#151718",
  },
  locationInputText: {
    flex: 1,
    fontSize: 14,
    color: "#11181C",
  },
  suggestionPanel: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E8EB",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F3",
  },
  suggestionText: {
    flex: 1,
    color: "#11181C",
    fontSize: 15,
  },
  noResultsRow: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  noResultsText: {
    color: "#687076",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#151718",
  },
  modalHeader: {
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
