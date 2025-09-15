import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Reuse the same project as configured in app/_layout.tsx
const supabaseUrl = "https://nnxxtvgvqgdtkgzkqacp.supabase.co";
const supabaseKey = "sb_secret_UcU_ypGbC7qKcECfpwiVtQ_upYYVDJt" as string;

// In React Native, explicitly configure auth storage to persist the session.
// On web, Supabase falls back to localStorage automatically.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    storageKey: "sb-frentzy-auth",
  },
});

export type CarRow = {
  id: string;
  created_at?: string;
  car_photos?: string[] | null;
  car_type?: string | null;
  rental_price?: number | null;
  car_maker?: string | null;
  model_year?: number | null;
  branch_id?: string | null;
  plate_number?: string | null;
  availability_status?: string | boolean | null;
  temp_reserved_status?: string | boolean | null;
  temp_paid_status?: string | boolean | null;
  updated_at?: string | null;
  model_name?: string | null;
};


