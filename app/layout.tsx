import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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

export const metadata: Metadata = {
  title: "Fresqa — Es Batu Kristal",
  description: "Pesan es batu kristal berkualitas, langsung dari produsen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${fraunces.variable} ${inter.variable} font-body`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
