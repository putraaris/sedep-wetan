/* ============================================================
   SEDEP WETAN — query.js
   Semua akses data Supabase: menu, voucher, pesanan, bukti bayar,
   verifikasi admin (RPC), dan realtime.
   Semua harga/ongkir/verifikasi DIVALIDASI SERVER (RPC/trigger) —
   klien tidak pernah mengirim harga final.
   ============================================================ */
import { db } from './client.js';

const SHIP_FLAT = 8000, SHIP_FREE_ABOVE = 75000;

/* ---------------- MENU (publik baca, admin tulis) ---------------- */
export async function listMenu({ category, q } = {}) {
  let query = db.from('menu_items').select('*, categories(name, icon)').eq('is_active', true);
  if (category) query = query.eq('categories.name', category);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  const { data, error } = await query.order('sold_count', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertMenuItem(item) {           // admin saja
  const { data, error } = await db.from('menu_items')
    .upsert(item).select().single();
  if (error) throw error;
  return data;
}
export async function setMenuActive(id, active) {       // admin saja
  const { error } = await db.from('menu_items').update({ is_active: active }).eq('id', id);
  if (error) throw error;
}

/* ---------------- VOUCHER ---------------- */
export async function redeemVoucher(code, subtotal, service) {
  const { data: promo, error } = await db.from('promos')
    .select('*').eq('code', code.toUpperCase()).eq('is_active', true).maybeSingle();
  if (error) throw error;
  if (!promo) throw new Error('Kode voucher tidak ditemukan');
  if (subtotal < (promo.min_spend ?? 0)) throw new Error('Min. belanja belum tercapai');
  let discount = 0, shipping = calcShipping(subtotal, service);
  if (promo.discount_percent > 0) discount = Math.round(subtotal * promo.discount_percent / 100);
  if (promo.free_shipping && service === 'antar') shipping = 0;
  return { discount, shipping, total: subtotal - discount + shipping };
}

/* ---------------- ONGKIR (server-side source of truth) ---------------- */
export function calcShipping(subtotal, service) {
  if (service !== 'antar') return 0;                    // dine-in & takeaway: tidak ada ongkir
  return subtotal >= SHIP_FREE_ABOVE ? 0 : SHIP_FLAT;
}
export async function calcShippingServer(service, subtotal) {
  const { data, error } = await db.rpc('calc_shipping', { p_service: service, p_subtotal: subtotal });
  if (error) throw error;
  return data;                                          // pakai hasil server, jangan percaya klien
}

/* ---------------- PESANAN + BUKTI PEMBAYARAN ---------------- */
export async function placeOrder({ cart, promoCode, session, form }) {
  const user = session ?? (await db.auth.getUser()).data.user;
  if (!user) throw new Error('Harus login untuk memesan');

  const subtotal = cart.reduce((a, i) => a + i.unit_price * i.quantity, 0);
  const service = form.service;                         // 'antar' | 'dine_in' | 'takeaway'
  const shipping = await calcShippingServer(service, subtotal);
  const method = form.method;
  const needProof = method !== 'COD / Bayar di Kasir';
  const discount = promoCode ? (await redeemVoucher(promoCode, subtotal, service)).discount : 0;
  const grand = subtotal - discount + shipping;

  const orderCode = 'SW' + Date.now().toString().slice(-6);
  const { data: order, error } = await db.from('orders').insert({
    order_code: orderCode,
    user_id: user.id,
    customer_name: user.user_metadata?.full_name ?? '',
    recipient_name: form.name, recipient_phone: form.phone,
    service,
    address: service === 'antar' ? form.address : null,
    landmark: service === 'antar' ? form.landmark ?? null : null,
    party_size: service === 'dine_in' ? Number(form.party_size) || null : null,
    detail_text: form.detailText ?? '',
    note: form.note ?? '',
    method,
    payment_status: needProof ? 'awaiting_proof' : 'cash_on_site',
    order_status: needProof ? 'Menunggu Pembayaran' : 'Pesanan Diterima',
    subtotal, discount, shipping_fee: shipping, grand_total: grand,
    promo_code: promoCode ?? null
  }).select().single();
  if (error) throw error;

  const items = cart.map(i => ({
    order_id: order.id,
    menu_item_id: i.menu_item_id ?? null,
    menu_name: i.menu_name, menu_emoji: i.emoji ?? null, image_url: i.image_url ?? null,
    unit_price: i.unit_price, quantity: i.quantity,
    spice_level: i.spicy ? i.spice_level : null,
    addon: i.addon ?? 'Tanpa tambahan',
    line_total: i.unit_price * i.quantity
  }));
  const { error: eItems } = await db.from('order_items').insert(items);
  if (eItems) throw eItems;
  return { ...order, items };
}

/* ---------------- UNGGAH BUKTI + KIRIM ---------------- */
export async function uploadPaymentProof(order, file, claimedAmount, bankRef) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${order.id}/${Date.now()}.${ext}`;
  const { error: up } = await db.storage.from('proofs').upload(path, file, { upsert: false });
  if (up) throw up;
  const { data, error } = await db.rpc('submit_proof', {
    p_order: order.id, p_file: path, p_claimed: claimedAmount, p_ref: bankRef ?? ''
  });
  if (error) throw error;
  return data;                                          // id baris order_proofs
}
export async function fetchProofs(orderId) {            // pemilik/admin
  const { data, error } = await db.from('order_proofs')
    .select('*').eq('order_id', orderId).order('created_at', { ascending: false });
  if (error) throw error;
  return Promise.all(data.map(async p => {
    let url = p.data_url ?? null;
    if (p.file_path) {
      const { data: signed } = await db.storage.from('proofs').createSignedUrl(p.file_path, 60 * 30);
      url = signed?.signedUrl ?? url;
    }
    return { ...p, url };
  }));
}

/* ---------------- VERIFIKASI ADMIN ---------------- */
export async function approvePayment(orderId) {         // admin
  const { data, error } = await db.rpc('approve_payment', { p_order: orderId });
  if (error) throw error;
  return data;                                          // 'verified'
}
export async function rejectPayment(orderId, reason) {  // admin
  const { data, error } = await db.rpc('reject_payment', { p_order: orderId, p_reason: reason });
  if (error) throw error;
  return data;                                          // 'rejected'
}
export async function advanceOrder(orderId) {           // admin; server menolak bila belum verified
  const { data, error } = await db.rpc('advance_order', { p_order: orderId });
  if (error) throw error;
  return data;                                          // status baru
}

/* ---------------- LACAK PESANAN ---------------- */
export async function myOrders() {
  const { data, error } = await db.from('orders')
    .select('*, order_items(*), order_proofs(*)')
    .eq('user_id', (await db.auth.getUser()).data.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function pendingVerifications() {          // admin
  const { data, error } = await db.from('orders')
    .select('*, order_items(*), order_proofs(*)')
    .eq('payment_status', 'under_review')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/* ---------------- REALTIME ---------------- */
export function watchOrder(orderId, cb) {
  return db.channel(`order:${orderId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, cb)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_proofs', filter: `order_id=eq.${orderId}` }, cb)
    .subscribe();
}
export function watchAdminQueue(cb) {                   // admin: bukti baru masuk
  return db.channel('verification-queue')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: "payment_status=eq.under_review" }, cb)
    .subscribe();
}

