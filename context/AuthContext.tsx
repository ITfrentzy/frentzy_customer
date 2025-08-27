import { supabase } from "@/lib/supabase";
import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";

type AuthUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  debugBypass: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customer")
        .select("id, full_name, email")
        .eq("email", email)
        .eq("password", password)
        .maybeSingle();

      if (error) {
        Alert.alert("Login error", error.message);
        return;
      }
      if (!data) {
        Alert.alert("Invalid credentials", "Email or password is incorrect.");
        return;
      }
      setUser({ id: data.id, full_name: (data as any).full_name, email: (data as any).email });
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
  };

  const debugBypass = () => {
    // Enable in development or when EXPO_PUBLIC_DEBUG_BYPASS=1
    const bypassVar = (process as any)?.env?.EXPO_PUBLIC_DEBUG_BYPASS;
    if (__DEV__ || bypassVar === "1") {
      setUser({ id: "debug-user", full_name: "Debug User", email: "debug@example.com" });
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, signIn, signOut, debugBypass }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


