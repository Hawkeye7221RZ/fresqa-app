"use client";
// lib/auth-context.tsx
// Nyimpen info "siapa yang lagi login" dan role-nya (admin/karyawan/pelanggan),
// bisa diakses dari halaman mana aja pakai hook useAuth().
// Otomatis update kalau ada login/logout.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "./supabase";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "karyawan" | "pelanggan";
};

type AuthContextType = {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  isStaff: boolean;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserAndProfile() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(profileData);
    setLoading(false);
  }

  useEffect(() => {
    loadUserAndProfile();

    // Dengerin perubahan login/logout secara live
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserAndProfile();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isStaff = profile?.role === "admin" || profile?.role === "karyawan";

  return (
    <AuthContext.Provider
      value={{ userId, profile, loading, isStaff, refresh: loadUserAndProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
