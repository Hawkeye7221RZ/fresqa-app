-- =========================================================
-- FRESQA - Fix: RLS error saat trigger insert ke stock_items
-- Migration: 003_fix_stock_trigger.sql
--
-- Masalah: trigger apply_stock_movement() jalan pakai izin user
-- yang login (bukan izin sistem), padahal tabel stock_items cuma
-- punya policy SELECT & UPDATE, tidak ada policy INSERT.
-- Jadi begitu produk baru dicatat produksinya buat pertama kali,
-- trigger gagal insert baris awal ke stock_items -> RLS error.
--
-- Fix: jadikan function SECURITY DEFINER, supaya trigger jalan
-- dengan izin pemilik function (bisa nembus RLS untuk keperluan
-- sistem), bukan izin user yang sedang login.
-- =========================================================

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
