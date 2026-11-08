# Supabase — Template Integrasi "Sedep Wetan" (v2: verifikasi pembayaran manual oleh admin)

Folder ini berisi **template** (belum aktif). Prototype saat ini berjalan penuh
dengan penyimpanan `localStorage` browser: alur pesan → bayar → unggah bukti →
verifikasi admin **sudah berfungsi nyata** di sisi klien, tetapi datanya masih
per-perangkat. File di folder ini adalah cara memindahkannya ke backend bersama.

## Isi folder

| File | Fungsi |
|---|---|
| `schema.sql` | Tabel (termasuk `order_proofs` & `contact_messages`), RPC (`calc_shipping`, `submit_proof`, `approve_payment`, `reject_payment`, `advance_order`), RLS, view laporan, seed. Dijalankan di **SQL Editor**. |
| `client.js` | Init SDK Supabase + fungsi auth (signup, login, logout, cek role admin). |
| `queries.js` | Kueri siap pakai: menu, voucher, ongkir server-side, buat pesanan, unggah bukti, verifikasi admin, realtime, laporan, pesan kontak. |

## Alur pembayaran yang didukung (sama dengan prototype)

```
Pelanggan checkout (pilih layanan: dine_in / takeaway / antar)
  └─ antar      → shipping_fee dihitung SERVER (Rp8.000, gratis ≥ Rp75.000)
  └─ selainnya  → shipping_fee = 0 (ditegakkan CHECK constraint di DB)
  └─ order dibuat: payment_status = awaiting_proof  (atau cash_on_site utk COD/kasir)
Pelanggan transfer nominal PERSIS grand_total → unggah berkas ke bucket 'proofs'
  └─ rpc submit_proof() → payment_status = under_review
ADMIN membuka antrean verifikasi (pendingVerifications)
  ├─ sesuai → rpc approve_payment()  → verified + order_status = Dimasak
  └─ tidak  → rpc reject_payment(alasan) → rejected, pelanggan kirim bukti ulang
Dapur hanya boleh memajukan status bila payment_status ∈ {verified, cash_on_site}
  └─ rpc advance_order() menolak keras order yang belum lunas
```

Inti keamanannya: **klien tidak pernah memutuskan status bayar**. Nominal
dibandingkan di server (`approve_payment` menolak bila `claimed_amount ≠
grand_total`), berkas bukti tersimpan di bucket privat `proofs` dengan policy
hanya pemilik order + admin, dan realtime `watchOrder()` memberi tahu pelanggan
saat admin menyetujui/menolak.

## Langkah mengaktifkan

1. Buat proyek di [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, tempel `schema.sql`, **Run** (termasuk blok STORAGE — bucket `menu` publik + bucket `proofs` privat).
3. **Authentication → Providers → Email**: aktifkan Email; untuk uji coba matikan *Confirm email*.
4. Buat akun admin: daftar lewat aplikasi lalu
   ```sql
   update public.profiles set role = 'admin' where id = '<user-id>';
   ```
   (signup publik selalu mendapat `customer`; role admin tidak bisa dipilih sendiri)
5. Tambahkan SDK ke HTML sebelum `sw.js`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
6. Isi `SUPABASE_CONFIG` di `client.js` dengan **URL** & **anon key**. Jangan pernah menaruh `service_role key` di frontend.
7. Ganti penyimpanan lokal dengan fungsi di `queries.js`:
   - Render menu → `listMenu()` ; kelola menu admin → `upsertMenuItem()`, `setMenuActive()`
   - Checkout → `placeOrder()` (subtotal/diskon/ongkir dihitung ulang server)
   - Unggah bukti → `uploadPaymentProof()` ; lihat bukti → `fetchProofs()`
   - Panel verifikasi admin → `pendingVerifications()`, `approvePayment()`, `rejectPayment()`
   - Status dapur → `advanceOrder()` (server menolak bila belum lunas)
   - Lacak pesanan → `myOrders()` + `watchOrder(id, cb)`
   - Laporan → `salesReport()`, `topProducts()` (view hanya memakai dana tervalidasi)
   - Form Tentang kami → `sendContactMessage()`
8. Setelah backend aktif, hapus `SAVE()`/`localStorage` pada `sw.js` & `sw2.js`
   serta badge versi `sw-v4` (migrasi data lokal tidak diperlukan lagi).

## Catatan keamanan (RLS sudah diatur di schema.sql)

- Pelanggan: baca menu aktif; hanya membuat & melihat **pesanan + bukti miliknya sendiri**; mengubah profil sendiri.
- Admin: CRUD menu/promo, gambar Storage, melihat semua pesanan & bukti, dan satu-satunya pihak yang bisa menyetujui/tolak pembayaran.
- Dashboard admin dilindungi **dua lapis**: guard UI (JS) *dan* RLS + `security definer` RPC — URL/ fungsi admin tetap ditolak database walau UI di-bypass.
- Harga final, diskon, dan ongkir **tidak pernah dipercaya dari klien**.
- Opsi otomatis (opsional, tahap berikutnya): payment gateway (Midtrans/Xendit) lewat Edge Function + webhook yang memanggil `approve_payment()` secara server-side bila nominal cocok.

## Model data (ringkas)

```
auth.users ─1:1─ profiles (role: customer|admin)
categories ─1:N─ menu_items (spicy_option: bool ← level pedas hanya utk menu tertentu)
orders     ─1:N─ order_items ─N:1─ menu_items (spice_level boleh NULL)
orders     ─1:N─ order_proofs  (bukti bayar, bucket privat 'proofs')
orders     ─N:1─ promos
contact_messages               (pesan halaman Tentang, hanya admin yang membaca)
view: v_sales_daily, v_top_products (hanya payment_status verified|cash_on_site)
```
