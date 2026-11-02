-- ============================================================
-- SEDEP WETAN — Skema database Supabase (v2, alur verifikasi manual)
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
--
-- Alur pembayaran yang didukung skema ini:
--   1. Pelanggan membuat pesanan (checkout: makan di tempat / bungkus / antar)
--      -> payment_status = 'awaiting_proof' (butuh bukti) atau 'cash_on_site' (COD/kasir)
--   2. Pelanggan transfer lalu UNGGAH BUKTI ke order_proofs
--      -> payment_status = 'under_review'
--   3. ADMIN memeriksa nominal bukti vs grand_total:
--        - sesuai  -> approve_payment()  -> payment_status = 'verified', order_status = 'Dimasak'
--        - tidak   -> reject_payment()   -> payment_status = 'rejected' (pelanggan kirim ulang bukti)
--   4. Hanya setelah 'verified' (atau cash_on_site) pesanan boleh dimasak.
-- ============================================================

-- 1. PROFIL PENGGUNA (terhubung dengan Supabase Auth / auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text default '',
  address text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  tier text default 'Pendatang Baru',
  created_at timestamptz not null default now()
);

-- 2. KATEGORI MENU (sesuai katalog Sedep Wetan v4)
create table if not exists public.categories (
  id smallint generated always as identity primary key,
  name text unique not null,
  icon text default '🍽️',
  sort_order smallint default 0
);

-- 3. MENU / PRODUK
--    spicy_opt = TRUE hanya untuk menu yang memang pedas (rawon level pedas, dsb).
--    Menu minuman/camilan tidak punya pilihan level pedas.
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id smallint references public.categories (id) on delete set null,
  description text,
  long_description text,
  emoji text default '🍽',
  image_url text,                          -- upload ke Supabase Storage, bucket: 'menu'
  price numeric(12, 0) not null check (price >= 0),
  compare_at_price numeric(12, 0) default 0,
  spicy_option boolean not null default false,   -- <-- kunci: level pedas opsional per menu
  rating numeric(2, 1) default 0,
  sold_count integer default 0,
  badge text default '',
  is_active boolean default true,          -- dikelola admin (habis/tersedia)
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. VOUCHER / PROMO — dikelola admin
create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  discount_percent smallint not null default 0 check (discount_percent between 0 and 100),
  free_shipping boolean default false,     -- hanya berlaku bila layanan = 'antar'
  min_spend numeric(12, 0) default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer default 0,
  is_active boolean default true
);

-- 5. PESANAN
--    service: 'antar' | 'dine_in' | 'takeaway'  -> shipping_fee 0 kecuali 'antar'
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  recipient_name text not null,
  recipient_phone text not null,
  service text not null default 'antar'
    check (service in ('antar', 'dine_in', 'takeaway')),
  address text,                            -- wajib bila service = 'antar'
  landmark text,                           -- patokan lokasi antar
  party_size smallint,                     -- isi bila dine_in
  detail_text text default '',             -- ringkasan layanan untuk kurir/dapur
  note text default '',
  method text not null default 'Transfer Bank'
    check (method in ('QRIS','Transfer Bank','E-wallet','Kartu','COD / Bayar di Kasir','VA')),
  payment_status text not null default 'awaiting_proof'
    check (payment_status in ('awaiting_proof','under_review','verified','rejected','cash_on_site')),
  order_status text not null default 'Menunggu Pembayaran'
    check (order_status in ('Menunggu Pembayaran','Pesanan Diterima','Dimasak','Dikemas','Diantar','Selesai','Dibatalkan')),
  subtotal numeric(12, 0) not null default 0,
  discount numeric(12, 0) not null default 0,
  shipping_fee numeric(12, 0) not null default 0,
  grand_total numeric(12, 0) not null default 0,
  promo_code text references public.promos (code) on delete set null,
  paid_amount_claimed numeric(12, 0),      -- nominal yang diklaim pelanggan di form bukti
  verify_note text default '',             -- catatan admin saat setujui/tolak
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  estimated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- shipping fee hanya boleh nonzero untuk layanan antar
  constraint chk_ship_service check (
    case when service = 'antar' then shipping_fee >= 0 else shipping_fee = 0 end
  )
);

