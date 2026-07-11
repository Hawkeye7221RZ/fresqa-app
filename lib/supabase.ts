// lib/supabase.ts
// Ini "jembatan" tunggal ke database Supabase.
// Semua halaman/komponen yang mau baca/tulis data, import dari sini.
// Jangan bikin koneksi baru di tiap file — cukup 1 sumber biar konsisten.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Tipe data dasar, dipakai di berbagai komponen biar konsisten.
// Nanti bisa ditambah/generate otomatis dari Supabase CLI kalau project makin besar.
export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
};

export type OrderStatus =
  | "menunggu_konfirmasi"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";
