export type VehicleType = {
  id: string;
  name: string;
  iconName: string; // MaterialCommunityIcons name
};

export const vehicleTypes: Array<VehicleType> = [
  { id: "convertible", name: "Convertible", iconName: "car-convertible" },
  { id: "sport", name: "Sport", iconName: "car-sports" },
  { id: "suv", name: "SUV", iconName: "car-estate" },
  { id: "midsize", name: "Mid Size", iconName: "car" },
  { id: "truck", name: "Truck", iconName: "truck" },
  { id: "ev", name: "EV", iconName: "car-electric" },
];
