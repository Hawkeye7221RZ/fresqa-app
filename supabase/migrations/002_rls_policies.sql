-- =========================================================
-- FRESQA - Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Role: admin (full akses), karyawan (operasional), pelanggan (data sendiri)
-- =========================================================

alter table profiles enable row level security;
alter table products enable row level security;
alter table stock_items enable row level security;
alter table stock_movements enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table deliveries enable row level security;

-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------
create policy "profiles: user lihat profil sendiri"
  on profiles for select
  using (id = auth.uid() or is_staff());

create policy "profiles: user update profil sendiri"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin full akses"
  on profiles for all
  using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- ---------------------------------------------------------
-- PRODUCTS (semua orang bisa lihat produk aktif, staff bisa kelola)
-- ---------------------------------------------------------
create policy "products: publik lihat produk aktif"
  on products for select
  using (is_active = true or is_staff());

create policy "products: staff kelola produk"
  on products for insert
  with check (is_staff());

create policy "products: staff update produk"
  on products for update
  using (is_staff());

create policy "products: admin hapus produk"
  on products for delete
  using (current_role_is('admin'));

-- ---------------------------------------------------------
-- STOCK ITEMS & MOVEMENTS (hanya staff)
-- ---------------------------------------------------------
create policy "stock_items: staff lihat"
  on stock_items for select
  using (is_staff());

create policy "stock_items: staff update"
  on stock_items for update
  using (is_staff());

create policy "stock_movements: staff lihat"
  on stock_movements for select
  using (is_staff());

create policy "stock_movements: staff input"
  on stock_movements for insert
  with check (is_staff());

-- ---------------------------------------------------------
-- ORDERS
-- pelanggan: cuma lihat & buat order miliknya sendiri
-- staff: lihat & kelola semua order
-- ---------------------------------------------------------
create policy "orders: pelanggan lihat order sendiri"
  on orders for select
  using (customer_id = auth.uid() or is_staff());

create policy "orders: pelanggan buat order sendiri"
  on orders for insert
  with check (customer_id = auth.uid() or is_staff());

create policy "orders: pelanggan update order sendiri sebelum diproses"
  on orders for update
  using (
    (customer_id = auth.uid() and status = 'menunggu_konfirmasi')
    or is_staff()
  );

-- ---------------------------------------------------------
-- ORDER ITEMS (ikut akses parent order)
-- ---------------------------------------------------------
create policy "order_items: lihat sesuai akses order"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or is_staff())
    )
  );

create policy "order_items: insert sesuai akses order"
  on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or is_staff())
    )
  );

-- ---------------------------------------------------------
-- DELIVERIES
-- pelanggan: lihat status pengiriman order miliknya
-- staff/kurir: kelola pengiriman
-- ---------------------------------------------------------
create policy "deliveries: pelanggan lihat pengiriman order sendiri"
  on deliveries for select
  using (
    exists (
      select 1 from orders o
      where o.id = deliveries.order_id and o.customer_id = auth.uid()
    )
    or is_staff()
  );

create policy "deliveries: staff kelola"
  on deliveries for insert
  with check (is_staff());

create policy "deliveries: staff & kurir update status"
  on deliveries for update
  using (is_staff() or courier_id = auth.uid());