/* ---------------- LAPORAN (hanya dana tervalidasi) ---------------- */
export async function salesReport(days = 30) {
  const { data, error } = await db.from('v_sales_daily').select('*');
  if (error) throw error;
  const since = Date.now() - days * 864e5;
  return data.filter(r => new Date(r.day).getTime() >= since);
}
export async function topProducts(limit = 10) {
  const { data, error } = await db.from('v_top_products').select('*').limit(limit);
  if (error) throw error;
  return data;
}

/* ---------------- PESAN & RESERVASI (halaman Tentang) ---------------- */
export async function sendContactMessage(name, email, message) {
  const { error } = await db.from('contact_messages').insert({ name, email, message });
  if (error) throw error;
}

/*
   PIPETA (catatan implementasi):
   - Klien TIDAK mengirim harga final. server menghitung subtotal/ongkir/diskon.
   - Order dibuat dalam status 'awaiting_proof' / 'cash_on_site'. Dapur TIDAK
     membaca order 'Menunggu Pembayaran' sampai RPC approve_payment berjalan.
   - approve_payment menolak bila claimed_amount <> grand_total (nominal harus persis).
   - reject_payment mewajibkan alasan; pelanggan melihat alasan lalu submit_proof ulang.
   - Realtime: watchOrder() memperbarui halaman Pelanggan saat verifikasi terjadi.
*/
