-- =========================================================
-- FRESQA - Auto-create profile saat user baru daftar
-- Migration: 004_auto_profile_trigger.sql
--
-- Sebelumnya: tiap ada user baru daftar lewat Supabase Auth,
-- admin harus manual insert baris ke tabel `profiles` lewat SQL Editor.
--
-- Sesudah ini: begitu user baru daftar (lewat halaman /login → sign up,
-- atau ditambahin manual di Authentication > Users), otomatis kebuat
-- baris di `profiles` dengan role default 'pelanggan'.
-- Admin tinggal ubah role-nya jadi 'karyawan'/'admin' lewat Table Editor
-- kalau itu akun staff.
-- =========================================================

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

-- Trigger ini nempel di tabel auth.users (bawaan Supabase),
-- jalan tiap ada baris baru masuk (= user baru daftar)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
