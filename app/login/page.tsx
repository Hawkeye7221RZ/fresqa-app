"use client";
// app/login/page.tsx
// "use client" artinya halaman ini jalan di browser (bukan di server),
// karena butuh interaksi (isi form, klik tombol).
// Ada 2 mode: "masuk" (login) dan "daftar" (signup) di satu halaman.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setMode("masuk");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-2xl text-ink mb-1">
        {mode === "masuk" ? "Masuk ke Fresqa" : "Daftar Akun Fresqa"}
      </h1>
      <p className="text-sm text-frost-500 mb-8">
        Buat pelanggan, karyawan, dan admin.
      </p>

      <form
        onSubmit={mode === "masuk" ? handleLogin : handleSignup}
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
              className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
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
            className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            placeholder="nama@email.com"
          />
        </div>
        <div>
          <label className="text-sm text-frost-700 block mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-frost-600">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-frost-600 text-white rounded-shard py-2.5 hover:bg-frost-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Memproses..."
            : mode === "masuk"
            ? "Masuk"
            : "Daftar"}
        </button>
      </form>

      <p className="text-sm text-frost-500 text-center mt-5">
        {mode === "masuk" ? (
          <>
            Belum punya akun?{" "}
            <button
              onClick={() => {
                setMode("daftar");
                setError(null);
                setInfo(null);
              }}
              className="text-frost-700 hover:underline"
            >
              Daftar
            </button>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <button
              onClick={() => {
                setMode("masuk");
                setError(null);
                setInfo(null);
              }}
              className="text-frost-700 hover:underline"
            >
              Masuk
            </button>
          </>
        )}
      </p>
    </div>
  );
}
