"use client";
// components/PwaSetup.tsx
// 2 tugas:
// 1. Daftarin service worker (public/sw.js) begitu app dibuka
// 2. Tangkap event "bisa di-install" dari browser, tampilin tombol
//    kecil di pojok layar buat pasang Fresqa ke Home Screen HP.

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaSetup() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Service Worker CUMA didaftarin di production (hasil build/deploy).
    // Di development (npm run dev), Next.js sering ganti-ganti file JS/CSS
    // secara live — kalau Service Worker aktif, dia bisa nyimpen cache versi
    // LAMA dan bikin halaman nampilin konten yang salah/ketuker atau CSS
    // yang nggak sinkron. Makanya di-skip selama development.
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW gagal daftar:", err));
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (!installPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-frost-200 rounded-shard shadow-lg p-4 z-50 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">Pasang Fresqa</p>
        <p className="text-xs text-frost-500">
          Akses lebih cepat lewat Home Screen HP kamu.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-frost-400 text-sm px-2"
      >
        ✕
      </button>
      <button
        onClick={handleInstallClick}
        className="bg-frost-600 text-white text-sm px-3 py-1.5 rounded-shard hover:bg-frost-700 whitespace-nowrap"
      >
        Pasang
      </button>
    </div>
  );
}