-- 6. BUKTI PEMBAYARAN (diunggah pelanggan, diperiksa admin)
--    data_url untuk prototype lokal; di produksi simpan path Supabase Storage bucket 'proofs'.
create table if not exists public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  uploaded_by uuid references auth.users (id),
  file_name text not null,
  file_path text,                          -- path di bucket 'proofs'
  data_url text,                           -- fallback inline (prototype)
  claimed_amount numeric(12, 0) not null,
  bank_ref text default '',                -- bank/e-wallet pengirim + no. referensi
  created_at timestamptz not null default now()
);

-- 7. ITEM PESANAN
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  menu_name text not null,                 -- snapshot
  menu_emoji text,
  image_url text,
  unit_price numeric(12, 0) not null,
  quantity integer not null default 1 check (quantity > 0),
  spice_level text,                        -- NULL bila menu tidak punya opsi pedas
  addon text default 'Tanpa tambahan',
  line_total numeric(12, 0) not null,
  constraint chk_spice check (spice_level is null or spice_level in ('Tidak pedas','Sedang','Pedas','Nyoss!'))
);

-- 8. ULASAN
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id bigint references public.order_items (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now()
);

-- 9. KERANJANG per pengguna (opsional)
create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  spice_level text,
  addon text default 'Tanpa tambahan',
  unique (user_id, menu_item_id, spice_level, addon)
);

-- 10. PESAN & RESERVASI dari halaman Tentang
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEKS
-- ============================================================
create index if not exists idx_menu_category on public.menu_items (category_id);
create index if not exists idx_menu_active   on public.menu_items (is_active);
create index if not exists idx_orders_user   on public.orders (user_id, created_at desc);
create index if not exists idx_orders_pay    on public.orders (payment_status);
create index if not exists idx_orders_status on public.orders (order_status);
create index if not exists idx_items_order   on public.order_items (order_id);
create index if not exists idx_proofs_order  on public.order_proofs (order_id, created_at desc);

-- ============================================================
-- TRIGGER: updated_at otomatis
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_menu_touch on public.menu_items;
create trigger trg_menu_touch before update on public.menu_items
for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- HITUNG ONGKIR DI SERVER (anti-manipulasi harga oleh klien)
-- ============================================================
create or replace function public.calc_shipping(p_service text, p_subtotal numeric)
returns numeric language sql stable as $$
  select case
    when p_service <> 'antar' then 0
    when p_subtotal >= 75000  then 0
    else 8000
  end;
$$;

-- ============================================================
-- FUNGSI VERIFIKASI BAYAR — hanya admin
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- setujui bukti pembayaran; nominal harus SAMA PERSIS dengan grand_total
create or replace function public.approve_payment(p_order uuid)
returns text language plpgsql security definer as $$
declare
  o public.orders;
  latest public.order_proofs;
begin
  if not public.is_admin() then
    raise exception 'hanya admin yang boleh memverifikasi pembayaran';
  end if;
  select * into o from public.orders where id = p_order;
  if o.id is null then raise exception 'pesanan tidak ditemukan'; end if;
  select * into latest from public.order_proofs
    where order_id = p_order order by created_at desc limit 1;
  if latest.id is null then raise exception 'belum ada bukti pembayaran'; end if;
  if latest.claimed_amount <> o.grand_total then
    raise exception 'nominal bukti (%) tidak sama dengan tagihan (%)', latest.claimed_amount, o.grand_total;
  end if;
  update public.orders set
    payment_status = 'verified',
    order_status   = 'Dimasak',
    verified_by    = auth.uid(),
    verified_at    = now(),
    verify_note    = coalesce(verify_note, 'Pembayaran sesuai, pesanan diteruskan ke dapur.')
  where id = p_order;
  return 'verified';
