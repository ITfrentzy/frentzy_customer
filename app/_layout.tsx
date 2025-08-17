import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { createClient } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
const supabaseUrl = "https://nnxxtvgvqgdtkgzkqacp.supabase.co";
const supabaseKey = "sb_secret_UcU_ypGbC7qKcECfpwiVtQ_upYYVDJt";
const supabase = createClient(supabaseUrl, supabaseKey as any);

import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!loaded) return;
      let { data: branch, error } = await supabase.from("branch").select("*");

      if (error) {
        console.log(error);
        return;
      }
      console.log(branch);
    };
    fetchCustomer();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
