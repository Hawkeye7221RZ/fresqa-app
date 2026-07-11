"use client";
// app/admin/orders/page.tsx
// Halaman kelola order & pengiriman (route: "/admin/orders")
// Tampilkan semua order (online maupun kasir), bisa difilter per status,
// klik salah satu buat buka detail & ubah status.

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, Order, OrderStatus } from "@/lib/supabase";
import OrderDetailModal from "@/components/OrderDetailModal";

const FILTERS: { label: string; value: OrderStatus | "semua" }[] = [
  { label: "Semua", value: "semua" },
  { label: "Menunggu Konfirmasi", value: "menunggu_konfirmasi" },
  { label: "Diproses", value: "diproses" },
  { label: "Dikirim", value: "dikirim" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "dibatalkan" },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  menunggu_konfirmasi: "bg-amber-100 text-amber-700",
  diproses: "bg-frost-100 text-frost-700",
  dikirim: "bg-blue-100 text-blue-700",
  selesai: "bg-green-100 text-green-700",
  dibatalkan: "bg-gray-100 text-gray-500",
};

export default function OrdersAdminPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "semua">("semua");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function loadOrders() {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "semua") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setOrders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-ink mb-1">
        Kelola Order & Pengiriman
      </h1>
      <Link href="/admin" className="text-sm text-frost-500 hover:underline">
        ← Kembali ke dashboard
      </Link>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2 mt-6 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === f.value
                ? "bg-frost-600 text-white border-frost-600"
                : "border-frost-300 text-frost-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="border border-frost-200 rounded-shard bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-frost-500">Memuat order...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-frost-500">
            Belum ada order di status ini.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-frost-50 text-frost-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Sumber</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Bayar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-frost-100">
                  <td className="px-4 py-3 text-ink font-medium">
                    {order.order_code}
                  </td>
                  <td className="px-4 py-3 text-frost-600">
                    {order.source === "pos" ? "Kasir" : "Online"}
                  </td>
                  <td className="px-4 py-3 text-frost-700">
                    Rp{order.total.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-frost-600">
                    {order.payment_status.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        STATUS_COLOR[order.status]
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-frost-600 hover:underline"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={loadOrders}
        />
      )}
    </div>
  );
}
