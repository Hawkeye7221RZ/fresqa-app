"use client";
// components/ProductForm.tsx
// Form buat TAMBAH produk baru ATAU EDIT produk yang udah ada.
// Dipakai di app/admin/products/page.tsx.
// Kalau "product" diisi -> mode edit. Kalau kosong -> mode tambah baru.

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/supabase";

export default function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "balok");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || null,
      price: Number(price),
      unit,
      image_url: imageUrl || null,
    };

    const { error } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

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
          {isEdit ? "Edit Produk" : "Tambah Produk"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Nama produk
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
              placeholder="Es Kristal Batangan"
            />
          </div>

          <div>
            <label className="text-sm text-frost-700 block mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-frost-700 block mb-1">
                Harga (Rp)
              </label>
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
                placeholder="15000"
              />
            </div>
            <div className="w-28">
              <label className="text-sm text-frost-700 block mb-1">
                Satuan
              </label>
              <input
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
                placeholder="balok"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-frost-700 block mb-1">
              URL Foto (opsional)
            </label>
            <input
              value={imageUrl ?? ""}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
              placeholder="https://..."
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
