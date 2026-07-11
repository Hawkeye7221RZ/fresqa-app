"use client";
// components/OrderDetailModal.tsx
// Muncul pas admin klik salah satu order di tabel.
// Isinya: daftar barang yang dipesan, ubah status order,
// ubah status pembayaran, dan kelola status pengiriman.

import { useEffect, useState } from "react";
import { createClient, Order, OrderItem, Delivery, OrderStatus } from "@/lib/supabase";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "menunggu_konfirmasi",
  "diproses",
  "dikirim",
  "selesai",
  "dibatalkan",
];

const PAYMENT_STATUS_OPTIONS = [
  "belum_bayar",
  "menunggu_verifikasi",
  "lunas",
  "gagal",
] as const;

const DELIVERY_STATUS_OPTIONS = [
  "menunggu",
  "diambil",
  "diantar",
  "selesai",
  "gagal",
] as const;

export default function OrderDetailModal({
  order,
  onClose,
  onUpdated,
}: {
  order: Order;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadDetail() {
    setLoading(true);
    const { data: itemData } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setItems(itemData ?? []);

    const { data: deliveryData } = await supabase
      .from("deliveries")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();
    setDelivery(deliveryData);

    setLoading(false);
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  async function updateOrderField(field: string, value: string) {
    setSaving(true);
    await supabase
      .from("orders")
      .update({ [field]: value })
      .eq("id", order.id);
    setSaving(false);
    onUpdated();
  }

  async function ensureDeliveryAndUpdate(status: string) {
    setSaving(true);
    if (delivery) {
      await supabase
        .from("deliveries")
        .update({ status })
        .eq("id", delivery.id);
    } else {
      const { data } = await supabase
        .from("deliveries")
        .insert({ order_id: order.id, status })
        .select()
        .single();
      setDelivery(data);
    }
    setSaving(false);
    loadDetail();
    onUpdated();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-shard max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl text-ink">
            {order.order_code}
          </h2>
          <button
            onClick={onClose}
            className="text-frost-400 hover:text-frost-700"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-frost-500 mb-5">
          {new Date(order.created_at).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          · {order.source === "pos" ? "Kasir (walk-in)" : "Order online"}
        </p>

        {/* Item pesanan */}
        <h3 className="text-sm font-medium text-frost-700 mb-2">
          Barang dipesan
        </h3>
        {loading ? (
          <p className="text-sm text-frost-500">Memuat...</p>
        ) : (
          <div className="border border-frost-200 rounded-shard overflow-hidden mb-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between px-3 py-2 text-sm border-b border-frost-100 last:border-b-0"
              >
                <span className="text-ink">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="text-frost-700">
                  Rp{item.line_total.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 text-sm bg-frost-50 font-medium">
              <span>Total</span>
              <span>Rp{order.total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {/* Status order */}
        <label className="text-sm font-medium text-frost-700 block mb-1">
          Status Order
        </label>
        <select
          value={order.status}
          onChange={(e) => updateOrderField("status", e.target.value)}
          disabled={saving}
          className="w-full border border-frost-300 rounded-shard px-3 py-2 mb-4 text-sm"
        >
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Status pembayaran */}
        <label className="text-sm font-medium text-frost-700 block mb-1">
          Status Pembayaran
        </label>
        <select
          value={order.payment_status}
          onChange={(e) => updateOrderField("payment_status", e.target.value)}
          disabled={saving}
          className="w-full border border-frost-300 rounded-shard px-3 py-2 mb-4 text-sm"
        >
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Status pengiriman */}
        {order.delivery_address && (
          <>
            <label className="text-sm font-medium text-frost-700 block mb-1">
              Status Pengiriman
            </label>
            <p className="text-xs text-frost-500 mb-2">
              {order.delivery_address}
            </p>
            <select
              value={delivery?.status ?? "menunggu"}
              onChange={(e) => ensureDeliveryAndUpdate(e.target.value)}
              disabled={saving}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 text-sm"
            >
              {DELIVERY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
