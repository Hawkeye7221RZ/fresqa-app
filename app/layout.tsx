import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PwaSetup from "@/components/PwaSetup";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";

// Fraunces = font display berkarakter (dipakai judul/branding)
// Inter = font body, gampang dibaca buat konten panjang
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});
// IBM Plex Mono — dipakai KHUSUS buat harga & kode pesanan.
// Kesan "presisi terukur", cocok sama tema kristal es yang jernih & eksak,
// dan bikin harga langsung kebaca beda dari teks biasa.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fresqa — Es Batu Kristal",
  description: "Pesan es batu kristal berkualitas, langsung dari produsen.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fresqa",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F6E83",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} font-body`}>
        {/* Snap.js Midtrans — dipakai buat munculin popup pembayaran.
            URL ini "sandbox" (buat testing). Kalau udah siap produksi,
            ganti ke https://app.midtrans.com/snap/snap.js */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
            <PwaSetup />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
