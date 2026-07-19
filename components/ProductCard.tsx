"use client";
// components/ProductCard.tsx
// Satu kartu produk. Dipakai berulang di halaman katalog (app/page.tsx).
// Kalau nanti mau ubah tampilan kartu produk, cukup edit file ini,
// otomatis semua kartu di semua halaman ikut berubah.

import { useState } from "react";
import { Product } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="group rounded-shard border border-frost-200 bg-white overflow-hidden hover:border-frost-400 hover:shadow-[0_4px_20px_-6px_rgba(15,85,103,0.15)] transition-all duration-200">
      <div className="aspect-square bg-frost-100 flex items-center justify-center overflow-hidden relative">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-frost-400 text-sm">Belum ada foto</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-ink leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-frost-600 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[15px] font-medium text-frost-800">
            Rp{product.price.toLocaleString("id-ID")}
            <span className="text-xs text-frost-400 font-normal">
              {" "}
              /{product.unit}
            </span>
          </span>
          <button
            onClick={handleAdd}
            className={`text-sm px-3 py-1.5 rounded-shard transition-colors ${
              justAdded
                ? "bg-meltwater-600 text-white"
                : "bg-frost-800 text-white hover:bg-meltwater-600"
            }`}
          >
            {justAdded ? "✓ Ditambah" : "+ Keranjang"}
          </button>
        </div>
      </div>
    </div>
  );
}
