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
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        shard: "2px 14px 2px 14px", // sudut asimetris, mengingatkan pecahan es
      },
    },
  },
  plugins: [],
};
export default config;
