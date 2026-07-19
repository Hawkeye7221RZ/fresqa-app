import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet "es kristal" — biru dalam laut es, bukan biru generik
        frost: {
          50: "#F3FAFB",
          100: "#E1F2F5",
          200: "#BFE4EA",
          300: "#8FCEDA",
          400: "#57ADC0",
          500: "#2E8CA3",
          600: "#1F6E83",
          700: "#1A5567",
          800: "#123C4A",
          900: "#0A2530",
        },
        glacier: "#EAF6F8", // background terang, kayak permukaan es
        crystal: "#D4F1F4", // aksen highlight es
        ink: "#0E2B33",     // teks utama, biru gelap kehitaman
        // Warna sinyal — dipakai KHUSUS buat CTA utama & harga, biar nggak
        // ketimpa sama biru struktural di atas. Terinspirasi warna air lelehan
        // es yang jernih kehijauan, bukan hijau/teal generik.
        meltwater: {
          400: "#4DDFCB",
          500: "#1FC7AE",
          600: "#0DA891",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"], // buat kode pesanan, harga, label teknis
      },
      borderRadius: {
        shard: "2px 14px 2px 14px", // sudut asimetris, mengingatkan pecahan es
      },
      clipPath: {
        facet: "polygon(0 0, 100% 0, 100% 92%, 0 100%)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        ".clip-facet": {
          "clip-path": "polygon(0 0, 100% 0, 100% 100%, 0 94%)",
        },
      });
    },
  ],
};
export default config;
