// components/Navbar.tsx
// Menu navigasi atas. Dipanggil sekali di app/layout.tsx,
// otomatis muncul di semua halaman.

import Link from "next/link";

export default function Navbar() {
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
          <Link href="/" className="hover:text-frost-900">
            Katalog
          </Link>
          <Link href="/admin" className="hover:text-frost-900">
            Dashboard
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-shard bg-frost-600 text-white hover:bg-frost-700 transition-colors"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}
