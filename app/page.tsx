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
    <div>
      {/* HERO — band gelap dgn potongan "facet" di bawah, ilustrasi kristal
          jadi elemen visual utama. Ini "signature" halaman: satu bentuk
          geometris yang diulang jadi motif brand (lihat juga di navbar/icon). */}
      <section className="relative bg-frost-900 clip-facet pb-20 pt-14 md:pt-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-meltwater-400 mb-4">
              Fresqa — Kristal Murni
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-white max-w-lg">
              Dingin yang bisa diandalkan,
              <br className="hidden md:block" /> sampai depan pintu.
            </h1>
            <p className="text-frost-300 mt-5 max-w-md text-[15px]">
              Es batu kristal jernih, dicetak higienis, dikirim hari yang sama.
              Buat acara, dagangan, atau stok harian — tinggal pesan.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <a
                href="#katalog"
                className="bg-meltwater-500 text-frost-900 font-medium text-sm px-6 py-3 rounded-shard hover:bg-meltwater-400 transition-colors"
              >
                Lihat Katalog
              </a>
              <span className="font-mono text-xs text-frost-400">
                Kirim &lt; 2 jam*
              </span>
            </div>
          </div>

          {/* Ilustrasi kristal — susunan facet berlapis, echo dari logo */}
          <div className="relative h-56 md:h-72 flex items-center justify-center">
            <svg viewBox="0 0 240 240" className="w-48 md:w-64 h-48 md:h-64">
              <polygon
                points="120,10 210,80 180,230 60,230 30,80"
                fill="#123C4A"
                stroke="#57ADC0"
                strokeWidth="1.5"
              />
              <polygon points="120,10 210,80 120,120" fill="#1A5567" />
              <polygon points="120,10 30,80 120,120" fill="#2E8CA3" opacity="0.8" />
              <polygon points="30,80 60,230 120,120" fill="#0DA891" opacity="0.55" />
              <polygon points="210,80 180,230 120,120" fill="#4DDFCB" opacity="0.35" />
              <line x1="120" y1="10" x2="120" y2="230" stroke="#EAF6F8" strokeWidth="0.75" opacity="0.4" />
              <line x1="30" y1="80" x2="210" y2="80" stroke="#EAF6F8" strokeWidth="0.75" opacity="0.4" />
            </svg>
          </div>
        </div>
      </section>

      {/* KATALOG */}
      <section id="katalog" className="max-w-5xl mx-auto px-6 pt-14 pb-24">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-ink">Katalog</h2>
          <span className="font-mono text-xs text-frost-400">
            {products.length} produk
          </span>
        </div>

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
