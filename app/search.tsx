import { DateRangePickerModal } from "@/components/DateRangePickerModal";
import { LocationSearch } from "@/components/LocationSearch";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { VehicleTypeGrid } from "@/components/VehicleTypeGrid";
import type { Suggestion } from "@/types/location";
import { formatDisplay, to12HourFormat, toDateString } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CarRentalData = {
  id: string;
  name: string;
  brand?: string;
  type: string;
  price: number;
  rating: number;
  distance: number;
  available: boolean;
  year?: number;
  imageUrl?: string;
  seats?: number;
  transmission?: "Automatic" | "Manual";
};

export default function SearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const modalMaxHeight = Math.round(Dimensions.get("window").height * 0.9);
  const [loading, setLoading] = useState(true);
  const [carRentals, setCarRentals] = useState<CarRentalData[]>([]);
  const [cityInfo, setCityInfo] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [draftVehicle, setDraftVehicle] = useState<string | null>(
    ((params as any).vehicleType as string) || null
  );
  const [draftPickup, setDraftPickup] = useState<Suggestion | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState<string | null>(
    (params as any).startDate || null
  );
  const [draftEndDate, setDraftEndDate] = useState<string | null>(
    (params as any).endDate || null
  );
  const [draftPickupTime, setDraftPickupTime] = useState<string>(
    ((params as any).pickupTime as string) || "10:00"
  );
  const [draftDropoffTime, setDraftDropoffTime] = useState<string>(
    ((params as any).dropoffTime as string) || "10:00"
  );

  const {
    startDate,
    endDate,
    pickupTime,
    dropoffTime,
    pickupLocation,
    latitude,
    longitude,
    vehicleType,
  } = params;

  useEffect(() => {
    if (latitude && longitude) {
      fetchCarRentals();
    }
  }, [latitude, longitude, vehicleType]);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  const fetchCarRentals = async () => {
    try {
      setLoading(true);

      // First, get city boundaries using reverse geocoding
      const cityData = await getCityBoundaries(
        Number(latitude),
        Number(longitude)
      );

      setCityInfo(cityData);

      // Use city boundaries to determine search area
      const searchRadius = cityData.radius; // Use actual city radius, no fallback

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Dummy API data for different cities with actual coordinates
      const cityCarData = {
        "New York": [
          {
            id: "ny1",
            name: "Mercedes-Benz GLC",
            brand: "Mercedes-Benz",
            type: "Luxury",
            price: 120,
            rating: 4.8,
            lat: 40.7589,
            lon: -73.9851,
            available: true,
            year: 2022,
            imageUrl:
              "https://images.unsplash.com/photo-1549921296-3fa90a7a77c2?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ny2",
            name: "Toyota RAV4",
            brand: "Toyota",
            type: "SUV",
            price: 85,
            rating: 4.6,
            lat: 40.6782,
            lon: -73.9442,
            available: true,
            year: 2021,
            imageUrl:
              "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ny3",
            name: "Honda Civic",
            brand: "Honda",
            type: "EV",
            price: 65,
            rating: 4.3,
            lat: 40.7282,
            lon: -73.7949,
            available: true,
            year: 2020,
            imageUrl:
              "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Manual",
          },
          {
            id: "ny4",
            name: "BMW 3 Series",
            brand: "BMW",
            type: "Sedan",
            price: 75,
            rating: 4.4,
            lat: 40.8448,
            lon: -73.8648,
            available: true,
            year: 2019,
            imageUrl:
              "https://images.unsplash.com/photo-1542367597-8849ebf6ccda?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ny5",
            name: "Ford Transit",
            brand: "Ford",
            type: "Van",
            price: 95,
            rating: 4.2,
            lat: 40.5795,
            lon: -74.1502,
            available: true,
            year: 2023,
            imageUrl:
              "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&auto=format&fit=crop&q=60",
            seats: 8,
            transmission: "Automatic",
          },
        ],
        London: [
          {
            id: "ld1",
            name: "Audi A6",
            brand: "Audi",
            type: "Luxury",
            price: 95,
            rating: 4.7,
            lat: 51.4994,
            lon: -0.1245,
            available: true,
            year: 2022,
            imageUrl:
              "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ld2",
            name: "Hyundai i30",
            brand: "Hyundai",
            type: "Compact",
            price: 55,
            rating: 4.5,
            lat: 51.5455,
            lon: -0.1622,
            available: true,
            year: 2020,
            imageUrl:
              "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Manual",
          },
          {
            id: "ld3",
            name: "Nissan Qashqai",
            brand: "Nissan",
            type: "Sedan",
            price: 70,
            rating: 4.4,
            lat: 51.48,
            lon: 0.0,
            available: true,
            year: 2021,
            imageUrl:
              "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ld4",
            name: "Kia Sportage",
            brand: "Kia",
            type: "SUV",
            price: 80,
            rating: 4.3,
            lat: 51.5455,
            lon: -0.0557,
            available: true,
            year: 2019,
            imageUrl:
              "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Automatic",
          },
          {
            id: "ld5",
            name: "Volkswagen Golf",
            brand: "Volkswagen",
            type: "Economy",
            price: 45,
            rating: 4.1,
            lat: 51.3764,
            lon: -0.0982,
            available: true,
            year: 2023,
            imageUrl:
              "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=60",
            seats: 5,
            transmission: "Manual",
          },
        ],
      };

      // Use coordinates for city matching instead of city names
      let availableCars: any[] = [];

      const lat = Number(latitude);
      const lon = Number(longitude);

      // New York coordinates (roughly 40.7, -74.0)
      if (lat >= 40.5 && lat <= 40.9 && lon >= -74.3 && lon <= -73.7) {
        availableCars = cityCarData["New York"];
        console.log("Using New York cars - coordinates match");
      }
      // London coordinates (roughly 51.5, -0.1)
      else if (lat >= 51.3 && lat <= 51.7 && lon >= -0.5 && lon <= 0.3) {
        availableCars = cityCarData.London;
        console.log("Using London cars - coordinates match");
      } else {
        console.log("No cars available for coordinates:", lat, lon);
        availableCars = [];
      }

      // Compute distance for each car and filter within city boundaries
      // Respect selected vehicle type if provided
      const filteredByType = (vehicleType
        ? availableCars.filter((c) =>
            String(c.type).toLowerCase() === String(vehicleType).toLowerCase()
          )
        : availableCars) as any[];

      const carsWithDistance = filteredByType.map((car) => ({
        ...car,
        distance: calculateDistance(lat, lon, car.lat, car.lon),
      }));

      const carsInCity = carsWithDistance.filter(
        (car) => car.distance <= searchRadius
      );

      console.log("City Data:", cityData);
      console.log("Search Radius:", searchRadius);
      console.log("Available Cars Count:", availableCars.length);
      console.log("Filtered Cars Count:", carsInCity.length);

      setCarRentals(
        carsInCity.map((car) => ({
          id: car.id,
          name: car.name,
          type: car.type,
          price: car.price,
          rating: car.rating,
          distance: Math.round(car.distance * 10) / 10,
          available: car.available,
          year: car.year,
          imageUrl: car.imageUrl,
        })) as CarRentalData[]
      );
    } catch (error) {
      console.error("Error fetching car rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCityBoundaries = async (lat: number, lon: number) => {
    try {
      // Use OpenStreetMap Nominatim API to get city information
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=10`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "frentzy-app/1.0",
          Accept: "application/json",
        },
      });

      const data = await response.json();

      // Extract city information and estimate radius
      const cityName =
        data.address?.city || data.address?.town || data.address?.municipality;
      const country = data.address?.country;

      // Estimate city radius based on city type and country
      let estimatedRadius = 25; // Default 25km

      if (cityName) {
        // Adjust radius based on city size indicators
        if (data.address?.city) estimatedRadius = 40; // Major city
        else if (data.address?.town) estimatedRadius = 20; // Town
        else if (data.address?.village) estimatedRadius = 10; // Village

        // Country-specific adjustments
        if (country === "United States")
          estimatedRadius *= 1.5; // US cities tend to be larger
        else if (country === "China" || country === "India")
          estimatedRadius *= 1.3; // Dense cities
        else if (country === "Australia" || country === "Canada")
          estimatedRadius *= 1.2; // Spread out cities
      }

      return {
        name: cityName,
        country,
        radius: estimatedRadius,
        coordinates: { lat, lon },
      };
    } catch (error) {
      console.error("Error getting city boundaries:", error);
      return { radius: 25, name: "Unknown City" }; // Fallback
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <View style={styles.headerBar}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.title}>Search Results</ThemedText>
          <View style={styles.headerSide} />
        </View>
      </View>

      {/* Static results header (title + filter) */}
      <View style={styles.resultsHeaderWrapper}>
        <View style={styles.resultsHeaderRow}>
          <ThemedText style={styles.resultsTitle}>
            Available Cars ({carRentals.length})
          </ThemedText>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setDraftVehicle(((params as any).vehicleType as string) || null);
              setDraftStartDate(((params as any).startDate as string) || null);
              setDraftEndDate(((params as any).endDate as string) || null);
              setDraftPickupTime(((params as any).pickupTime as string) || "10:00");
              setDraftDropoffTime(((params as any).dropoffTime as string) || "10:00");
              const latStr = (params as any).latitude as string;
              const lonStr = (params as any).longitude as string;
              const labelStr = (params as any).pickupLocation as string;
              if (latStr && lonStr) {
                setDraftPickup({ id: "current", label: labelStr || "", lat: Number(latStr), lon: Number(lonStr), kind: "city" });
              } else {
                setDraftPickup(null);
              }
              setShowFilter(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <ThemedText style={styles.loadingText}>
              Searching for cars in {pickupLocation}...
            </ThemedText>
          </View>
        ) : carRentals.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <ThemedText style={styles.noResultsTitle}>No Cars Found</ThemedText>
            <ThemedText style={styles.noResultsText}>
              Sorry, no cars are available in {pickupLocation} for the selected
              criteria.
            </ThemedText>
            <ThemedText style={styles.noResultsSuggestion}>
              Try adjusting your search parameters or expanding your search
              area.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {carRentals.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carItem}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/vehicle/[id]",
                    params: {
                      id: car.id,
                      name: car.name,
                      brand: car.brand || "",
                      price: String(car.price),
                      year: String(car.year || ""),
                      type: car.type,
                      imageUrl: car.imageUrl || "",
                      startDate: (startDate as string) || "",
                      endDate: (endDate as string) || "",
                      pickupTime: (pickupTime as string) || "",
                      dropoffTime: (dropoffTime as string) || "",
                      seats: String((car as any).seats || ""),
                      transmission: String((car as any).transmission || ""),
                      distance: String(car.distance || ""),
                    },
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      car.imageUrl ||
                      "https://via.placeholder.com/120x80.png?text=Car",
                  }}
                  style={styles.carImage}
                  resizeMode="cover"
                />
                <View style={[styles.carInfo, styles.cardBody]}>
                  <View style={styles.carHeaderRow}>
                    <View style={styles.chipsRow}>
                      <View style={styles.typeChip}>
                        <ThemedText style={styles.typeChipText} numberOfLines={1}>
                          {car.type}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {String(car.type || "").toLowerCase() === "ev" ? (
                        <View style={styles.saveBadge}>
                          <ThemedText style={styles.saveBadgeText}>Save 12%</ThemedText>
                        </View>
                      ) : null}
                      <View style={styles.pricePill}>
                        <ThemedText style={styles.priceValue}>
                          ${String(car.type || "").toLowerCase() === "ev" ? Math.round(car.price * 0.88) : car.price}
                        </ThemedText>
                        <ThemedText style={styles.priceUnit}>/ day</ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={styles.carName} numberOfLines={1}>
                    {car.name}
                    {car.brand ? ` · ${car.brand}` : ""}
                  </ThemedText>
                  <View style={styles.specRow}>
                    <View style={styles.specItem}>
                      <Ionicons name="location" size={14} color="#9BA1A6" />
                      <ThemedText style={styles.specText}>{car.distance} km away</ThemedText>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="person" size={14} color="#9BA1A6" />
                      <ThemedText style={styles.specText}>{car.seats ?? 5}</ThemedText>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="settings" size={14} color="#9BA1A6" />
                      <ThemedText style={styles.specText}>{car.transmission ?? "Automatic"}</ThemedText>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="car" size={14} color="#9BA1A6" />
                      <ThemedText style={styles.specText}>{car.year ?? ""}</ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {showFilter && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(insets.bottom, 8), maxHeight: modalMaxHeight },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <ThemedText style={styles.filterTitle}>Edit Filters</ThemedText>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.filterSection}>
                <LocationSearch
                  initial={draftPickup}
                  onSelect={(s) => setDraftPickup(s)}
                />
              </View>
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterLabel}>Dates</ThemedText>
                <TouchableOpacity
                  style={styles.rangeInputContainer}
                  onPress={() => setShowCalendar(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.dateInputText}>
                    {draftStartDate && draftEndDate
                      ? `${formatDisplay(draftStartDate)} ${to12HourFormat(draftPickupTime)} – ${formatDisplay(draftEndDate)} ${to12HourFormat(draftDropoffTime)}`
                      : "Select dates"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <VehicleTypeGrid
                selectedVehicle={draftVehicle}
                onVehicleSelect={setDraftVehicle as any}
              />
            </ScrollView>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowFilter(false)}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  router.setParams({
                    startDate: draftStartDate || "",
                    endDate: draftEndDate || "",
                    pickupTime: draftPickupTime || "",
                    dropoffTime: draftDropoffTime || "",
                    pickupLocation: draftPickup?.label || (pickupLocation as string) || "",
                    latitude: draftPickup ? String(draftPickup.lat) : ((latitude as string) || ""),
                    longitude: draftPickup ? String(draftPickup.lon) : ((longitude as string) || ""),
                    vehicleType: draftVehicle || "",
                  });
                  setShowFilter(false);
                }}
              >
                <ThemedText style={styles.modalButtonPrimaryText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <DateRangePickerModal
        visible={showCalendar}
        initialStart={draftStartDate}
        initialEnd={draftEndDate}
        initialPickupTime={draftPickupTime}
        initialDropoffTime={draftDropoffTime}
        minDate={toDateString(new Date())}
        onClose={() => setShowCalendar(false)}
        onConfirm={(s, e, pt, dt) => {
          setDraftStartDate(s);
          setDraftEndDate(e);
          setDraftPickupTime(pt);
          setDraftDropoffTime(dt);
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
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSide: {
    width: 64,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // removed summary card styles
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCompactText: {
    fontSize: 14,
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 20,
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeaderWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 0,
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  carItem: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 0,
    marginBottom: 16,
    flexDirection: "column",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: "hidden",
  },
  carItemSimple: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  carImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: "#333",
  },
  cardBody: {
    padding: 12,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  carBrand: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  carDistance: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  carHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  typeChipText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specText: {
    color: "#9BA1A6",
    fontSize: 13,
  },
  carYear: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  carYearSimple: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 4,
  },
  carFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  carPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  saveBadge: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveBadgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  priceValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 4,
  },
  priceUnit: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    fontWeight: "700",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  noResultsSuggestion: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1b1e1f",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  filterTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#151718",
    fontSize: 14,
    fontWeight: "700",
  },
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
});
