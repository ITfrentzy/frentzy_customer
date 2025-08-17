export type Suggestion = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  kind: "airport" | "city" | "station" | "address";
};
