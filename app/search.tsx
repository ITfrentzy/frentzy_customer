import { DateRangePickerModal } from "@/components/DateRangePickerModal";
import { LocationSearch } from "@/components/LocationSearch";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { VehicleTypeGrid } from "@/components/VehicleTypeGrid";
import { supabase } from "@/lib/supabase";
import type { Suggestion } from "@/types/location";
import { formatDisplay, to12HourFormat, toDateString } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
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
  companyLogo?: string;
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
  const filterScrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onShow = (e: any) => setKeyboardHeight(e?.endCoordinates?.height || 260);
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener("keyboardDidShow", onShow);
    const subHide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);
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
  const [draftMinPrice, setDraftMinPrice] = useState<string>(
    ((params as any).minPrice as string) || ""
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>(
    ((params as any).maxPrice as string) || ""
  );
  const [deviceLatfilter, setDeviceLat] = useState<number | null>(null);
  const [deviceLonfilter, setDeviceLon] = useState<number | null>(null);
  const [deviceLocDenied, setDeviceLocDenied] = useState<boolean>(false);

  const {
    startDate,
    endDate,
    pickupTime,
    dropoffTime,
    pickupLocation,
    latitude,
    longitude,
    vehicleType,
    refreshKey,
    minPrice,
    maxPrice,
    deviceLat,
    deviceLon,
  } = params;

  useEffect(() => {
    fetchCarRentals();
  }, [latitude, longitude, vehicleType, startDate, endDate, pickupTime, dropoffTime, minPrice, maxPrice, refreshKey]);

  // Get device GPS location once for distance display
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setDeviceLocDenied(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setDeviceLat(pos.coords.latitude);
        setDeviceLon(pos.coords.longitude);
      } catch (e) {
        setDeviceLocDenied(true);
      }
    })();
  }, []);

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

      // First, get city boundaries using reverse geocoding if lat/lon provided
      const hasLatLonParams = latitude != null && longitude != null && String(latitude) !== "" && String(longitude) !== "";
      const cityData = hasLatLonParams
        ? await getCityBoundaries(Number(latitude), Number(longitude))
        : ({ radius: 25 } as any);

      setCityInfo(cityData);

      // Use city boundaries to determine search area
      const searchRadius = cityData.radius; // Use actual city radius, fallback exists

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Try to fetch cars from Supabase first with nested branch and operation times
      // Compute bounding box (in degrees) for branch coords based on searchRadius (km)
      const centerLat = hasLatLonParams ? Number(latitude) : null;
      const centerLon = hasLatLonParams ? Number(longitude) : null;
      const deltaLat = centerLat != null ? searchRadius / 111 : null; // ~111 km per degree latitude
      const deltaLon = centerLon != null ? searchRadius / (111 * Math.cos(((centerLat as number) * Math.PI) / 180)) : null;
      const minLat = centerLat != null && deltaLat != null ? centerLat - deltaLat : null;
      const maxLat = centerLat != null && deltaLat != null ? centerLat + deltaLat : null;
      const minLon = centerLon != null && deltaLon != null ? centerLon - (deltaLon as number) : null;
      const maxLon = centerLon != null && deltaLon != null ? centerLon + (deltaLon as number) : null;

      console.log("minLat", minLat);
      console.log("maxLat", maxLat);
      console.log("minLon", minLon);
      console.log("maxLon", maxLon);

      let query = supabase
        .from("cars")
        .select(`
          *,
          branch:branch_id!inner (
            id,
            branch_name,
            location,
            longitude,
            latitude,
            company:service_provider_company!company_id(company_logo),
            pickup_hours:branch_operation_days_and_times!inner(
              day,
              from_time,
              to_time
            ),
            dropoff_hours:branch_operation_days_and_times!inner(
              day,
              from_time,
              to_time
            )
          )
        `)
  
        // Geo bounding box by branch coordinates (API-side filtering only)
    

      // Filter by car_type if provided
      console.log("type", vehicleType);
      if (vehicleType) {
       query = query.eq("car_type", String(vehicleType).toUpperCase());
      }
      // Apply geo bounding box only when coordinates are available
      if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
        query = query
          .gte("branch.latitude", minLat)
          .lte("branch.latitude", maxLat)
          .gte("branch.longitude", minLon)
          .lte("branch.longitude", maxLon);
      }

      // Price range API-side
      const minPriceVal = (Array.isArray(minPrice) ? minPrice[0] : (minPrice as string | undefined));
      const maxPriceVal = (Array.isArray(maxPrice) ? maxPrice[0] : (maxPrice as string | undefined));
      if (minPriceVal) {
        query = query.gte("rental_price", Number(minPriceVal));
      }
      if (maxPriceVal) {
        query = query.lte("rental_price", Number(maxPriceVal));
      }

      // Helper to normalize route params that may be string | string[]
      const getParam = (p: string | string[] | undefined): string | undefined =>
        Array.isArray(p) ? p[0] : p;

      // Filter by branch location name if available
      const pickupLocationVal = getParam(pickupLocation as any);
      if (pickupLocationVal) {
       // query = query.ilike("branch.location", `%${pickupLocationVal}%`);
      }

      // Filter by pickup & dropoff across the full date range (first/last day + first/last time)
      const startDateVal = getParam(startDate as any);
      const endDateVal = getParam(endDate as any) || startDateVal;
      const pickupTimeVal = getParam(pickupTime as any);
      const dropoffTimeVal = getParam(dropoffTime as any) || pickupTimeVal;
      if (startDateVal && endDateVal && pickupTimeVal && dropoffTimeVal) {
        const firstDay = new Date(String(startDateVal))
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        const lastDay = new Date(String(endDateVal))
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();

        const normalizeTime = (t: string | null | undefined) => (t && String(t).length === 5 ? `${t}:00` : String(t || ""));
        const firstTime = normalizeTime(pickupTimeVal);
        const lastTime = normalizeTime(dropoffTimeVal);

        // Require branch open at pickup first day/time and dropoff last day/time
        query = query
          .eq("branch.pickup_hours.day", firstDay)
          .lte("branch.pickup_hours.from_time", firstTime)
          .gte("branch.pickup_hours.to_time", firstTime)
          .eq("branch.dropoff_hours.day", lastDay)
          .lte("branch.dropoff_hours.from_time", lastTime)
          .gte("branch.dropoff_hours.to_time", lastTime);
      }

      const { data: cars, error } = await query.limit(50);

      if (error) {
        console.log("Supabase cars fetch error:", error.message);
      }
      

      const dbCars: any[] = (cars || []).map((c: any) => ({
        id: c.id,
        name: `${c.car_maker ?? "Car"} ${c.model_name ?? "Model"}`.trim(),
        brand: c.car_maker ?? undefined,
        type: c.car_type ?? "Sedan",
        price: Number(c.rental_price ?? 60),
        rating: 4.5,
        // Prefer branch coordinates if present; otherwise fall back to current search location
        lat: c?.branch?.latitude != null ? Number(c.branch.latitude) : Number(latitude),
        lon: c?.branch?.longitude != null ? Number(c.branch.longitude) : Number(longitude),
        available: Boolean(c.availability_status ?? true),
        year: c.model_year ?? undefined,
        imageUrl:
          Array.isArray(c.car_photos) && c.car_photos.length > 0
            ? String(c.car_photos[0])
            : undefined,
        seats: 5,
        transmission: "Automatic",
        // Enrich from branch
        branchName: c?.branch?.branch_name,
        branchLocation: c?.branch?.location,
        branchHours: Array.isArray(c?.branch?.branch_operation_days_and_times)
          ? c.branch.branch_operation_days_and_times
          : [],
        companyLogo: c?.branch?.company?.company_logo,
      }));
     
      // Coordinates for distance calculation (device GPS only, no fallback)
      const latCandidate = deviceLat ?? deviceLatfilter;
      const lonCandidate = deviceLon ?? deviceLonfilter;

      // Prefer DB cars only (no local filtering)
      const sourceCars = dbCars;

      // Compute distance for display only
      const carsWithDistance = sourceCars.map((car) => ({
        ...car,
        distance:
          latCandidate != null && lonCandidate != null
            ? calculateDistance(latCandidate as any, lonCandidate as any, car.lat as number, car.lon as number)
            : 0,
      }));

      console.log("City Data:", cityData);
      console.log("Search Radius:", searchRadius);
      console.log("DB Cars Count:", dbCars.length);
      console.log("Cars Count (after API filters):", carsWithDistance.length);

      setCarRentals(
        carsWithDistance.map((car) => ({
          id: car.id,
          name: car.name,
          type: car.type,
          price: car.price,
          rating: car.rating,
          distance: Math.round(car.distance * 10) / 10,
          available: car.available,
          year: car.year,
          imageUrl: car.imageUrl,
          companyLogo: car.companyLogo,
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
                      companyLogo: (car as any).companyLogo || "",
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
                      {(car as any).companyLogo ? (
                        <Image
                          source={{ uri: (car as any).companyLogo as string }}
                          style={{ width: 28, height: 28, borderRadius: 6 }}
                          resizeMode="contain"
                        />
                      ) : null}
                      <View style={styles.typeChip}>
                        <ThemedText style={styles.typeChipText} numberOfLines={1}>
                          {car.type}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
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
              contentContainerStyle={{ paddingBottom: 12 + keyboardHeight }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ref={(r) => {
                filterScrollRef.current = r;
              }}
            >
              <LocationSearch
                initial={draftPickup}
                onSelect={(s) => setDraftPickup(s)}
              />
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
              <View style={styles.filterSection}> 
                <ThemedText style={styles.filterLabel}>Price range</ThemedText>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    placeholder="Min"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="numeric"
                    value={draftMinPrice}
                    onChangeText={setDraftMinPrice}
                    style={styles.priceInput}
                    onFocus={() => setTimeout(() => filterScrollRef.current?.scrollToEnd({ animated: true }), 80)}
                  />
                  <TextInput
                    placeholder="Max"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="numeric"
                    value={draftMaxPrice}
                    onChangeText={setDraftMaxPrice}
                    style={styles.priceInput}
                    onFocus={() => setTimeout(() => filterScrollRef.current?.scrollToEnd({ animated: true }), 80)}
                  />
                </View>
              </View>
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
                onPress={async () => {
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === "granted") {
                      const pos = await Location.getCurrentPositionAsync({});
                      setDeviceLat(pos.coords.latitude);
                      setDeviceLon(pos.coords.longitude);
                    }
                  } catch {}
                  carRentals.length = 0;
                  router.setParams({
                    startDate: draftStartDate || "",
                    endDate: draftEndDate || "",
                    pickupTime: draftPickupTime || "",
                    dropoffTime: draftDropoffTime || "",
                    pickupLocation: draftPickup?.label || (pickupLocation as string) || "",
                    latitude: draftPickup ? String(draftPickup.lat) : ((latitude as string) || ""),
                    longitude: draftPickup ? String(draftPickup.lon) : ((longitude as string) || ""),
                    vehicleType: draftVehicle || "",
                    minPrice: draftMinPrice || "",
                    maxPrice: draftMaxPrice || "",
                    refreshKey: String(Date.now()),
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
    fontSize: 16,
    fontWeight: "700",
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
  priceInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
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
    marginBottom: 8,
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
