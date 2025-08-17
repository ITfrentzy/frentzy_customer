import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type CarRentalData = {
  id: string;
  name: string;
  type: string;
  price: number;
  rating: number;
  distance: number;
  available: boolean;
};

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [carRentals, setCarRentals] = useState<CarRentalData[]>([]);
  const [cityInfo, setCityInfo] = useState<any>(null);

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
  }, [latitude, longitude]);

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

      // Dummy API data for different cities
      const cityCarData = {
        "New York": [
          {
            id: "ny1",
            name: "Manhattan Premium Rentals",
            type: vehicleType || "Luxury",
            price: 120,
            rating: 4.8,
            distance: 1.2,
            available: true,
          },
          {
            id: "ny2",
            name: "Brooklyn Auto Center",
            type: vehicleType || "SUV",
            price: 85,
            rating: 4.6,
            distance: 8.5,
            available: true,
          },
          {
            id: "ny3",
            name: "Queens Quick Rent",
            type: vehicleType || "Compact",
            price: 65,
            rating: 4.3,
            distance: 15.2,
            available: true,
          },
          {
            id: "ny4",
            name: "Bronx Business Cars",
            type: vehicleType || "Sedan",
            price: 75,
            rating: 4.4,
            distance: 22.8,
            available: true,
          },
          {
            id: "ny5",
            name: "Staten Island Motors",
            type: vehicleType || "Van",
            price: 95,
            rating: 4.2,
            distance: 35.1,
            available: true,
          },
        ],
        London: [
          {
            id: "ld1",
            name: "Westminster Car Rentals",
            type: vehicleType || "Luxury",
            price: 95,
            rating: 4.7,
            distance: 0.8,
            available: true,
          },
          {
            id: "ld2",
            name: "Camden Auto Services",
            type: vehicleType || "Compact",
            price: 55,
            rating: 4.5,
            distance: 6.3,
            available: true,
          },
          {
            id: "ld3",
            name: "Greenwich Motors",
            type: vehicleType || "Sedan",
            price: 70,
            rating: 4.4,
            distance: 12.7,
            available: true,
          },
          {
            id: "ld4",
            name: "Hackney Rentals",
            type: vehicleType || "SUV",
            price: 80,
            rating: 4.3,
            distance: 18.9,
            available: true,
          },
          {
            id: "ld5",
            name: "Croydon Auto Center",
            type: vehicleType || "Economy",
            price: 45,
            rating: 4.1,
            distance: 28.5,
            available: true,
          },
        ],
        default: [
          {
            id: "1",
            name: "Downtown Car Rentals",
            type: vehicleType || "Sedan",
            price: 45,
            rating: 4.5,
            distance: 2.1,
            available: true,
          },
          {
            id: "2",
            name: "Airport Premium Auto",
            type: vehicleType || "SUV",
            price: 65,
            rating: 4.8,
            distance: 18.5,
            available: true,
          },
          {
            id: "3",
            name: "City Center Quick Rent",
            type: vehicleType || "Compact",
            price: 35,
            rating: 4.2,
            distance: 1.8,
            available: true,
          },
        ],
      };

      // Use coordinates for city matching instead of city names
      let availableCars = cityCarData.default;

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
        console.log("Using default cars - coordinates:", lat, lon);
      }

      // Filter cars within city boundaries using actual city radius
      const carsInCity = availableCars.filter(
        (car) => car.distance <= searchRadius
      );

      console.log("City Data:", cityData);
      console.log("City Name:", cityName);
      console.log("Search Radius:", searchRadius);
      console.log("Available Cars Count:", availableCars.length);
      console.log("Filtered Cars Count:", carsInCity.length);

      setCarRentals(carsInCity as CarRentalData[]);
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Search Results</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSummary}>
          <ThemedText style={styles.summaryTitle}>Search Criteria</ThemedText>
          <ThemedText style={styles.summaryText}>
            Location: {pickupLocation || "Not selected"}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Coordinates: {latitude}, {longitude}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Search Radius:{" "}
            {cityInfo
              ? `${cityInfo.radius} km (${cityInfo.name})`
              : "Calculating..."}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Dates: {startDate || "Not selected"} - {endDate || "Not selected"}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Times: {pickupTime || "Not selected"} -{" "}
            {dropoffTime || "Not selected"}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Vehicle: {vehicleType || "Not selected"}
          </ThemedText>
        </View>

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
            <ThemedText style={styles.resultsTitle}>
              Available Cars ({carRentals.length})
            </ThemedText>
            {carRentals.map((car) => (
              <View key={car.id} style={styles.carItem}>
                <View style={styles.carInfo}>
                  <ThemedText style={styles.carName}>{car.name}</ThemedText>
                  <ThemedText style={styles.carType}>{car.type}</ThemedText>
                  <ThemedText style={styles.carDistance}>
                    {car.distance} km away
                  </ThemedText>
                </View>
                <View style={styles.carPricing}>
                  <ThemedText style={styles.carPrice}>
                    ${car.price}/day
                  </ThemedText>
                  <ThemedText style={styles.carRating}>
                    ★ {car.rating}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 20,
  },
  backText: {
    fontSize: 16,
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchSummary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
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
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
  },
  carItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  carType: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  carDistance: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  carPricing: {
    alignItems: "flex-end",
  },
  carPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  carRating: {
    fontSize: 14,
    color: "#FFD700",
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
});
