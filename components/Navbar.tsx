"use client";
// components/Navbar.tsx
// Menu navigasi atas. Dipanggil sekali di app/layout.tsx,
// otomatis muncul di semua halaman.
// "use client" karena perlu baca jumlah item keranjang & status login secara live.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  karyawan: "Karyawan",
  pelanggan: "Pelanggan",
};

export default function Navbar() {
  const { totalItems } = useCart();
  const { userId, profile, loading, isStaff, refresh } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    refresh();
    router.push("/");
  }

  return (
    <header className="border-b border-frost-200 bg-glacier/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-frost-800"
        >
          Fresqa
        </Link>
        <nav className="flex items-center gap-6 text-sm text-frost-700">
          <Link href="/" prefetch={false} className="hover:text-frost-900">
            Katalog
          </Link>
          {isStaff && (
            <Link href="/admin" prefetch={false} className="hover:text-frost-900">
              Dashboard
            </Link>
          )}
          <Link href="/cart" prefetch={false} className="hover:text-frost-900 relative">
            Keranjang
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-frost-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {loading ? null : userId ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-frost-500">
                {profile?.full_name ?? "Profil belum lengkap"}{" "}
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    profile
                      ? "bg-frost-100 text-frost-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {profile
                    ? ROLE_LABEL[profile.role] ?? profile.role
                    : "perlu setup"}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-shard border border-frost-300 text-frost-700 hover:bg-frost-50 transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-shard bg-frost-600 text-white hover:bg-frost-700 transition-colors"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
