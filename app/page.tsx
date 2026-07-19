// app/page.tsx
// Ini HALAMAN UTAMA yang dilihat pelanggan (route: "/")
// Server Component: data produk diambil di server sebelum halaman dikirim ke browser,
// jadi loading-nya lebih cepat & SEO-friendly.

import { createClient } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Paksa halaman ini selalu dirender ulang tiap kunjungan (nggak di-cache).
// Ini buat jaga-jaga dari bug caching Next.js App Router yang kadang
// nampilin konten halaman lain di URL yang salah.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getProducts() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal ambil produk:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="ice-texture">
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-10">
        <p className="text-frost-500 text-sm tracking-wide uppercase mb-2">
          Es batu kristal — jernih, higienis, siap kirim
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink max-w-xl">
          Dingin yang bisa diandalkan, sampai depan pintu.
        </h1>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        {products.length === 0 ? (
          <div className="border border-dashed border-frost-300 rounded-shard p-10 text-center text-frost-500">
            Belum ada produk. Tambahkan produk lewat dashboard admin.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
