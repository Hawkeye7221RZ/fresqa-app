// components/ProductCard.tsx
// Satu kartu produk. Dipakai berulang di halaman katalog (app/page.tsx).
// Kalau nanti mau ubah tampilan kartu produk, cukup edit file ini,
// otomatis semua kartu di semua halaman ikut berubah.

import { Product } from "@/lib/supabase";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group rounded-shard border border-frost-200 bg-white overflow-hidden hover:border-frost-400 transition-colors">
      <div className="aspect-square bg-frost-100 flex items-center justify-center overflow-hidden">
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
        <h3 className="font-display text-lg text-ink">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-frost-600 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-frost-800">
            Rp{product.price.toLocaleString("id-ID")}
            <span className="text-xs text-frost-500 font-normal">
              {" "}
              / {product.unit}
            </span>
          </span>
          <button className="text-sm px-3 py-1.5 rounded-shard bg-frost-600 text-white hover:bg-frost-700 transition-colors">
            + Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
