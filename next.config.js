/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Matiin router cache client-side Next.js.
  // Tanpa ini, kadang klik link nampilin konten halaman LAIN yang
  // ke-cache dari kunjungan sebelumnya (bug dikenal di Next.js 14.2.x
  // App Router). Konsekuensinya navigasi antar halaman jadi sedikit
  // lebih lambat (selalu ambil data baru), tapi selalu akurat.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

module.exports = nextConfig;
