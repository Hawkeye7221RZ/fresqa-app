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

export type StockItem = {
  id: string;
  product_id: string;
  quantity: number;
  min_threshold: number;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  type: "produksi" | "terjual" | "rusak" | "penyesuaian";
  quantity: number;
  note: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  order_code: string;
  customer_id: string | null;
  source: "online" | "pos";
  status: OrderStatus;
  payment_status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "gagal";
  payment_method: string | null;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  line_total: number;
};

export type Delivery = {
  id: string;
  order_id: string;
  courier_id: string | null;
  status: "menunggu" | "diambil" | "diantar" | "selesai" | "gagal";
  proof_photo_url: string | null;
  delivered_at: string | null;
};
