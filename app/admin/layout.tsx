"use client";
// app/admin/layout.tsx
// Layout ini otomatis "membungkus" semua halaman di dalam /admin/*
// Fungsinya: cek dulu apakah yang login itu admin/karyawan.
// Kalau bukan, tampilkan pesan "tidak punya akses" — bukan data admin.

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center text-frost-500">
        Memeriksa akses...
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="font-display text-xl text-ink mb-2">
          Kamu belum login
        </p>
        <p className="text-sm text-frost-500 mb-6">
          Halaman ini khusus buat admin & karyawan Fresqa.
        </p>
        <Link
          href="/login"
          className="inline-block bg-frost-600 text-white rounded-shard px-5 py-2.5 text-sm hover:bg-frost-700"
        >
          Masuk
        </Link>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="font-display text-xl text-ink mb-2">
          Akses ditolak
        </p>
        <p className="text-sm text-frost-500 mb-1">
          Akun{" "}
          <span className="font-medium text-ink">
            {profile?.full_name ?? "ini"}
          </span>{" "}
          terdaftar sebagai{" "}
          <span className="font-medium text-ink">
            {profile?.role ?? "belum diketahui"}
          </span>
          .
        </p>
        <p className="text-sm text-frost-500 mb-6">
          Cuma admin & karyawan yang bisa buka dashboard ini.
        </p>
        <Link href="/" className="text-sm text-frost-600 hover:underline">
          ← Kembali ke katalog
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
