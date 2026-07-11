"use client";
// app/admin/stock/page.tsx
// Halaman kelola stok & produksi (route: "/admin/stock")
// Menampilkan stok terkini tiap produk (otomatis ke-update lewat trigger database),
// alert kalau stok di bawah batas minimum, dan riwayat pergerakan stok terbaru.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createClient,
  Product,
  StockItem,
  StockMovement,
} from "@/lib/supabase";
import StockMovementForm from "@/components/StockMovementForm";

type StockRow = StockItem & { product: Product };
type MovementRow = StockMovement & { product: Product };

export default function StockAdminPage() {
  const supabase = createClient();
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .order("name");
    setProducts(productData ?? []);

    const { data: stockData } = await supabase
      .from("stock_items")
      .select("*, product:products(*)")
      .order("updated_at", { ascending: false });
    setStockRows((stockData as unknown as StockRow[]) ?? []);

    const { data: movementData } = await supabase
      .from("stock_movements")
      .select("*, product:products(*)")
      .order("created_at", { ascending: false })
      .limit(15);
    setMovements((movementData as unknown as MovementRow[]) ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const movementLabel: Record<string, string> = {
    produksi: "Produksi",
    terjual: "Terjual",
    rusak: "Rusak",
    penyesuaian: "Penyesuaian",
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-ink">Kelola Stok</h1>
        <button
          onClick={() => setShowForm(true)}
          disabled={products.length === 0}
          className="bg-frost-600 text-white rounded-shard px-4 py-2 text-sm hover:bg-frost-700 disabled:opacity-50"
        >
          + Catat Pergerakan
        </button>
      </div>
      <Link href="/admin" className="text-sm text-frost-500 hover:underline">
        ← Kembali ke dashboard
      </Link>

      {/* Ringkasan stok per produk */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-frost-500">Memuat stok...</p>
        ) : stockRows.length === 0 ? (
          <p className="text-sm text-frost-500 col-span-full">
            Belum ada data stok. Catat pergerakan stok pertama buat mulai.
          </p>
        ) : (
          stockRows.map((row) => {
            const isLow = row.quantity <= row.min_threshold;
            return (
              <div
                key={row.id}
                className={`border rounded-shard bg-white p-4 ${
                  isLow ? "border-red-300" : "border-frost-200"
                }`}
              >
                <p className="text-sm text-frost-500">{row.product?.name}</p>
                <p className="font-display text-2xl text-ink mt-1">
                  {row.quantity}{" "}
                  <span className="text-sm font-body text-frost-500">
                    {row.product?.unit}
                  </span>
                </p>
                {isLow && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠ Stok rendah (batas: {row.min_threshold})
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Riwayat pergerakan stok */}
      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        Riwayat Terbaru
      </h2>
      <div className="border border-frost-200 rounded-shard bg-white overflow-hidden">
        {movements.length === 0 ? (
          <p className="p-6 text-sm text-frost-500">Belum ada riwayat.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-frost-50 text-frost-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Jumlah</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-frost-100">
                  <td className="px-4 py-3 text-frost-500">
                    {new Date(m.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-ink">{m.product?.name}</td>
                  <td className="px-4 py-3 text-frost-700">
                    {movementLabel[m.type]}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      m.quantity >= 0 ? "text-frost-700" : "text-red-500"
                    }`}
                  >
                    {m.quantity >= 0 ? "+" : ""}
                    {m.quantity}
                  </td>
                  <td className="px-4 py-3 text-frost-500">
                    {m.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <StockMovementForm
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
