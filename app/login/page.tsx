"use client";
// app/login/page.tsx
// "use client" artinya halaman ini jalan di browser (bukan di server),
// karena butuh interaksi (isi form, klik tombol).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-2xl text-ink mb-1">Masuk ke Fresqa</h1>
      <p className="text-sm text-frost-500 mb-8">
        Buat pelanggan, karyawan, dan admin.
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-frost-600 text-white rounded-shard py-2.5 hover:bg-frost-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
