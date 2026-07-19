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
- [x] Dashboard admin: kelola produk (CRUD)
- [x] Dashboard admin: kelola stok/produksi
- [x] Dashboard admin: kelola order & pengiriman
- [x] Fitur keranjang & checkout pelanggan
- [x] Kasir/POS (transaksi walk-in, stok otomatis terpotong)
- [x] Integrasi payment (Midtrans/Xendit)
- [x] Notifikasi WhatsApp
- [x] Ubah jadi PWA

## Catatan soal PWA
- Di Android (Chrome/Edge): muncul tombol "Pasang Fresqa" otomatis di pojok layar, atau lewat menu browser "Install app" / "Add to Home Screen".
- Di iPhone (Safari): tombol otomatis nggak akan muncul (keterbatasan iOS). Pelanggan perlu buka menu Share (kotak dengan panah ke atas) → "Add to Home Screen" secara manual. Ikon & nama app tetap muncul benar karena sudah disiapkan lewat manifest.
- PWA ini nyimpen tampilan/asset di cache biar buka lebih cepat, tapi data produk/order tetap butuh koneksi internet (karena selalu ambil langsung dari Supabase).

## Setup notifikasi WhatsApp (Fonnte)
1. Daftar akun di https://fonnte.com
2. Hubungkan nomor WhatsApp bisnis Fresqa lewat scan QR (di dashboard Fonnte)
3. Copy **Token** dari dashboard Fonnte
4. Tempel ke `.env.local`:
   ```
   FONNTE_TOKEN=token_kamu_di_sini
   ```
5. Restart `npm run dev`

**Kapan notifikasi otomatis terkirim:**
- Pelanggan checkout → dapat WA konfirmasi pesanan
- Admin ubah status order (diproses/dikirim/selesai/dibatalkan) → pelanggan dapat WA update status

Fonnte punya kuota gratis terbatas buat testing; buat pemakaian rutin, cek paket harga di dashboard mereka.

## Setup Payment Gateway (Midtrans)

### 1. Bikin akun sandbox (buat testing, gratis)
1. Daftar di https://dashboard.sandbox.midtrans.com
2. Login, buka **Settings > Access Keys**
3. Copy **Client Key** dan **Server Key**

### 2. Isi environment variable
Tempel ke `.env.local`:
```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

### 3. Ambil Supabase Service Role Key
1. Buka Supabase Dashboard > **Project Settings > API**
2. Cari bagian **service_role** (BUKAN yang `anon public`), copy key-nya
3. Tempel ke `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=isi-di-sini
   ```
   ⚠️ Key ini setara "kunci master" ke database — jangan pernah taruh di kode
   yang jalan di browser, cuma boleh dipakai di route API server (kayak
   `app/api/midtrans-webhook/route.ts`).

### 4. Setup webhook (biar status pembayaran ke-update otomatis)
Midtrans perlu bisa "nembak" ke `/api/midtrans-webhook` tiap ada perubahan
status pembayaran. Selama development di `localhost`, Midtrans nggak bisa
akses komputer kamu langsung — perlu tool tunnel kayak **ngrok**:

1. Install ngrok dari https://ngrok.com/download
2. Jalanin `npm run dev` seperti biasa (port 3000)
3. Di terminal lain, jalanin:
   ```
   ngrok http 3000
   ```
4. Copy URL yang muncul (bentuknya `https://xxxx.ngrok-free.app`)
5. Buka dashboard Midtrans sandbox > **Settings > Configuration**
6. Isi **Payment Notification URL** dengan:
   ```
   https://xxxx.ngrok-free.app/api/midtrans-webhook
   ```
7. Save

*(Kalau nanti udah deploy ke Vercel, tinggal ganti URL webhook-nya pakai domain asli, nggak perlu ngrok lagi)*

### 5. Testing pembayaran
Sandbox Midtrans nyediain nomor kartu/akun palsu buat simulasi bayar
(nggak kena biaya beneran). Cek daftarnya di:
https://docs.midtrans.com/docs/testing-payment-on-sandbox

### 6. Pindah ke akun produksi (kalau udah siap terima uang beneran)
1. Daftar akun production di https://dashboard.midtrans.com (butuh verifikasi bisnis)
2. Ganti Server Key & Client Key di `.env.local` ke yang versi production
3. Ubah `MIDTRANS_IS_PRODUCTION=true`
4. Di `app/layout.tsx`, ganti URL script Snap.js dari
   `app.sandbox.midtrans.com` jadi `app.midtrans.com`