end $$;

-- tolak pembayaran (dengan alasan), pelanggan harus kirim bukti ulang
create or replace function public.reject_payment(p_order uuid, p_reason text)
returns text language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'hanya admin yang boleh memverifikasi pembayaran';
  end if;
  if coalesce(p_reason, '') = '' then
    raise exception 'alasan penolakan wajib diisi';
  end if;
  update public.orders set
    payment_status = 'rejected',
    order_status   = 'Menunggu Pembayaran',
    verify_note    = p_reason,
    verified_by    = auth.uid(),
    verified_at    = now()
  where id = p_order;
  return 'rejected';
end $$;

-- admin memajukan status dapur; ditolak bila bayar belum verified / cash_on_site
create or replace function public.advance_order(p_order uuid)
returns text language plpgsql security definer as $$
declare cur text; nxt text;
begin
  if not public.is_admin() then raise exception 'hanya admin yang boleh mengubah status'; end if;
  select order_status into cur from public.orders where id = p_order;
  if not exists (select 1 from public.orders where id = p_order
                 and payment_status in ('verified','cash_on_site')) then
    raise exception 'pesanan belum dibayar/terverifikasi, tidak boleh dimasak';
  end if;
  nxt := case cur
    when 'Menunggu Pembayaran' then 'Pesanan Diterima'
    when 'Pesanan Diterima'    then 'Dimasak'
    when 'Dimasak'             then 'Dikemas'
    when 'Dikemas'             then 'Diantar'
    when 'Diantar'             then 'Selesai'
    else cur end;
  update public.orders set order_status = nxt where id = p_order;
  return nxt;
end $$;

-- pelanggan menandai bukti terkirim -> status under_review
create or replace function public.submit_proof(p_order uuid, p_file text, p_claimed numeric, p_ref text)
returns uuid language plpgsql security definer as $$
declare oid uuid; pid uuid;
begin
  select id into oid from public.orders
    where id = p_order and user_id = auth.uid()
      and payment_status in ('awaiting_proof','rejected');
  if oid is null then raise exception 'pesanan tidak ditemukan / tidak boleh kirim bukti'; end if;
  insert into public.order_proofs (order_id, uploaded_by, file_name, file_path, claimed_amount, bank_ref)
  values (p_order, auth.uid(), coalesce(p_file, 'bukti.jpg'), p_file, p_claimed, coalesce(p_ref, ''))
  returning id into pid;
  update public.orders set payment_status = 'under_review', paid_amount_claimed = p_claimed
    where id = p_order;
  return pid;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.menu_items      enable row level security;
alter table public.promos          enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.order_proofs    enable row level security;
alter table public.reviews         enable row level security;
alter table public.cart_items      enable row level security;
alter table public.contact_messages enable row level security;

create policy "profiles: baca siapa saja"  on public.profiles for select using (true);
create policy "profiles: ubah milik sendiri" on public.profiles for update using (auth.uid() = id);
create policy "profiles: buat milik sendiri" on public.profiles for insert with check (auth.uid() = id);

create policy "menu: publik boleh lihat" on public.menu_items for select using (is_active or public.is_admin());
create policy "menu: admin menulis"      on public.menu_items for all using (public.is_admin()) with check (public.is_admin());

create policy "categories: publik boleh lihat" on public.categories for select using (true);
create policy "categories: admin menulis"      on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "promos: aktif boleh dilihat" on public.promos for select using (is_active or public.is_admin());
create policy "promos: admin menulis"       on public.promos for all using (public.is_admin()) with check (public.is_admin());

