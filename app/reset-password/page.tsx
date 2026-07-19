"use client";
// app/reset-password/page.tsx
// Halaman ini dibuka OTOMATIS pas pelanggan klik link reset password
// dari email mereka (link-nya diarahkan ke sini oleh Supabase).
// Begitu link diklik, Supabase kasih "sesi sementara" — cukup buat
// ganti password, belum berarti login penuh ke akun.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase butuh sedikit waktu buat "menangkap" sesi dari link email
    // (tokennya ada di URL). Kita dengerin event PASSWORD_RECOVERY biar
    // tau kapan sesi itu siap dipakai.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Jaga-jaga kalau event-nya udah lewat sebelum listener kepasang,
    // cek juga langsung apakah ada sesi aktif.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password nggak cocok.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
            <polygon points="12,1 21,8 18,23 6,23 3,8" fill="#1F6E83" />
            <polygon points="12,1 21,8 12,12" fill="#2E8CA3" />
            <polygon points="3,8 6,23 12,12" fill="#0DA891" opacity="0.7" />
          </svg>
        </div>

        <h1 className="font-display text-2xl text-ink text-center mb-1">
          Bikin Password Baru
        </h1>

        {success ? (
          <p className="text-sm text-meltwater-600 text-center mt-4">
            ✓ Password berhasil diganti. Mengarahkan ke halaman masuk...
          </p>
        ) : !ready ? (
          <p className="text-sm text-frost-500 text-center mt-4">
            Memverifikasi link reset password kamu...
          </p>
        ) : (
          <>
            <p className="text-sm text-frost-500 text-center mb-8">
              Masukin password baru buat akun kamu.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-frost-700 block mb-1">
                  Password baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-meltwater-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm text-frost-700 block mb-1">
                  Konfirmasi password baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-meltwater-500"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-meltwater-500 text-frost-900 font-medium rounded-shard py-2.5 hover:bg-meltwater-400 transition-colors disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
