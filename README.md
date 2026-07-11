# Fresqa App

Aplikasi internal + katalog online buat usaha es batu kristal Fresqa.

## Cara jalanin di laptop (pertama kali)

### 1. Install Node.js
Download dari https://nodejs.org (pilih versi LTS) kalau belum ada di laptop.

### 2. Install dependency project
Buka terminal di folder project ini, lalu:
```bash
npm install
```

### 3. Setup Supabase
1. Bikin akun & project baru di https://supabase.com
2. Buka **SQL Editor** di dashboard Supabase, jalankan isi file:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Buka **Project Settings > API**, copy `Project URL` dan `anon public key`

### 4. Setup environment variable
```bash
cp .env.local.example .env.local
```
Buka `.env.local`, isi dengan URL & key dari langkah 3.

### 5. Jalankan project
```bash
npm run dev
```
Buka browser ke `http://localhost:3000`

## Struktur folder
```
app/            halaman-halaman (katalog, login, dashboard admin)
components/     bagian UI yang dipakai berulang (navbar, kartu produk)
lib/            koneksi ke Supabase
supabase/       file SQL schema & RLS
```

## Progress
- [x] Schema database + RLS
- [x] Setup project Next.js + Supabase
- [x] Halaman katalog (pelanggan)
- [x] Halaman login
- [x] Kerangka dashboard admin
- [ ] Dashboard admin: kelola produk (CRUD)
- [ ] Dashboard admin: kelola stok/produksi
- [ ] Dashboard admin: kelola order & pengiriman
- [ ] Fitur keranjang & checkout pelanggan
- [ ] Integrasi payment (Midtrans/Xendit)
- [ ] Notifikasi WhatsApp
- [ ] Ubah jadi PWA
