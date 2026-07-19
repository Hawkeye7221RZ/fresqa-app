-- =========================================================
-- FRESQA - Database Schema (Supabase / Postgres)
-- Migration: 001_schema.sql
-- Modul: Profil & Role, Produk, Stok/Produksi, Order,
--        Pengiriman, POS/Transaksi, Laporan
-- =========================================================

-- ---------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PROFILES (role-based: admin, karyawan, pelanggan)
-- Terhubung 1-1 ke auth.users bawaan Supabase
-- ---------------------------------------------------------
create type user_role as enum ('admin', 'karyawan', 'pelanggan');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'pelanggan',
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. PRODUCTS (katalog es batu kristal)
-- ---------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  unit text not null default 'balok', -- balok, kg, kantong, dll
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. STOCK & PRODUCTION LOG
-- stock_items = stok berjalan per produk
-- stock_movements = histori keluar/masuk (produksi, terjual, rusak, dll)
-- ---------------------------------------------------------
create table stock_items (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  quantity numeric(12,2) not null default 0,
  min_threshold numeric(12,2) not null default 10, -- buat alert stok rendah
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create type stock_movement_type as enum ('produksi', 'terjual', 'rusak', 'penyesuaian');

create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  type stock_movement_type not null,
  quantity numeric(12,2) not null, -- positif utk masuk, negatif utk keluar
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. ORDERS (order pelanggan, online & walk-in/POS)
-- ---------------------------------------------------------
create type order_source as enum ('online', 'pos');
create type order_status as enum (
  'menunggu_konfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan'
);
create type payment_status as enum ('belum_bayar', 'menunggu_verifikasi', 'lunas', 'gagal');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text not null unique, -- misal FRQ-20260711-0001
  customer_id uuid references profiles(id), -- null kalau walk-in tanpa akun
  source order_source not null default 'online',
  status order_status not null default 'menunggu_konfirmasi',
  payment_status payment_status not null default 'belum_bayar',
  payment_method text, -- qris, transfer, cod, cash
  delivery_address text,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  handled_by uuid references profiles(id), -- karyawan yg proses (buat POS)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null, -- snapshot nama saat order dibuat
  price numeric(12,2) not null,
  quantity numeric(12,2) not null check (quantity > 0),
  line_total numeric(12,2) not null
);

-- ---------------------------------------------------------
-- 5. DELIVERIES (pengiriman & kurir)
-- ---------------------------------------------------------
create type delivery_status as enum ('menunggu', 'diambil', 'diantar', 'selesai', 'gagal');

create table deliveries (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade unique,
  courier_id uuid references profiles(id),
  status delivery_status not null default 'menunggu',
  proof_photo_url text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. TRIGGERS: auto-update updated_at
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();
create trigger trg_stock_items_updated before update on stock_items
  for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();
create trigger trg_deliveries_updated before update on deliveries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- 7. TRIGGER: auto-adjust stock saat ada stock_movement baru
-- ---------------------------------------------------------
create or replace function apply_stock_movement()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into stock_items (product_id, quantity)
  values (new.product_id, new.quantity)
  on conflict (product_id)
  do update set quantity = stock_items.quantity + new.quantity, updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_stock_movement_apply after insert on stock_movements
  for each row execute function apply_stock_movement();

-- ---------------------------------------------------------
-- 8. HELPER FUNCTION: cek role user saat ini (dipakai di RLS)
-- ---------------------------------------------------------
create or replace function current_role_is(target_role user_role)
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$ language sql stable;

create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'karyawan')
  );
$$ language sql stable;

-- ---------------------------------------------------------
-- 9. AUTO-CREATE PROFILE saat ada user baru daftar
-- Tanpa ini, admin harus manual insert ke `profiles` tiap ada user baru.
-- ---------------------------------------------------------
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'pelanggan'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
