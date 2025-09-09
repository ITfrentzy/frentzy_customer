import { supabase } from "@/lib/supabase";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

type AuthUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  UID?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<boolean>;
  signOut: () => void;
  justLoggedIn: boolean;
  ackJustLoggedIn: () => void;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const requestOtp = async (phone: string) => {
    if (!phone) {
      Alert.alert("Missing phone", "Please enter your phone number.");
      return;
    }
    try {
      setLoading(true);
      console.log("[Auth] Requesting OTP for:", phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: "sms", shouldCreateUser: true },
      });
      if (error) {
        Alert.alert("OTP error", error.message);
      } else {
        Alert.alert("Code sent", "We sent a verification code via SMS.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (!phone || !token) {
      Alert.alert("Missing info", "Enter your phone and the verification code.");
      return false;
    }
    try {
      setLoading(true);
      console.log("[Auth] Verifying OTP for:", phone, "code:", token);
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      const verifiedUser = (verifyData as any)?.user;
      if (verifyError || !verifiedUser) {
        Alert.alert("Verification failed", verifyError?.message || "Invalid code");
        return false;
      }
      // Try link to customer by auth user id first
      const { data: customerById, error: byIdError } = await supabase
        .from("customer")
        .select("id, UID, full_name, email, phone")
        .or(`UID.eq.${(verifiedUser as any)?.id}`)
        .maybeSingle();
      if (byIdError) {
        console.warn("Customer lookup by id error:", byIdError.message);
      }

      let effectiveCustomer: any = customerById && (customerById as any)?.id ? customerById : null;

      // Fallback: lookup by phone or email if not found by id
      if (!effectiveCustomer) {
        const filters: string[] = [`phone.eq.${phone}`];
        const email = (verifiedUser as any)?.email as string | undefined;
        if (email && email.trim().length > 0) filters.push(`email.eq.${email}`);
        const orFilter = filters.join(",");
        const { data: customerByContact, error: byContactError } = await supabase
          .from("customer")
          .select("id, UID, full_name, email, phone")
          .or(orFilter)
          .maybeSingle();
        if (byContactError) {
          console.warn("Customer lookup by contact error:", byContactError.message);
        }
        if (customerByContact && (customerByContact as any)?.id) {
          effectiveCustomer = customerByContact;
        }
      }

      if (!effectiveCustomer || !(effectiveCustomer as any)?.id) {
        console.log("Creating a new customer row linked to auth user id");
        // Create a new customer row linked to auth user id
        const { data: upserted, error: upsertError } = await supabase
          .from("customer")
          .upsert(
            [
              {
          
                UID: (verifiedUser as any)?.id,
       
                full_name: (verifiedUser as any)?.user_metadata?.full_name ?? null,
                email: (verifiedUser as any)?.email ?? null,
                phone: phone,
                phone_verified: true,
                active: true,
              },
            ],
            { onConflict: "id" }
          )
          .select("id, full_name, email, phone")
          .single();
        if (upsertError) {
          console.warn("Customer upsert error:", upsertError.message);
        }
        effectiveCustomer = upserted ?? {
          id: (verifiedUser as any)?.id,
          full_name: (verifiedUser as any)?.user_metadata?.full_name ?? null,
          email: (verifiedUser as any)?.email ?? null,
          phone,
          UID: (verifiedUser as any)?.id ?? null,
        };
      }

      // Ensure UID is saved/linked on the customer row
      if (
        effectiveCustomer &&
        (effectiveCustomer as any)?.UID &&
        ((effectiveCustomer as any)?.UID == null || (effectiveCustomer as any)?.UID !== (verifiedUser as any)?.id)
      ) {
        const { error: uidUpdateError } = await supabase
          .from("customer")
          .update({ UID: (verifiedUser as any)?.id })
          .eq("UID", (verifiedUser as any)?.id);
        if (uidUpdateError) {
          console.warn("Failed to set customer.UID:", uidUpdateError.message);
        }
      }

      setUser({
        id: effectiveCustomer.id,
        full_name: effectiveCustomer.full_name ?? (verifiedUser as any)?.user_metadata?.full_name ?? null,
        email: effectiveCustomer.email ?? (verifiedUser as any)?.email ?? null,
        phone: effectiveCustomer.phone ?? (verifiedUser as any)?.phone ?? phone ?? null,
        UID: effectiveCustomer.UID ?? (verifiedUser as any)?.id ?? null,
      });
      setJustLoggedIn(true);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const reloadUser = async () => {
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const sessionUser = sessionRes?.session?.user;
      if (!sessionUser) return;
      const { data: customer } = await supabase
        .from("customer")
        .select("id, UID, full_name, email, phone")
        .or(`UID.eq.${sessionUser.id}`)
        .maybeSingle();
      setUser({
        id: (customer as any)?.id || sessionUser.id,
        full_name: (customer as any)?.full_name || sessionUser.user_metadata?.full_name || null,
        email: (customer as any)?.email || sessionUser.email || null,
        phone: (customer as any)?.phone || (sessionUser as any)?.phone || null,
        UID: (customer as any)?.UID || sessionUser.id || null,
      });
    } catch {}
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setJustLoggedIn(false);
    }
  };

  const ackJustLoggedIn = () => setJustLoggedIn(false);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, requestOtp, verifyOtp, signOut, justLoggedIn, ackJustLoggedIn, reloadUser }),
    [user, loading, justLoggedIn]
  );

  // Keep auth state in sync with Supabase session
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const sessionUser = sessionRes?.session?.user;
      if (mounted && sessionUser && !user) {
        // Hydrate from customer table if exists
        const { data: customer } = await supabase
          .from("customer")
          .select("id, UID, full_name, email, phone")
          .or(`UID.eq.${sessionUser.id}`)
          .maybeSingle();
        setUser({
          id: (customer as any)?.id || sessionUser.id,
          full_name: (customer as any)?.full_name || sessionUser.user_metadata?.full_name || null,
          email: (customer as any)?.email || sessionUser.email || null,
          phone: (customer as any)?.phone || (sessionUser as any)?.phone || null,
        });
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        const { data: customer } = await supabase
          .from("customer")
          .select("id, UID, full_name, email, phone")
          .or(`UID.eq.${sessionUser.id}`)
          .maybeSingle();
        setUser({
          id: (customer as any)?.id || sessionUser.id,
          full_name: (customer as any)?.full_name || sessionUser.user_metadata?.full_name || null,
          email: (customer as any)?.email || sessionUser.email || null,
          phone: (customer as any)?.phone || (sessionUser as any)?.phone || null,
          UID: (customer as any)?.UID || sessionUser.id || null,
        });
      } else {
        setUser(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