create policy "orders: milik sendiri / admin" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: buat milik sendiri"    on public.orders for insert with check (user_id = auth.uid());
-- pelanggan HANYA boleh mengubah kolom alamat/note; status & verifikasi lewat fungsi RPC admin
create policy "orders: admin mengubah"  on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders: admin menghapus" on public.orders for delete using (public.is_admin());

create policy "items: ikut pesanannya" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "items: tulis lewat pemilik/admin" on public.order_items for all
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- PROOFS: pemilik melihat buktinya sendiri + catatannya; admin melihat semua
create policy "proofs: pemilik & admin" on public.order_proofs for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "proofs: tulis via RPC" on public.order_proofs for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "reviews: publik boleh lihat" on public.reviews for select using (true);
create policy "reviews: buat oleh pemiliknya" on public.reviews for insert with check (auth.uid() = user_id);

create policy "cart: milik sendiri" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- contact_messages: publik boleh kirim, hanya admin yang membaca/menandai selesai
create policy "pesan: publik boleh kirim" on public.contact_messages for insert with check (true);
create policy "pesan: admin membaca"      on public.contact_messages for select using (public.is_admin());
create policy "pesan: admin mengelola"    on public.contact_messages for update using (public.is_admin());

-- ============================================================
-- VIEW laporan penjualan (hanya memakai dana TERVALIDASI)
-- ============================================================
create or replace view public.v_sales_daily as
select date_trunc('day', created_at)::date as day,
       count(*) as order_count,
       sum(grand_total) as revenue
from public.orders
where payment_status in ('verified','cash_on_site')
  and order_status <> 'Dibatalkan'
group by 1 order by 1 desc;

create or replace view public.v_top_products as
select m.id, m.name, m.emoji, m.image_url,
       sum(oi.quantity) as total_sold,
       sum(oi.line_total) as revenue
from public.order_items oi
join public.menu_items m on m.id = oi.menu_item_id
join public.orders o on o.id = oi.order_id and o.payment_status in ('verified','cash_on_site')
group by m.id, m.name, m.emoji, m.image_url
order by total_sold desc;

-- ============================================================
-- DATA AWAL (seed) — kategori + menu v4 (ringkas; lengkapnya dari app)
-- ============================================================
insert into public.categories (name, icon, sort_order) values
  ('Hidangan Utama',   '🍲', 1),
  ('Paket Hemat Sedep','💰', 2),
  ('Camilan & Side',   '🥟', 3),
  ('Minuman Segar',    '🥤', 4)
on conflict (name) do nothing;

