"use client";
// app/login/page.tsx
// "use client" artinya halaman ini jalan di browser (bukan di server),
// karena butuh interaksi (isi form, klik tombol).
// Ada 3 mode di satu halaman: "masuk" (login), "daftar" (signup),
// dan "lupa" (kirim link reset password ke email).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Mode = "masuk" | "daftar" | "lupa";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("masuk");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email atau password salah. Coba lagi.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    // full_name dikirim lewat metadata, nanti otomatis "ditangkap"
    // sama trigger di database buat bikin baris profiles.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Kalau project Supabase-nya masih minta verifikasi email,
    // data.session bakal kosong meski akun udah kebuat.
    if (!data.session) {
      setInfo("Akun berhasil dibuat. Cek email buat verifikasi, lalu masuk.");
      switchMode("masuk");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    // Supabase kirim email berisi link — begitu diklik, pelanggan
    // diarahkan ke /reset-password (dengan sesi login sementara)
    // buat bikin password baru.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setInfo(
      "Link reset password udah dikirim ke email kamu. Cek inbox (atau folder spam)."
    );
  }

  const titles: Record<Mode, string> = {
    masuk: "Masuk ke Fresqa",
    daftar: "Daftar Akun Fresqa",
    lupa: "Reset Password",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">
        {/* Ikon kristal kecil di atas — konsisten sama motif brand */}
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
            <polygon points="12,1 21,8 18,23 6,23 3,8" fill="#1F6E83" />
            <polygon points="12,1 21,8 12,12" fill="#2E8CA3" />
            <polygon points="3,8 6,23 12,12" fill="#0DA891" opacity="0.7" />
          </svg>
        </div>

        <h1 className="font-display text-2xl text-ink text-center mb-1">
          {titles[mode]}
        </h1>
        <p className="text-sm text-frost-500 text-center mb-8">
          {mode === "lupa"
            ? "Masukin email akun kamu, kami kirim link buat bikin password baru."
            : "Buat pelanggan, karyawan, dan admin."}
        </p>

        <form
          onSubmit={
            mode === "masuk"
              ? handleLogin
              : mode === "daftar"
              ? handleSignup
              : handleForgotPassword
          }
          className="space-y-4"
        >
          {mode === "daftar" && (
            <div>
              <label className="text-sm text-frost-700 block mb-1">
                Nama lengkap
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-meltwater-500"
                placeholder="Nama kamu"
              />
            </div>
          )}
          <div>
            <label className="text-sm text-frost-700 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-meltwater-500"
              placeholder="nama@email.com"
            />
          </div>

          {mode !== "lupa" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-frost-700">Password</label>
                {mode === "masuk" && (
                  <button
                    type="button"
                    onClick={() => switchMode("lupa")}
                    className="text-xs text-frost-500 hover:text-meltwater-600 hover:underline"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
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
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-meltwater-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-meltwater-500 text-frost-900 font-medium rounded-shard py-2.5 hover:bg-meltwater-400 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : mode === "masuk"
              ? "Masuk"
              : mode === "daftar"
              ? "Daftar"
              : "Kirim Link Reset"}
          </button>
        </form>

        <p className="text-sm text-frost-500 text-center mt-5">
          {mode === "masuk" && (
            <>
              Belum punya akun?{" "}
              <button
                onClick={() => switchMode("daftar")}
                className="text-frost-700 hover:text-meltwater-600 hover:underline"
              >
                Daftar
              </button>
            </>
          )}
          {mode === "daftar" && (
            <>
              Sudah punya akun?{" "}
              <button
                onClick={() => switchMode("masuk")}
                className="text-frost-700 hover:text-meltwater-600 hover:underline"
              >
                Masuk
              </button>
            </>
          )}
          {mode === "lupa" && (
            <button
              onClick={() => switchMode("masuk")}
              className="text-frost-700 hover:text-meltwater-600 hover:underline"
            >
              ← Kembali ke halaman masuk
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
