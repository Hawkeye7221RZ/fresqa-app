"use client";
// app/orders/[id]/page.tsx
// Halaman konfirmasi & tracking order (route: "/orders/[id]")
// Pelanggan diarahkan ke sini setelah checkout, juga bisa dipakai
// buat cek status pesanan kapan aja.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient, Order, OrderItem } from "@/lib/supabase";

const STATUS_LABEL: Record<string, string> = {
  menunggu_konfirmasi: "Menunggu konfirmasi toko",
  diproses: "Sedang diproses",
  dikirim: "Sedang dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export default function OrderDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", params.id)
        .single();
      setOrder(orderData);

      const { data: itemData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", params.id);
      setItems(itemData ?? []);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center text-frost-500">
        Memuat pesanan...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-frost-600">Pesanan tidak ditemukan.</p>
        <Link href="/" className="text-frost-600 hover:underline text-sm">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">✓</p>
        <h1 className="font-display text-2xl text-ink">Pesanan Diterima</h1>
        <p className="text-sm text-frost-500 mt-1">{order.order_code}</p>
      </div>

      <div className="border border-frost-200 rounded-shard bg-white p-5 mb-4">
        <p className="text-xs text-frost-500 uppercase tracking-wide mb-1">
          Status
        </p>
        <p className="text-ink font-medium">
          {STATUS_LABEL[order.status] ?? order.status}
        </p>
      </div>

      <div className="border border-frost-200 rounded-shard bg-white p-5 mb-4">
        <p className="text-xs text-frost-500 uppercase tracking-wide mb-2">
          Barang dipesan
        </p>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span className="text-ink">
              {item.product_name} × {item.quantity}
            </span>
            <span className="text-frost-700">
              Rp{item.line_total.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2 mt-2 border-t border-frost-100 font-semibold">
          <span>Total</span>
          <span>Rp{order.total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div className="border border-frost-200 rounded-shard bg-white p-5">
        <p className="text-xs text-frost-500 uppercase tracking-wide mb-1">
          Dikirim ke
        </p>
        <p className="text-sm text-ink">{order.delivery_address}</p>
      </div>

      <Link
        href="/"
        className="block text-center mt-8 text-sm text-frost-600 hover:underline"
      >
        ← Kembali ke katalog
      </Link>
    </div>
  );
}