insert into public.menu_items (name, category_id, description, price, emoji, spicy_option, badge, is_favorite, rating, sold_count)
select v.name, c.id, v.description, v.price, v.emoji, v.spicy, v.badge, v.fav, v.rating, v.sold
from (values
  ('Rawon Daging Sapi','Hidangan Utama','Kuah kluwek pekat, daging sandung lamur, tauge & telur asin.',28000,'🍲',false,'Favorit',true,4.9,1120),
  ('Rujak Cingur Surobooyo','Hidangan Utama','Cingur sapi, bumbu petis, lontong, sayur & buah segar.',26000,'🥗',true,'Khas',true,4.8,980),
  ('Sego Tempong Banyuwangi','Hidangan Utama','Nasi, pecel ringan, ikan asin, sambal ijo tempong.',25000,'🍛',true,'Favorit',true,4.9,1310),
  ('Soto Ayam Lamongan','Hidangan Utama','Kuah kunyit gurih, koya, ayam suwir, perkedel.',22000,'🍜',false,'Best seller',true,4.8,1560),
  ('Nasi Pecel Madioen','Hidangan Utama','Sayur rebus, bumbu pecel kacang, rempeyek, telur.',18000,'🥬',true,'',false,4.7,870),
  ('Tahoe Teh Surabaya','Hidangan Utama','Tahu goreng + lontong, saus kacang petis, telur.',18000,'🧆',false,'',false,4.7,760),
  ('Paket Bromo','Paket Hemat Sedep','Rawon, nasi, tempe menjes, es sinom.',33000,'🌋',true,'Hemat',true,4.9,980),
  ('Paket Semeru','Paket Hemat Sedep','Sego tempong + es teh jumbo.',24000,'🌄',true,'Hemat',true,4.8,1180),
  ('Ote-Ote Porong (2 pcs)','Camilan & Side','Bakwan sayur udang khas Porong.',12000,'🥟',false,'',false,4.7,640),
  ('Sate Kerang Sidoardjo (3 tusuk)','Camilan & Side','Sate kerang bumbu kecap manis gurih.',12000,'🦪',false,'Khas',true,4.8,720),
  ('Tempoe Menjes Goreng','Camilan & Side','Tempe menjes (bumbu warna oranye) digoreng.',8000,'🫓',false,'',false,4.6,810),
  ('Es Dawet Siwalan','Minuman Segar','Cendol, siwalan, santan, gula aren.',12000,'🥥',false,'Favorit',true,4.8,1240),
  ('Wedang Angsle Hangat','Minuman Segar','Kuah jahe, roti, mutiara, kacang sangrai.',12000,'🫖',false,'Hangat',true,4.7,540),
  ('Es Sinom Asli','Minuman Segar','Kunyit asam jawa, dingin, segar.',8000,'🌿',false,'',false,4.6,890),
  ('Kopi Toebroek Cangkir','Minuman Segar','Kopi tubruk robusta, gula batu, cangkir belerang.',6000,'☕',false,'Murah meriah',true,4.7,1450),
  ('Es Teh Melati Jumbo','Minuman Segar','Teh melati gula batu, gelas 1 liter.',5000,'🧋',false,'Terlaris',true,4.9,2680)
) as v(name, cat, description, price, emoji, spicy, badge, fav, rating, sold)
join public.categories c on c.name = v.cat
where not exists (select 1 from public.menu_items m where m.name = v.name);

insert into public.promos (code, title, description, discount_percent, free_shipping, min_spend) values
  ('SEDAP20','Diskon 20% Rawon','Berlaku Senin–Rabu, selama stok ada.',20,false,0),
  ('ONGKIRGRATIS','Gratis Ongkir','Min. belanja Rp75.000, khusus layanan antar.',0,true,75000),
  ('JUMATSEDAP','Paket Hemat Bromo & Semeru','Harga bundling hemat tiap hari.',0,false,0),
  ('NGEMIL10','Diskon Camilan 10%','Untuk camilan & side di atas Rp30.000.',10,false,30000)
on conflict (code) do nothing;

-- ============================================================
-- STORAGE — bucket gambar menu + bukti pembayaran
-- ============================================================
insert into storage.buckets (id, name, public) values ('menu', 'menu', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false)  -- privat: bukti bayar
on conflict (id) do nothing;

create policy "menu images publik" on storage.objects for select
  using (bucket_id = 'menu');
create policy "menu images admin upload" on storage.objects for insert
  with check (bucket_id = 'menu' and public.is_admin());

-- pemilik pesanan mengunggah bukti ke folder <order_id>/ di bucket 'proofs'
create policy "proofs: pemilik upload" on storage.objects for insert
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] in (
    select id::text from public.orders where user_id = auth.uid()));
create policy "proofs: pemilik & admin baca" on storage.objects for select
  using (bucket_id = 'proofs' and (public.is_admin() or (storage.foldername(name))[1] in (
    select id::text from public.orders where user_id = auth.uid())));

-- SELESAI.
-- Catatan produksi:
--  * Jangan izinkan signup publik membuat role 'admin' (default 'customer'; role admin diubah manual superadmin).
--  * Harga, diskon, ongkir, dan verifikasi SEMUA dihitung/divalidasi di server (RPC) — klien tidak dipercaya.
--  * Realtime: subscribe channel postgres_changes pada orders & order_proofs agar pelanggan melihat update verifikasi.
