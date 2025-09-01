import { DateRangePickerModal } from "@/components/DateRangePickerModal";
import { LocationSearch } from "@/components/LocationSearch";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { VehicleTypeGrid } from "@/components/VehicleTypeGrid";
import type { Suggestion } from "@/types/location";
import { formatDisplay, to12HourFormat, toDateString } from "@/utils/date";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

// helpers and types moved to dedicated files

export default function CarRentalScreen() {
  // Date range state
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Suggestion | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(
    null
  );
  const [formKey, setFormKey] = useState<number>(0);

  // Time state
  const [pickupTime, setPickupTime] = useState<string>("10:00");
  const [dropoffTime, setDropoffTime] = useState<string>("10:00");

  const rangeText = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDisplay(startDate)} ${to12HourFormat(
        pickupTime
      )} – ${formatDisplay(endDate)} ${to12HourFormat(dropoffTime)}`;
    }
    return "Select dates";
  }, [startDate, endDate, pickupTime, dropoffTime]);

  const onOpenCalendar = () => {
    setShowCalendar(true);
  };

  const today = toDateString(new Date());

  // Reset form when screen regains focus (e.g., navigating back from results)
  useFocusEffect(
    React.useCallback(() => {
      setStartDate(null);
      setEndDate(null);
      setPickupTime("10:00");
      setDropoffTime("10:00");
      setPickupLocation(null);
      setSelectedVehicleType(null);
      setShowCalendar(false);
      setFormKey((k) => k + 1); // force remount of controlled subcomponents
    }, [])
  );

  // Location handler
  const onSelectPickup = (s: Suggestion) => {
    setPickupLocation(s);
  };

  // current location handled inside LocationSearch

  const isFormValid = useMemo(() => {
    return startDate && endDate && pickupLocation && selectedVehicleType;
  }, [startDate, endDate, pickupLocation, selectedVehicleType]);

  const router = useRouter();

  const handleSearch = async () => {
    let deviceLat: string = "";
    let deviceLon: string = "";
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        deviceLat = String(pos.coords.latitude);
        deviceLon = String(pos.coords.longitude);
      }
    } catch {}
    if (isFormValid) {
      router.push({
        pathname: "/search",
        params: {
          startDate,
          endDate,
          pickupTime,
          dropoffTime,
          pickupLocation: pickupLocation?.label || "Unknown Location",
          latitude: pickupLocation?.lat?.toString() || "",
          longitude: pickupLocation?.lon?.toString() || "",
          vehicleType: selectedVehicleType || "",
          deviceLat,
          deviceLon,
        },
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <ThemedText style={styles.logo}>F</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <LocationSearch key={formKey} onSelect={onSelectPickup} />

        {/* Date Section */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Date</ThemedText>
          <TouchableOpacity
            style={styles.rangeInputContainer}
            onPress={onOpenCalendar}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.dateInputText,
                !(startDate && endDate) && { color: "#9BA1A6" },
              ]}
            >
              {rangeText}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <VehicleTypeGrid
          selectedVehicle={selectedVehicleType}
          onVehicleSelect={setSelectedVehicleType}
        />

        {/* Search Button */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[
              styles.searchButton,
              !isFormValid && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.searchButtonText,
                !isFormValid && styles.searchButtonTextDisabled,
              ]}
            >
              Search
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <DateRangePickerModal
        visible={showCalendar}
        initialStart={startDate}
        initialEnd={endDate}
        initialPickupTime={pickupTime}
        initialDropoffTime={dropoffTime}
        minDate={today}
        onClose={() => setShowCalendar(false)}
        onConfirm={(s, e, pt, dt) => {
          setStartDate(s);
          setEndDate(e);
          setPickupTime(pt);
          setDropoffTime(dt);
          setShowCalendar(false);
        }}
      />
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
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  // styles for location section are handled inside LocationSearch
  rangeInputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateInputText: {
    fontSize: 13,
    color: "#151718",
  },
  // vehicle grid styles are inside VehicleTypeGrid
  searchContainer: {
    paddingHorizontal: 0,
    paddingVertical: 20,
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  searchButton: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#151718",
  },
  searchButtonTextDisabled: {
    color: "rgba(21, 23, 24, 0.5)",
  },
  // modal styles are inside DateRangePickerModal
});
