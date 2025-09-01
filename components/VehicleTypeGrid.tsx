import { ThemedText } from "@/components/ThemedText";
import { vehicleTypes } from "@/constants/VehicleTypes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function VehicleTypeGrid({
  selectedVehicle,
  onVehicleSelect,
}: {
  selectedVehicle: string | null;
  onVehicleSelect: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.label}>Type</ThemedText>
      <View style={styles.vehicleGrid}>
        {vehicleTypes.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleItem,
              selectedVehicle === vehicle.id && styles.vehicleItemSelected,
            ]}
            onPress={() => onVehicleSelect(vehicle.id)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.vehicleIconContainer,
                selectedVehicle === vehicle.id &&
                  styles.vehicleIconContainerSelected,
              ]}
            >
              <MaterialCommunityIcons
                name={vehicle.iconName as any}
                size={32}
                color={selectedVehicle === vehicle.id ? "#151718" : "#fff"}
              />
            </View>
            <ThemedText
              style={[
                styles.vehicleName,
                selectedVehicle === vehicle.id && styles.vehicleNameSelected,
              ]}
            >
              {vehicle.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vehicleItem: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  vehicleItemSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "#fff",
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  vehicleIconContainerSelected: {
    backgroundColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  vehicleName: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  vehicleNameSelected: {
    fontWeight: "600",
    color: "#fff",
  },
});
