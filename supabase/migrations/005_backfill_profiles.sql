-- =========================================================
-- FRESQA - Backfill profile untuk user lama
-- Migration: 005_backfill_profiles.sql
--
-- Trigger di 004_auto_profile_trigger.sql cuma jalan buat user BARU
-- yang daftar SETELAH trigger itu dipasang. User yang udah daftar
-- sebelumnya (termasuk yang dibikin manual lewat dashboard) belum
-- punya baris di `profiles`, jadi bisa bikin error foreign key
-- pas mereka coba checkout / order.
--
-- Migration ini "menyusulkan" baris profiles buat semua user lama
-- yang kelewatan. Aman dijalankan berkali-kali (on conflict do nothing).
-- =========================================================

insert into profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'pelanggan'
from auth.users
where id not in (select id from profiles)
on conflict (id) do nothing;
