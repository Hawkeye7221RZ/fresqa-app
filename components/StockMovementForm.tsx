"use client";
// components/StockMovementForm.tsx
// Form buat CATAT pergerakan stok: produksi baru, barang rusak, atau penyesuaian manual.
// Tiap kali form ini disubmit, otomatis nambah baris baru di tabel stock_movements.
// Stok di tabel stock_items ke-update OTOMATIS lewat trigger database (bukan dari sini),
// jadi kita nggak perlu hitung manual di frontend — lebih aman dari salah hitung.

import { useState } from "react";
import { createClient, Product } from "@/lib/supabase";

type MovementType = "produksi" | "rusak" | "penyesuaian";

export default function StockMovementForm({
  products,
  onClose,
  onSaved,
}: {
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [type, setType] = useState<MovementType>("produksi");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // produksi = stok nambah (positif), rusak = stok berkurang (negatif)
    // penyesuaian dibiarkan sesuai input user (bisa + atau -)
    let finalQuantity = Number(quantity);
    if (type === "produksi") finalQuantity = Math.abs(finalQuantity);
    if (type === "rusak") finalQuantity = -Math.abs(finalQuantity);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("stock_movements").insert({
      product_id: productId,
      type,
      quantity: finalQuantity,
      note: note || null,
      created_by: user?.id ?? null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-shard max-w-md w-full p-6">
        <h2 className="font-display text-xl text-ink mb-4">
          Catat Pergerakan Stok
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Produk
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Jenis
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "produksi", label: "Produksi (+)" },
                  { value: "rusak", label: "Rusak (-)" },
                  { value: "penyesuaian", label: "Penyesuaian" },
                ] as { value: MovementType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`text-xs py-2 rounded-shard border ${
                    type === opt.value
                      ? "bg-frost-600 text-white border-frost-600"
                      : "border-frost-300 text-frost-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Jumlah
              {type === "penyesuaian" && (
                <span className="text-frost-400">
                  {" "}
                  (isi negatif kalau mengurangi, misal -5)
                </span>
              )}
            </label>
            <input
              required
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Catatan (opsional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
              placeholder="misal: produksi batch pagi"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-frost-300 rounded-shard py-2 text-frost-700 hover:bg-frost-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-frost-600 text-white rounded-shard py-2 hover:bg-frost-700 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
