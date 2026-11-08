/* ========= checkout, pembayaran (bukti transfer + verifikasi admin), pesanan, profil, tentang, admin ========= */

/* ---------------- cart & checkout ---------------- */
function chQty(ix, d) {
  S.cart[ix].q += d;
  if (S.cart[ix].q <= 0) S.cart.splice(ix, 1);
  SAVE(); badgeUp(); renderCheckout();
}
function chDel(ix) {
  var n = S.cart[ix].n;
  S.cart.splice(ix, 1); SAVE(); badgeUp(); renderCheckout();
  toast(n + ' dikeluarkan dari keranjang');
}
function cartRows() {
  if (!S.cart.length) {
    return '<div class="empty"><span class="em">🛍️</span><b>Keranjang masih kosong</b>' +
      'Yuk pilih menu sedep favoritmu dulu.<br>' +
      '<button class="btn btn-p btn-s" style="margin-top:14px" onclick="go(\'menu\')">Lihat menu →</button></div>';
  }
  return S.cart.map(function (i, ix) {
    var addTxt = i.addon !== 'Tanpa tambahan' ? ' · ' + i.addon.split(' +')[0] : '';
    var spiceTxt = i.spice ? '🌶 ' + i.spice : 'Tanpa level pedas';
    return '<div class="cr"><div class="crimg">' + i.em + '</div>' +
      '<div class="crinfo"><b>' + esc(i.n) + '</b>' +
      '<div class="v">' + spiceTxt + addTxt + '</div>' +
      '<div class="p">' + money(linePrice(i) * i.q) + '</div></div>' +
      '<div class="stepper sm"><button onclick="chQty(' + ix + ',-1)">−</button><span>' + i.q + '</span>' +
      '<button onclick="chQty(' + ix + ',1)">+</button></div>' +
      '<button class="crx" onclick="chDel(' + ix + ')">✕</button></div>';
  }).join('');
}
function pickServis(k) { S.servis = k; SAVE(); renderCheckout(); }

function renderCheckout() {
  if (!loggedIn()) return;
  var s = subTotal(), d = discAmt(s), sh = shipOf(s, S.servis), tot = s - d + sh;
  var antar = S.servis === 'Antar';
  var freeNote = (antar && s && s < FREELIM)
    ? '<div class="trust" style="margin:10px 0"><i>🛵</i>Tambah <b>' + money(FREELIM - s) + '</b> lagi biar ongkirnya gratis!</div>' : '';
  var discRow = d ? '<div class="paysum"><span>Diskon (' + S.voucher + ')</span><b class="disc">−' + money(d) + '</b></div>' : '';

  var servisCards = SERVIS.map(function (v) {
    var on = S.servis === v.k;
    return '<button class="sv ' + (on ? 'on' : '') + '" onclick="pickServis(\'' + v.k + '\')">' +
      '<span class="ic">' + v.ic + '</span><b>' + v.t + '</b><small>' + v.d + '</small></button>';
  }).join('');

  var detailTitle = antar ? 'Detail pengiriman'
    : S.servis === 'Makan di Tempat' ? 'Detail makan di tempat'
    : 'Detail pengambilan bungkus';
  var detailSub = antar ? 'Kami antar hangat sampai depan pintu.'
    : S.servis === 'Makan di Tempat' ? 'Tulis jumlah kursi yang kamu butuhkan.'
    : 'Pesanan dikemas kedap, siap diambil di kasir.';
  var addrBlock = antar
    ? '<div class="field"><label>Alamat pengiriman</label><textarea class="ta" id="cAddr">' + esc(S.session.addr) + '</textarea></div>' +
      '<div class="two"><div class="field"><label>Waktu terima</label><select class="sel" style="width:100%">' +
      '<option>Antar secepatnya (20–35 mnt)</option><option>Pilih waktu sendiri</option></select></div>' +
      '<div class="field"><label>Patokan / titik lokasi</label><input class="inp" id="cLand" placeholder="cth: depan warung, pagar hijau"></div></div>'
    : S.servis === 'Makan di Tempat'
      ? '<div class="two"><div class="field"><label>Jumlah orang</label><select class="sel" style="width:100%" id="cPax">' +
        [1,2,3,4,5,6,'7-10','>10'].map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Preferensi tempat</label><select class="sel" style="width:100%"><option>Area dalam (AC)</option><option>Area taman terbuka</option><option>Aula rombongan</option></select></div></div>'
      : '<div class="two"><div class="field"><label>Waktu ambil</label><select class="sel" style="width:100%">' +
        '<option>Secepatnya (±25 mnt)</option><option>Sesuai jadwal saya</option></select></div>' +
        '<div class="field"><label>Yang mengambil pesanan</label><input class="inp" id="cPick" value="' + esc(S.session.name) + '"></div></div>';

  $('#checkoutBody').innerHTML =
    '<div><div class="card pad" style="margin-bottom:16px">' +
      '<div class="step"><span class="stepno">1</span><div><h4>Daftar pesanan (' + cartCount() + ' item)</h4>' +
      '<p>Atur jumlah porsi sesuai selera kalian.</p></div></div>' + cartRows() + '</div>' +
      '<div class="card pad" style="margin-bottom:16px"><div class="step"><span class="stepno">2</span>' +
      '<div><h4>Mau dinikmati bagaimana?</h4><p>Ongkos kirim hanya dihitung bila kamu pilih layanan antar.</p></div></div>' +
      '<div class="svgrid">' + servisCards + '</div></div>' +
      '<div class="card pad"><div class="step"><span class="stepno">3</span>' +
      '<div><h4>' + detailTitle + '</h4><p>' + detailSub + '</p></div></div>' +
      '<div class="two"><div class="field"><label>Nama penerima</label><input class="inp" id="cName" value="' + esc(S.session.name) + '"></div>' +
      '<div class="field"><label>No. WhatsApp</label><input class="inp" id="cPhone" value="' + esc(S.session.phone) + '"></div></div>' +
      addrBlock +
      '<div class="field"><label>Pesan untuk dapur</label><input class="inp" id="cNote" value="' + esc(S.note) + '" placeholder="cth: sambal dipisah, jangan pakai kangkung"></div>' +
    '</div></div>' +
    '<div class="summarycol sticky"><div class="card pad">' +
      '<h3 class="jk" style="font-size:15px;margin-bottom:6px">Ringkasan belanja</h3>' +
      '<div class="voucher"><input id="vCode" placeholder="Kode voucher: SEDAP20" value="' + (S.voucher || '') + '">' +
      '<button class="btn btn-o btn-s" onclick="applyVoucher()">Pakai</button></div>' +
      '<div class="paysum"><span>Layanan</span><b>' + S.servis + '</b></div>' +
      '<div class="paysum"><span>Subtotal</span><b>' + money(s) + '</b></div>' + discRow +
      '<div class="paysum"><span>Ongkos kirim</span><b>' + (antar ? (sh ? money(sh) : '<span class="disc">Gratis</span>') : '<span class="disc">Tidak ada (bukan layanan antar)</span>') + '</b></div>' +
      freeNote +
      '<div class="paysum tot"><span>Total</span><span>' + money(tot) + '</span></div>' +
      '<button class="btn btn-p btn-f" style="margin-top:14px" ' + (S.cart.length ? '' : 'disabled ') + 'onclick="toPayment()">Lanjut ke pembayaran →</button>' +
      '<div class="trust"><i>🔒</i>Setelah membayar, kamu mengunggah bukti transfer. Admin dapur memeriksa nominalnya, baru pesanan masuk ke dapur.</div>' +
    '</div></div>';
}
function readForm() {
  var g = function (id) { var e = $('#' + id); return e ? e.value.trim() : ''; };
  S.note = g('cNote');
  S.recipient = g('cName');
  S.phone = g('cPhone');
  S.addr = g('cAddr') || (S.servis === 'Antar' ? S.session.addr : '-');
  S.land = g('cLand');
  var pax = g('cPax'); S.pax = pax;
  var sv = S.servis;
  S.detail = sv === 'Antar'
    ? 'Antar ke ' + S.addr + (S.land ? ' (patokan: ' + S.land + ')' : '')
    : sv === 'Makan di Tempat' ? 'Makan di tempat untuk ' + (S.pax || '1') + ' orang'
    : 'Bungkus / ambil sendiri oleh ' + (S.recipient || S.session.name);
}
function toPayment() {
  readForm();
  go('payment');
}
function applyVoucher() {
  var c = $('#vCode').value.trim().toUpperCase();
  if (!c) return toast('Ketik kode voucher dulu ya 🎟️');
  if (!VOUCH[c]) return toast('Kode voucher tidak ditemukan 😢');
  S.voucher = c; renderCheckout();
  toast('Voucher ' + c + ' terpakai! Diskon ' + VOUCH[c] + '% 🎉');
}

/* ---------------- payment + bukti transfer ---------------- */
var PAYS = [
  { k: 'Transfer Bank', ic: '🏦', n: 'Transfer bank', d: 'BCA · Mandiri · BNI · BRI', need: true },
  { k: 'QRIS', ic: '▦', n: 'QRIS', d: 'Scan dari GoPay, OVO, DANA, m-banking', need: true },
  { k: 'E-wallet', ic: '📱', n: 'E-wallet', d: 'GoPay · OVO · DANA · ShopeePay', need: true },
  { k: 'VA', ic: '🧾', n: 'Virtual account', d: 'Kode unik per transaksi', need: true },
  { k: 'Kartu', ic: '💳', n: 'Kartu debit/kredit', d: 'Visa & Mastercard tersimpan', need: true },
  { k: 'COD / Bayar di Kasir', ic: '💵', n: 'Bayar di tempat', d: 'Tunai saat tiba / di kasir', need: false }
];
var QR_SVG = '<svg viewBox="0 0 33 33" shape-rendering="crispEdges"><rect width="33" height="33" fill="#fff"/><path fill="#12241A" d="M1 1h7v7H1zm1 1h5v5H2zm2 1v3h1V3zM24 1h7v7h-7zm1 1h5v5h-5zm2 1v3h1V3zM1 24h7v7H1zm1 1h5v5H2zm2 1v3h1v-3zM10 1h1v1h-1zm2 0h1v2h-1zm2 1h2v1h-2zm3 0h1v2h-1zm-9 2h1v1H8zm11 0h1v2h-1zm2 1h2v1h-2zm-9 1h1v2h-1zm12 0h1v1h-1zm-5 2h1v2h-1zm3 0h2v1h-2zm-9 1h2v1h-2zm13 0h1v2h-1zM2 10h1v1H2zm2 0h1v2H4zm10 1h1v1h-1zm3 0h1v1h-1zm7 0h1v2h-1zm3 0h1v1h-1zm-23 2h1v2H4zm14 0h2v1h-2zm4 1h1v1h-1zm5 0h2v1h-2zm-18 1h1v2H9zm12 1h1v1h-1zm5 0h1v2h-1zm3 0h1v1h-1zM3 18h2v1H3zm5 0h1v1H8zm4 0h1v2h-1zm5 0h1v1h-1zm4 1h2v1h-2zm5 0h1v1h-1zm-19 2h1v1H7zm5 0h2v1h-2zm5 0h1v1h-1zm6 0h1v2h-1zm4 0h2v1h-2zm-16 2h1v1h-1zm4 0h1v2h-1zm6 0h2v1h-2zm5 0h1v1h-1zm4 0h1v2h-1zm-13 1h1v2h-1zm5 1h2v1h-2zm6 0h1v1h-1zm4 0h2v1h-2z"/></svg>';

var PROOF = { dataUrl: null, name: '', size: 0 };
function payPanel(tot) {
  if (S.pay === 'QRIS') {
    return '<div class="qr"><div class="qrbox">' + QR_SVG + '</div>' +
      '<b class="jk">Pindai untuk bayar ' + money(tot) + '</b>' +
      '<p class="small" style="color:#E3F1E7;margin-top:6px">BRI / GoPay / OVO / DANA · nominal harus persis ' + money(tot) + '</p></div>';
  }
  if (S.pay === 'Transfer Bank' || S.pay === 'VA') {
    var no = S.pay === 'VA' ? '9880 7712 3344 55' : 'BCA 8890-2163-77';
    return '<div class="qr" style="text-align:left"><small style="letter-spacing:1.4px;font-size:10px;color:#D9E8DE">NOMOR REKENING TUJUAN</small>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px">' +
      '<b class="jk" style="font-size:19px;letter-spacing:.5px">' + no + '</b>' +
      '<button class="btn btn-a btn-s" onclick="copyNo(\'' + no + '\')">Salin</button></div>' +
      '<p class="small" style="color:#D9E8DE;margin-top:10px">Atas nama <b style="color:#fff">PT Sedep Wetan Rasa</b> · transfer persis <b style="color:#fff">' + money(tot) + '</b> agar mudah diverifikasi admin.</p></div>';
  }
  if (S.pay === 'E-wallet') {
    return '<div class="qr" style="text-align:left"><small style="letter-spacing:1.4px;font-size:10px;color:#D9E8DE">NOMOR E-WALLET TUJUAN</small>' +
      '<div style="margin-top:8px"><b class="jk" style="font-size:19px">0812-3456-7890</b></div>' +
      '<p class="small" style="color:#D9E8DE;margin-top:10px">Transfer ke e-wallet kasir Sedep Wetan, lalu unggah bukti transfernya di bawah.</p></div>';
  }
  if (S.pay === 'COD / Bayar di Kasir') {
    return '<div class="trust" style="margin-top:14px"><i>💵</i>Siapkan uang pas sebesar <b>' + money(tot) + '</b>. Tidak perlu unggah bukti — pesanan langsung masuk antrean dapur dan kasir mencatat pembayaran saat lunas.</div>';
  }
  return '<div class="trust" style="margin-top:14px"><i>💳</i>Pembayaran kartu diproses lewat payment gateway pada tahap produksi (Midtrans/Xendit). Di prototype ini tetap gunakan bukti transfer.</div>';
}
function copyNo(no) {
  if (navigator.clipboard) navigator.clipboard.writeText(no).then(function () { toast('Nomor rekening disalin 📋'); });
  else toast('Nomor: ' + no);
}
function proofBlock(tot) {
  var need = payNeed();
  if (!need) return '';
  var inner = PROOF.dataUrl
    ? '<div class="prf"><img src="' + PROOF.dataUrl + '" alt="Pratinjau bukti pembayaran">' +
      '<div class="prfin"><b>' + esc(PROOF.name) + '</b><small>' + Math.round(PROOF.size / 1024) + ' KB · tersimpan pada pesanan</small>' +
      '<button class="btn btn-o btn-s" style="margin-top:8px" onclick="clearProof()">Ganti bukti</button></div></div>'
    : '<label class="upl"><span class="ic">📎</span><b>Unggah bukti pembayaran</b>' +
      '<small>JPG / PNG / PDF hasil screenshoot transfer, maksimal ±2 MB</small>' +
      '<input type="file" accept="image/*,.pdf" onchange="readProof(this)"></label>';
  return '<div class="paym" style="margin-top:18px"><div class="step"><span class="stepno">4</span>' +
    '<div><h4>Konfirmasi pembayaran</h4>' +
    '<p>Isi nominal yang kamu transfer, lalu unggah bukti. Nominal harus sama persis dengan total <b>' + money(tot) + '</b>.</p></div></div>' +
    '<div class="two"><div class="field"><label>Nominal yang dibayar (Rp)</label>' +
    '<input class="inp" id="pPaid" inputmode="numeric" value="' + tot + '" oninput="syncPaid(' + tot + ')"></div>' +
    '<div class="field"><label>Bank / e-wallet pengirim + no. ref</label>' +
    '<input class="inp" id="pRef" placeholder="cth: BCA a.n. Sekar · ref 8817263"></div></div>' +
    '<div class="amtmsg" id="amtMsg"></div>' + inner + '</div>';
}
function payNeed() {
  var p = PAYS.filter(function (x) { return x.k === S.pay; })[0];
  return !!(p && p.need);
}
function syncPaid(tot) {
  var v = parseRp($('#pPaid').value);
  var msg = $('#amtMsg');
  if (v !== tot) msg.innerHTML = '⚠ Nominal <b>' + money(v) + '</b> berbeda dari total <b>' + money(tot) + '</b>. Admin akan menolak pembayaran yang tidak sesuai.';
  else msg.innerHTML = '✓ Nominal sesuai total pesanan.';
  msg.className = 'amtmsg ' + (v === tot ? 'ok' : 'bad');
}
function parseRp(v) {
  var n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}
function clearProof() { PROOF = { dataUrl: null, name: '', size: 0 }; renderPayment(); }
function readProof(inp) {
  var f = inp.files && inp.files[0];
  if (!f) return;
  if (f.size > 3 * 1024 * 1024) { toast('Ukuran berkas melebihi 3 MB 😢'); inp.value = ''; return; }
  PROOF.name = f.name; PROOF.size = f.size;
  if (/^image\//.test(f.type)) {
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () {
      var max = 900, w = img.width, h = img.height;
      var k = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      PROOF.dataUrl = c.toDataURL('image/jpeg', 0.72);
      URL.revokeObjectURL(url); renderPayment();
      toast('Bukti pembayaran siap dikirim 📎');
    };
    img.onerror = function () { toast('Berkas gambar tidak bisa dibaca 😢'); };
    img.src = url;
  } else {
    var rd = new FileReader();
    rd.onload = function () { PROOF.dataUrl = rd.result; renderPayment(); toast('Bukti PDF tersimpan 📎'); };
    rd.readAsDataURL(f);
  }
}
function renderPayment() {
  if (!loggedIn()) return;
  if (!S.cart.length) { go('checkout'); return; }
  var s = subTotal(), d = discAmt(s), sh = shipOf(s, S.servis), tot = s - d + sh;
  var items = S.cart.map(function (i) {
    return '<div class="paysum"><span>' + i.em + ' ' + esc(i.n) + ' ×' + i.q + '</span><b>' + money(linePrice(i) * i.q) + '</b></div>';
  }).join('');
  var sv = SERVIS.filter(function (v) { return v.k === S.servis; })[0];
  $('#payBody').innerHTML = '<div class="checkout"><div class="card pad">' +
    '<div class="step"><span class="stepno">1</span><div><h4>Pilih metode pembayaran</h4>' +
    '<p>Total ' + money(tot) + ' · ' + cartCount() + ' item · layanan ' + sv.t.toLowerCase() + '</p></div></div>' +
    '<div class="paym">' + PAYS.map(function (p) {
      return '<button class="pm ' + (S.pay === p.k ? 'on' : '') + '" onclick="pickPay(\'' + p.k + '\')">' +
        '<span class="ic">' + p.ic + '</span><span><b>' + p.n + '</b><small>' + p.d + '</small></span></button>';
    }).join('') + '</div>' + payPanel(tot) + proofBlock(tot) +
    '</div><div class="summarycol sticky"><div class="card pad">' +
    '<h3 class="jk" style="font-size:15px">Konfirmasi pesanan</h3>' + items +
    '<div class="paysum"><span>Layanan</span><b>' + S.servis + '</b></div>' +
    '<div class="paysum" style="border-top:1px dashed var(--line-d);padding-top:10px"><span>Subtotal</span><b>' + money(s) + '</b></div>' +
    (d ? '<div class="paysum"><span>Diskon</span><b class="disc">−' + money(d) + '</b></div>' : '') +
    '<div class="paysum"><span>Ongkir</span><b>' + (sh ? money(sh) : 'Gratis') + '</b></div>' +
    '<div class="paysum tot"><span>Bayar</span><span>' + money(tot) + '</span></div>' +
    '<button class="btn btn-p btn-f" style="margin-top:14px" onclick="submitOrder()">' +
    (payNeed() ? 'Kirim pesanan + bukti pembayaran' : 'Kirim pesanan (bayar di tempat)') + ' ✓</button>' +
    '<button class="btn btn-o btn-f btn-s" style="margin-top:8px" onclick="go(\'checkout\')">← Ubah pesanan</button>' +
    '<div class="trust"><i>🕐</i>Bukti pembayaran masuk ke panel admin. Setelah disetujui, pesanan otomatis diarahkan ke dapur.</div>' +
    '</div></div></div>';
}
function pickPay(k) { S.pay = k; renderPayment(); }
function submitOrder() {
  var s = subTotal(), tot = s - discAmt(s) + shipOf(s, S.servis);
  var now = new Date();
  var need = payNeed();
  var paid = need ? parseRp($('#pPaid').value) : 0;
  var ref = need ? ($('#pRef').value.trim() || '-') : '-';
  if (need && !PROOF.dataUrl) { toast('Unggah bukti pembayaran dulu ya 📎'); return; }
  var o = {
    code: 'SW' + now.getTime().toString().slice(-6),
    date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    customer: S.session.email, customerName: S.session.name,
    items: S.cart.map(function (i) { return { em: i.em, n: i.n, q: i.q, price: linePrice(i), spice: i.spice }; }),
    pay: S.pay, total: tot, servis: S.servis, detail: S.detail || '', note: S.note || '',
    payStatus: need ? 'Menunggu Verifikasi' : 'COD / Bayar di Tempat',
    proof: need ? { name: PROOF.name, size: PROOF.size, dataUrl: PROOF.dataUrl, paid: paid, ref: ref, uploaded: nowStamp() } : null,
    verifyNote: '', verifiedBy: '', verifiedAt: '',
    status: need ? 'Menunggu Pembayaran' : 'Dimasak',
    step: need ? 0 : 1, rated: false, eta: '25–35 menit'
  };
  S.orders.unshift(o);
  S.cart = []; S.voucher = null; S.note = '';
  PROOF = { dataUrl: null, name: '', size: 0 };
  SAVE(); badgeUp();
  toast(need
    ? 'Bukti pembayaran terkirim! Admin akan memeriksa nominal ' + money(o.proof.paid) + ' 🧾'
    : 'Pesanan terkirim, bayar di tempat ya 🙏');
  go('orders');
}

/* ---------------- order status & history ---------------- */
var STEPS = [
  ['🧾', 'Menunggu pembayaran', 'Menunggu bukti transfer diverifikasi admin.'],
  ['📥', 'Pesanan diterima', 'Pembayaran disetujui, pesanan masuk antrean dapur.'],
  ['🔥', 'Sedang dimasak', 'Chef meracik bumbu dan membakar di atas arang.'],
  ['🎁', 'Dikemas hangat', 'Dikemas kedap agar rasa dan suhu terjaga.'],
  ['🛵', 'Diantar kurir', 'Kurir kami meluncur ke alamatmu.'],
  ['✅', 'Pesanan tiba', 'Silakan nikmati selagi hangat!']
];
function payPill(o) {
  var p = o.payStatus || 'COD / Bayar di Tempat';
  var cls = p === 'Disetujui' ? 'done' : p === 'Ditolak' ? 'rej' : p === 'Menunggu Verifikasi' ? 'proc' : 'unpaid';
  return '<span class="pill ' + cls + '">' + p + '</span>';
}
function statusPill(o) {
  var cls = o.status === 'Selesai' ? 'done' : o.status === 'Menunggu Pembayaran' || o.status === 'Ditolak' ? 'proc' : 'cook';
  return '<span class="pill ' + cls + '">' + o.status + '</span>';
}
function isOwner(o) { return isAdmin() || o.customer === S.session.email; }
function renderOrders() {
  if (!loggedIn()) return;
  var mine = S.orders.filter(isOwner);
  var act = mine.filter(function (o) { return o.status !== 'Selesai'; });
  var done = mine.filter(function (o) { return o.status === 'Selesai'; });
  var html = '';
  if (!mine.length) {
    html += '<div class="card pad"><div class="empty"><span class="em">◷</span><b>Belum ada pesanan</b>' +
      'Pesanan pertamamu akan muncul di sini.<br>' +
      '<button class="btn btn-p btn-s" style="margin-top:14px" onclick="go(\'menu\')">Mulai pesan →</button></div></div>';
  }
  if (isAdmin() && mine.length) {
    html += '<div class="trust" style="margin-bottom:16px"><i>🛡️</i>Kamu melihat pesanan di perangkat ini sebagai admin. Verifikasi pembayaran hanya bisa dilakukan di <button style="color:var(--brick);font-weight:800;text-decoration:underline" onclick="go(\'admin\')">dashboard admin →</button></div>';
  }
  html += act.map(trackCard).join('');
  if (done.length) {
    html += '<div class="sec-h"><div><span class="eyebrow">🧾 Riwayat</span><h2>Pembelian sebelumnya</h2>' +
      '<p>Lengkap dengan metode pembayaran, layanan, dan status verifikasi.</p></div>' +
      '<span class="count">' + done.length + ' transaksi</span></div>' + done.map(histRow).join('');
  }
  $('#ordersBody').innerHTML = html;
}
function trackCard(o) {
  var track = STEPS.map(function (st, i) {
    var c = i < o.step ? 'done' : i === o.step ? 'now' : '';
    var dot = i < o.step ? '✓' : i === o.step ? '●' : '';
    return '<div class="tstep ' + c + '"><span class="tdot">' + dot + '</span><b>' + st[1] + '</b><p>' + st[0] + ' ' + st[2] + '</p></div>';
  }).join('');
  var cells = '<div class="ordgrid">' +
    '<div class="ocell"><small>Layanan</small><b>' + o.servis + '</b></div>' +
    '<div class="ocell"><small>Status bayar</small><b>' + (o.payStatus || 'COD / Bayar di Tempat') + '</b></div>' +
    '<div class="ocell"><small>Total</small><b style="color:var(--brick)">' + money(o.total) + '</b></div></div>';
  var items = o.items.map(function (i) {
    return '<div class="hr" style="border:1px solid var(--line);margin-bottom:8px;padding:11px">' +
      '<div class="hrimg">' + i.em + '</div><div class="hrinfo"><b>' + esc(i.n) + '</b><p>' +
      money(i.price) + ' × ' + i.q + (i.spice ? ' · 🌶 ' + i.spice : '') + '</p></div>' +
      '<b style="color:var(--brick);font-size:12.5px">' + money(i.price * i.q) + '</b></div>';
  }).join('');
  var proof = '';
  if (o.proof) {
    proof = '<div class="paym" style="border:0;background:var(--cream);margin:0 0 16px"><div>' +
      '<b class="jk" style="font-size:13.5px">Bukti pembayaran</b>' +
      '<p class="small muted">' + esc(o.proof.name) + ' · ' + money(o.proof.paid) + ' · dikirim ' + o.proof.uploaded + '</p>' +
      (o.verifyNote ? '<p class="small" style="margin-top:6px"><b>Catatan admin:</b> ' + esc(o.verifyNote) + '</p>' : '') +
      (o.verifiedAt ? '<p class="small muted" style="margin-top:4px">Diverifikasi oleh ' + esc(o.verifiedBy) + ' · ' + o.verifiedAt + '</p>' : '') +
      '</div><button class="btn btn-o btn-s" onclick="openProof(\'' + o.code + '\')">Lihat bukti</button></div>';
  }
  var banner = o.payStatus === 'Menunggu Verifikasi'
    ? '<div class="trust" style="margin:0 0 14px;background:#FFF6E6;border-style:solid;border-color:#F0DCB0"><i>🧾</i>Dapur belum mengolah pesananmu sampai bukti transfer disetujui admin. Nominal yang kamu kirim: <b>' + money(o.proof.paid) + '</b> dari tagihan <b>' + money(o.total) + '</b>.</div>'
    : o.payStatus === 'Ditolak'
      ? '<div class="trust" style="margin:0 0 14px;background:#FDECEA;border-style:solid;border-color:#F2C4BE"><i>⚠</i>Pembayaran ditolak admin: ' + esc(o.verifyNote || 'nominal tidak sesuai') + '. Silakan kirim bukti yang benar lewat tombol di bawah.</div>'
      : '';
  var resend = (o.payStatus === 'Ditolak' || o.payStatus === 'Menunggu Bukti')
    ? '<button class="btn btn-p btn-f btn-s" style="margin-top:8px" onclick="resendProof(\'' + o.code + '\')">Kirim ulang bukti pembayaran</button>' : '';
  return '<div class="card pad" style="margin-bottom:16px"><div class="ordhead"><div>' +
    '<span class="eyebrow">' + (o.status === 'Selesai' ? '✅ Siap dinikmati' : '🕐 ' + o.status) + '</span>' +
    '<h3>' + o.code + '</h3><p class="muted small" style="margin-top:4px">' + o.date + ' · ' + o.time +
    ' WIB · ' + esc(o.detail || o.servis) + '</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + statusPill(o) + payPill(o) + '</div></div>' +
    banner + cells + (o.note ? '<div class="trust" style="margin:0 0 16px"><i>📝</i>Catatan untuk dapur: <b>' + esc(o.note) + '</b></div>' : '') +
    proof + '<div class="two"><div><div class="opttl" style="margin-top:0">Lacak pesanan</div>' +
    '<div class="track">' + track + '</div></div><div><div class="opttl" style="margin-top:0">Item pesanan</div>' +
    items + '<p class="small muted">Status diperbarui oleh admin dapur dari dashboard.</p>' + resend +
    '</div></div></div>';
}
function openProof(code) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  if (!o || !o.proof) return toast('Belum ada bukti pembayaran 📎');
  $('#modalBox').innerHTML = '<button class="mclose" onclick="closeModal()">✕</button>' +
    '<div class="pfp"><span class="eyebrow">🧾 Bukti pembayaran · ' + o.code + '</span>' +
    '<h2 class="jk">Nominal diklaim ' + money(o.proof.paid) + ' · tagihan ' + money(o.total) + '</h2>' +
    '<p class="small muted">Berkas: ' + esc(o.proof.name) + ' · dikirim ' + o.proof.uploaded + ' · ref ' + esc(o.proof.ref || '-') + '</p>' +
    (/^data:image/.test(o.proof.dataUrl)
      ? '<img src="' + o.proof.dataUrl + '" alt="Bukti pembayaran">'
      : '<div class="empty"><span class="em">📄</span><b>Berkas ' + esc(o.proof.name) + '</b>Tautan berkas akan dilayani Supabase Storage pada tahap produksi.</div>') +
    '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
    (isAdmin()
      ? '<button class="btn btn-p" onclick="verifyPay(\'' + o.code + '\',\'ok\')">Setujui pembayaran</button>' +
        '<button class="btn btn-o" onclick="verifyPay(\'' + o.code + '\',\'no\')">Tolak</button>'
      : '') +
    '<button class="btn btn-o" onclick="closeModal()">Tutup</button></div></div>';
  $('#modal').classList.add('on'); document.body.style.overflow = 'hidden';
}
function resendProof(code) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  S.resend = code;
  S.cart = o.items.map(function (i) {
    var f = S.menu.filter(function (m) { return m.n === i.n; })[0];
    return { id: f ? f.id : 0, n: i.n, em: i.em, price: i.price, q: i.q, spice: i.spice || null, addon: 'Tanpa tambahan' };
  });
  S.servis = o.servis; S.pay = o.pay;
  PROOF = { dataUrl: o.proof ? o.proof.dataUrl : null, name: o.proof ? o.proof.name : '', size: o.proof ? o.proof.size : 0 };
  toast('Unggah bukti yang benar lalu kirim lagi 📎');
  go('payment');
}
function histRow(o) {
  var list = o.items.map(function (i) { return i.em + ' ' + i.n + ' ×' + i.q; }).join(' · ');
  var rate = o.rated ? '<span class="pill done" style="margin-top:7px;display:inline-flex">⭐ 5,0</span>'
    : '<button class="btn btn-a btn-s" style="margin-top:7px" onclick="rateOrder(\'' + o.code + '\')">Beri rating</button>';
  return '<div class="hr"><div class="hrimg">🧾</div><div class="hrinfo"><b>' + o.code + ' · ' + o.pay + ' · ' + o.servis + '</b>' +
    '<p>' + esc(list) + '</p><small>' + o.date + ' ' + o.time + ' WIB · bayar ' + (o.payStatus || 'COD') + '</small></div>' +
    statusPill(o) +
    '<div class="hrright"><b>' + money(o.total) + '</b><br>' + rate +
    '<br><button class="btn btn-o btn-s" style="margin-top:6px" onclick="reorder(\'' + o.code + '\')">Pesan lagi</button></div></div>';
}
function reorder(code) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  o.items.forEach(function (it) {
    var f = S.menu.filter(function (m) { return m.n === it.n; })[0];
    if (f) S.cart.push({ id: f.id, n: f.n, em: f.em, price: f.price, q: it.q, spice: f.spicyOpt ? (it.spice || 'Sedang') : null, addon: 'Tanpa tambahan' });
  });
  S.servis = o.servis || 'Antar';
  SAVE(); badgeUp(); toast('Item disalin ulang ke keranjang 🔁'); go('checkout');
}
function rateOrder(code) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  o.rated = true; SAVE(); renderOrders();
  toast('Makasih ulasannya! ⭐⭐⭐⭐⭐');
}

/* ---------------- profile ---------------- */
function renderProfile() {
  if (!loggedIn()) return;
  var u = S.session;
  var spent = S.orders.filter(isOwner).reduce(function (a, o) { return a + o.total; }, 0);
  var favs = S.menu.filter(function (f) { return f.fav; }).slice(0, 4).map(function (f) {
    return '<div class="pi" onclick="detail(' + f.id + ')"><span class="ic">' + f.em + '</span>' +
      '<div><b>' + esc(f.n) + '</b><p>' + money(f.price) + ' · ★ ' + f.rate.toFixed(1) + '</p></div><span class="arw">›</span></div>';
  }).join('');
  $('#profileBody').innerHTML =
    '<div class="ph"><span class="eyebrow">☺ Akun saya</span><h1>Profil ' + (isAdmin() ? 'pengelola' : 'pelanggan') + '</h1>' +
    '<p>Kelola data, alamat, dan preferensi memesanmu.</p></div>' +
    '<div class="pfhero"><div class="pfavatar">' + initials(u.name) + '</div>' +
    '<div><h2>' + esc(u.name) + '</h2><p>' + esc(u.email) + ' · Bergabung ' + esc(u.joined) + ' · peran: <b>' + esc(u.role || 'customer') + '</b></p>' +
    '<span class="pftier">⭐ ' + u.tier + '</span></div>' +
    '<button class="btn btn-g btn-s" style="margin-left:auto;position:relative;z-index:2" onclick="logout()">Keluar</button></div>' +
    (isAdmin() ? '<div class="trust" style="margin:0 0 18px;background:#E7F5EC;border-style:solid;border-color:#BFE3CC"><i>🛡️</i>Kamu login sebagai <b>pengelola</b>. ' +
      '<button style="color:var(--brick);font-weight:800;text-decoration:underline" onclick="go(\'admin\')">Buka dashboard admin →</button></div>' : '') +
    '<div class="stats"><div class="stat"><b>' + S.orders.filter(isOwner).length + '</b><small>Total pesanan</small></div>' +
    '<div class="stat"><b>' + money(spent) + '</b><small>Total belanja</small></div>' +
    '<div class="stat"><b>' + S.orders.filter(function (o) { return isOwner(o) && o.payStatus === 'Menunggu Verifikasi'; }).length + '</b><small>Menunggu verifikasi</small></div>' +
    '<div class="stat"><b>' + (isAdmin() ? S.menu.length : 120) + '</b><small>' + (isAdmin() ? 'Menu terdata' : 'Poin Sedep') + '</small></div></div>' +
    '<div class="two"><div class="card pad"><div class="step"><span class="stepno">✎</span>' +
    '<div><h4>Data pribadi</h4><p>Perbarui info pengiriman kamu.</p></div></div>' +
    '<div class="field"><label>Nama</label><input class="inp" id="pName" value="' + esc(u.name) + '"></div>' +
    '<div class="two"><div class="field"><label>Email</label><input class="inp" id="pEmail" value="' + esc(u.email) + '"></div>' +
    '<div class="field"><label>WhatsApp</label><input class="inp" id="pPhone" value="' + esc(u.phone) + '"></div></div>' +
    '<div class="field"><label>Alamat utama</label><textarea class="ta" id="pAddr">' + esc(u.addr) + '</textarea></div>' +
    '<button class="btn btn-p" onclick="saveProfile()">Simpan perubahan</button></div>' +
    '<div><div class="card pad" style="margin-bottom:16px"><h4 class="jk" style="font-size:14px;margin-bottom:6px">Preferensi</h4>' +
    '<div class="switch"><span>Notifikasi status pesanan</span><span class="tg on" onclick="this.classList.toggle(\'on\')"></span></div>' +
    '<div class="switch"><span>Email promo mingguan</span><span class="tg" onclick="this.classList.toggle(\'on\')"></span></div>' +
    '<div class="switch"><span>Notifikasi hasil verifikasi pembayaran</span><span class="tg on" onclick="this.classList.toggle(\'on\')"></span></div></div>' +
    '<div class="card pad"><h4 class="jk" style="font-size:14px;margin-bottom:4px">Menu favoritmu</h4>' +
    '<div class="plist">' + favs + '</div></div></div></div>';
}
function saveProfile() {
  var old = S.session.email;
  S.session.name = $('#pName').value.trim() || S.session.name;
  S.session.email = $('#pEmail').value.trim() || S.session.email;
  S.session.phone = $('#pPhone').value.trim();
  S.session.addr = $('#pAddr').value.trim();
  var u = S.users.filter(function (x) { return x.email === old; })[0];
  if (u) { u.name = S.session.name; u.email = S.session.email; u.phone = S.session.phone; u.addr = S.session.addr; }
  SAVE(); renderAuthZone(); renderProfile();
  toast('Profil tersimpan ✔');
}

/* ---------------- about & contact ---------------- */
function renderAbout() {
  var tl = [['1998', 'Bu Nahdiyah membuka warung lima meja di gang timur Pasar Sidoarjo.'],
    ['2007', 'Rawon dan rujak cingur jadi primadona, antrean mulai mengular.'],
    ['2016', 'Pindah ke ruko dua lantai dengan dapur terbuka untuk pelanggan.'],
    ['2025', 'Layanan makan di tempat, bungkus, dan pesan-antar digital dari satu web app.']]
    .map(function (t) { return '<div class="tl"><b>' + t[0] + '</b><p>' + t[1] + '</p></div>'; }).join('');
  var contacts = [['📍', 'Alamat dapur pusat', 'Jl. Raya Sidoarjo No. 45, Jawa Timur'],
    ['📞', 'Telepon / WhatsApp', '0812-3456-7890 (07.00–21.00 WIB)'],
    ['✉️', 'Email', 'halo@sedepwetan.id'],
    ['🕘', 'Jam buka', 'Setiap hari, 09.00 – 22.00 WIB (dapur tutup 21.30)']]
    .map(function (c) { return '<div class="cinfo"><span class="ic">' + c[0] + '</span><div><b>' + c[1] + '</b><p>' + c[2] + '</p></div></div>'; }).join('');
  $('#aboutBody').innerHTML =
    '<div class="about-hero"><div><span class="eyebrow" style="color:var(--amber-l)">🌿 Tentang kami</span>' +
    '<h1>Dari warung kecil di sisi timur kota, untuk kamu yang rindu rumah.</h1>' +
    '<p>Sedep Wetan lahir tahun 1998 dari dapur Bu Nahdiyah. Resepnya tidak berubah: kluwek segar, gula aren sejati, petis Sidoarjo, dan kesabaran memasak perlahan. Kini kami melayani ribuan pelanggan, tapi rasanya tetap rasa dapur rumah.</p>' +
    '<div class="heroact"><button class="btn btn-a" onclick="go(\'menu\')">Pesan sekarang</button>' +
    '<button class="btn btn-g" onclick="document.getElementById(\'kontak\').scrollIntoView({behavior:\'smooth\'})">Hubungi kami</button></div></div>' +
    '<div class="splate" style="margin:0 auto">🍲</div></div>' +
    '<div class="vals" style="margin-top:18px">' +
    '<div class="val"><i>📜</i><b>Resep warisan</b><p>Bumbu yang sama sejak 1998, diwariskan langsung dari generasi pertama.</p></div>' +
    '<div class="val"><i>🌾</i><b>Bahan lokal</b><p>Kupang, siwalan, bandeng, dan rempah dipasok tiap pagi dari pesisir Jawa Timur.</p></div>' +
    '<div class="val"><i>🔥</i><b>Masak segar</b><p>Tidak ada makanan beku. Semua diracik setelah pembayaran dinyatakan lunas.</p></div></div>' +
    '<div class="two" style="margin-top:28px"><div class="card pad">' +
    '<span class="eyebrow">🕰️ Perjalanan</span><h2 class="jk" style="font-size:20px;margin:10px 0 18px">Sedikit sejarah kami</h2>' +
    '<div class="timeline">' + tl + '</div></div>' +
    '<div class="card pad" id="kontak"><span class="eyebrow">📮 Kontak</span>' +
    '<h2 class="jk" style="font-size:20px;margin:10px 0 6px">Mampir, telepon, atau kirim pesan</h2>' + contacts +
    '<div class="map" style="margin-top:14px"><div class="mapin"><div class="pin"><span>🌿</span></div>' +
    '<b class="jk">Sedep Wetan — Dapur Pusat</b><p class="small muted" style="margin-top:4px">Tiga pilihan layanan: makan di tempat, bungkus, atau diantar</p></div></div></div></div>' +
    '<div class="card pad" style="margin-top:18px"><span class="eyebrow">📋 Cara pesan &amp; bayar</span>' +
    '<h2 class="jk" style="font-size:20px;margin:10px 0 14px">Alur pembayaran yang dipakai di web app ini</h2>' +
    '<div class="flow"><div class="fs"><b>1 · Pesan</b>Pilih menu, tentukan level pedas (khusus menu pedas), lalu pilih layanan: makan di tempat, bungkus, atau antar.</div>' +
    '<div class="fs"><b>2 · Bayar</b>Transfer / QRIS sesuai nominal persis, lalu unggah bukti pembayaran (JPG/PNG/PDF).</div>' +
    '<div class="fs"><b>3 · Verifikasi admin</b>Admin memeriksa nominal dan bukti. Jika sesuai, pembayaran disetujui; jika tidak, ditolak dengan catatan.</div>' +
    '<div class="fs"><b>4 · Dapur</b>Baru setelah disetujui, pesanan masuk antrean masak dan status dapat dilacak.</div></div></div>' +
    '<div class="card pad" style="margin-top:18px"><span class="eyebrow">💬 Kirim pesan</span>' +
    '<h2 class="jk" style="font-size:20px;margin:10px 0 14px">Ada saran, kritik, atau mau reservasi rombongan?</h2>' +
    '<div class="two"><div class="field"><label>Nama</label><input class="inp" id="tName" placeholder="Nama kamu"></div>' +
    '<div class="field"><label>Email</label><input class="inp" id="tEmail" placeholder="nama@email.com"></div></div>' +
    '<div class="field"><label>Pesan</label><textarea class="ta" id="tMsg" placeholder="Tulis pesanmu di sini..." style="min-height:110px"></textarea></div>' +
    '<button class="btn btn-p" onclick="sendPesan()">Kirim pesan →</button>' +
    '<div class="trust"><i>ℹ️</i>Pada tahap produksi, pesan ini tersimpan di tabel <code>contact_messages</code> Supabase dan dikirim ke email pengelola.</div></div>';
}
function sendPesan() {
  var n = $('#tName').value.trim(), e = $('#tEmail').value.trim(), m = $('#tMsg').value.trim();
  if (n.length < 2 || !/^\S+@\S+\.\S+$/.test(e) || m.length < 10) return toast('Lengkapi nama, email valid, dan pesan min. 10 karakter ✍️');
  var box = LS('sw-messages', []);
  box.unshift({ name: n, email: e, msg: m, at: nowStamp() });
  localStorage.setItem('sw-messages', JSON.stringify(box));
  $('#tName').value = ''; $('#tEmail').value = ''; $('#tMsg').value = '';
  toast('Pesan tersimpan & terkirim ke kelolaan admin ✉️');
}

/* ---------------- admin ---------------- */
var ADMTABS = [
  ['dash', '📊', 'Ringkasan', null],
  ['pay', '💳', 'Verifikasi Bayar', function () { return S.orders.filter(function (o) { return o.payStatus === 'Menunggu Verifikasi'; }).length; }],
  ['orders', '📦', 'Pesanan', function () { return S.orders.length; }],
  ['menu', '🍽', 'Menu', function () { return S.menu.length; }],
  ['msg', '💬', 'Pesan', function () { return LS('sw-messages', []).length; }],
  ['rep', '📈', 'Laporan', null]
];
function renderAdmin() {
  if (!isAdmin()) {
    $('#adminBody').innerHTML = '<div class="card pad gate"><div class="lock">🔐</div>' +
      '<h2>Area terbatas</h2><p>Dashboard admin hanya untuk akun pengelola. Silakan login dengan akun admin, atau kembali ke toko.</p>' +
      '<button class="btn btn-p" onclick="S.pendingAction=\'admin\';go(\'auth\',true)">Login sebagai admin</button> ' +
      '<button class="btn btn-o" onclick="go(\'home\',true)">Kembali</button></div>';
    return;
  }
  var rev = S.orders.filter(function (o) { return o.payStatus === 'Disetujui' || o.payStatus === 'COD / Bayar di Tempat'; })
    .reduce(function (a, o) { return a + o.total; }, 0);
  var pend = S.orders.filter(function (o) { return o.payStatus === 'Menunggu Verifikasi'; }).length;
  var links = ADMTABS.map(function (t) {
    var n = typeof t[3] === 'function' ? t[3]() : null;
    var badge = n != null ? '<span class="abadge">' + n + '</span>' : '';
    return '<button class="alink ' + (S.tab === t[0] ? 'on' : '') + '" onclick="S.tab=\'' + t[0] + '\';renderAdmin()">' +
      '<i>' + t[1] + '</i>' + t[2] + badge + '</button>';
  }).join('');
  var panels = { dash: admDash(rev), pay: admPay(), orders: admOrders(), menu: admMenu(), msg: admMsg(), rep: admReport() };
  var body = Object.keys(panels).map(function (k) {
    return '<div class="apanel ' + (S.tab === k ? 'on' : '') + '">' + panels[k] + '</div>';
  }).join('');
  $('#adminBody').innerHTML =
    '<div class="ph"><span class="eyebrow">🛠 Panel pengelola</span><h1>Dashboard admin</h1>' +
    '<p>Kelola menu, status dapur, dan <b>verifikasi pembayaran</b>. ' + (pend ? '<b style="color:var(--amber)">' + pend + ' bukti bayar menunggu diperiksa.</b>' : 'Semua pembayaran sudah selesai diperiksa.') + '</p></div>' +
    '<div class="adm"><aside class="aside"><div class="who"><span class="avatar">AD</span>' +
    '<div><b>' + esc(S.session.name) + '</b><small>' + esc(S.session.email) + '</small></div></div>' + links +
    '<button class="alink" onclick="go(\'home\',true)" style="margin-top:12px;color:var(--brick)"><i>↩</i>Kembali ke toko</button></aside>' +
    '<div>' + body + '</div></div>';
}
var DAYS = [['Sen', 420], ['Sel', 510], ['Rab', 468], ['Kam', 610], ['Jum', 845], ['Sab', 980], ['Min', 760]];
function chart() {
  return '<div class="chart">' + DAYS.map(function (d) {
    return '<div class="cbar" title="Rp' + d[1] + '.000"><em>' + d[1] + '</em>' +
      '<div style="height:' + (d[1] / 10) + '%"></div><small>' + d[0] + '</small></div>';
  }).join('') + '</div>';
}
function topSellers() {
  var top = S.menu.slice().sort(function (a, b) { return b.sold - a.sold; }).slice(0, 6);
  var mx = top[0].sold || 1;
  return top.map(function (t) { t.pct = Math.round(t.sold / mx * 100); return t; });
}
function bars() {
  return topSellers().map(function (t) {
    return '<div class="lbar"><span class="nm">' + t.em + ' ' + esc(t.n) + '</span>' +
      '<span class="tr"><i style="width:' + t.pct + '%"></i></span><span class="vl">' + t.sold.toLocaleString('id-ID') + '</span></div>';
  }).join('');
}
function admDash(rev) {
  var pending = S.orders.filter(function (o) { return o.status === 'Menunggu Pembayaran'; }).length;
  var kpis = [['💰', money(rev), 'Dana tervalidasi', 'hanya yang disetujui', 'up'],
    ['🧾', pending, 'Menunggu verifikasi bayar', 'perlu tindakan', 'dn'],
    ['📦', S.orders.length, 'Total pesanan tercatat', 'di perangkat ini', 'up'],
    ['🍽', S.menu.filter(function (m) { return m.on; }).length + '/' + S.menu.length, 'Menu aktif', 'tersedia/habis', 'up']]
    .map(function (k) {
      return '<div class="kpi"><i>' + k[0] + '</i><b>' + k[1] + '</b><small>' + k[2] + '</small>' +
        '<span class="trend ' + k[4] + '">' + k[3] + '</span></div>';
    }).join('');
  var waiting = S.orders.filter(function (o) { return o.payStatus === 'Menunggu Verifikasi'; }).slice(0, 3);
  return '<div class="kpis">' + kpis + '</div><div class="two">' +
    '<div class="card pad"><span class="eyebrow">📈 Penjualan 7 hari</span>' + chart() + '</div>' +
    '<div class="card pad"><span class="eyebrow">🏆 Menu terlaris</span><div style="margin-top:14px">' + bars() + '</div>' +
    '<button class="btn btn-o btn-f btn-s" style="margin-top:14px" onclick="S.tab=\'rep\';renderAdmin()">Lihat laporan lengkap →</button></div></div>' +
    '<div class="card pad" style="margin-top:16px"><span class="eyebrow">🕐 Perlu tindakan</span>' +
    '<h4 class="jk" style="font-size:16px;margin:8px 0 12px">Antrean bukti pembayaran yang belum diperiksa</h4>' +
    (waiting.length ? admPayCards(waiting, true) : '<div class="empty"><span class="em">✅</span><b>Tidak ada bukti bayar menunggu</b>Semua transaksi sudah diverifikasi.</div>') +
    '</div>';
}

/* --- verifikasi pembayaran oleh admin --- */
function admPay() {
  var pend = S.orders.filter(function (o) { return o.payStatus === 'Menunggu Verifikasi'; });
  var other = S.orders.filter(function (o) { return o.payStatus !== 'Menunggu Verifikasi'; });
  return '<div class="filt"><span class="eyebrow">💳 Verifikasi pembayaran</span>' +
    '<span class="count">' + pend.length + ' perlu diperiksa</span></div>' +
    (pend.length ? admPayCards(pend) : '<div class="card pad"><div class="empty"><span class="em">✅</span><b>Antrean verifikasi kosong</b>Belum ada bukti pembayaran yang masuk.</div></div>') +
    '<div class="card pad" style="margin-top:16px"><span class="eyebrow">🧾 Riwayat verifikasi</span>' +
    '<h4 class="jk" style="font-size:16px;margin:8px 0 12px">Semua transaksi (di luar antrean)</h4>' + admOrderRows(other) + '</div>';
}
function admPayCards(list, compact) {
  return list.map(function (o) {
    var p = o.proof || {};
    var match = p.paid === o.total;
    var preview = p.dataUrl
      ? (/^data:image/.test(p.dataUrl)
        ? '<img class="prfimg" src="' + p.dataUrl + '" alt="Bukti ' + o.code + '" onclick="openProof(\'' + o.code + '\')">'
        : '<button class="btn btn-o btn-s" onclick="openProof(\'' + o.code + '\')">📄 Buka PDF bukti</button>')
      : '<div class="small muted">Berkas akan dilayani Supabase Storage pada tahap produksi.</div>';
    return '<div class="card pad vcard" style="margin-bottom:14px"><div class="ordhead"><div>' +
      '<span class="eyebrow">' + o.code + ' · ' + esc(o.customerName || '-') + '</span>' +
      '<h3>' + esc(o.detail || o.servis) + '</h3>' +
      '<p class="small muted" style="margin-top:4px">' + o.date + ' ' + o.time + ' WIB · metode <b>' + esc(o.pay) + '</b> · ref ' + esc(p.ref || '-') + '</p></div>' +
      '<span class="pill proc">Menunggu Verifikasi</span></div>' +
      '<div class="ordgrid"><div class="ocell"><small>Tagihan sistem</small><b style="color:var(--brick)">' + money(o.total) + '</b></div>' +
      '<div class="ocell"><small>Nominal diklaim</small><b>' + money(p.paid || 0) + '</b></div>' +
      '<div class="ocell"><small>Cek cocok</small><b style="color:' + (match ? 'var(--green)' : 'var(--red)') + '">' + (match ? '✓ Sesuai' : '✗ Beda ' + money(Math.abs((p.paid || 0) - o.total))) + '</b></div></div>' +
      '<div class="two" style="align-items:flex-start"><div>' + preview +
      '<div class="act" style="margin-top:12px"><button class="btn btn-o btn-s" onclick="openProof(\'' + o.code + '\')">🔍 Lihat besar</button></div></div>' +
      '<div><div class="opttl" style="margin-top:0">Item pesanan</div>' +
      '<p class="small">' + o.items.map(function (i) { return i.em + ' ' + esc(i.n) + ' ×' + i.q; }).join('<br>') + '</p>' +
      (o.note ? '<p class="small muted" style="margin-top:6px">📝 ' + esc(o.note) + '</p>' : '') +
      '<div class="field" style="margin-top:10px"><label>Catatan untuk pelanggan</label>' +
      '<input class="inp" id="vn-' + o.code + '" placeholder="cth: nominal kurang / berkas tidak terbaca"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn btn-p ' + (match ? '' : 'dis') + '" ' + (match ? '' : 'onclick="return warnMismatch(\'' + o.code + '\')"') +
      (match ? ' onclick="verifyPay(\'' + o.code + '\',\'ok\')"' : '') + '>✓ Setujui pembayaran</button>' +
      '<button class="btn btn-o" onclick="verifyPay(\'' + o.code + '\',\'no\')">✗ Tolak</button></div>' +
      (match ? '' : '<p class="small" style="color:var(--red);margin-top:8px">Setujui dinonaktifkan karena nominal tidak sama persis dengan tagihan.</p>') +
      '</div></div></div>';
  }).join('');
}
function warnMismatch(code) {
  toast('Nominal tidak sesuai — tolak dan minta pelanggan kirim ulang 🚫');
  return false;
}
function verifyPay(code, dec) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  if (!o) return;
  var noteEl = $('#vn-' + code);
  var note = noteEl ? noteEl.value.trim() : '';
  if (dec === 'ok') {
    if (o.proof && o.proof.paid !== o.total) return toast('Tidak bisa disetujui: nominal ' + money(o.proof.paid) + ' ≠ tagihan ' + money(o.total));
    o.payStatus = 'Disetujui';
    o.status = 'Dimasak'; o.step = 2;
    o.verifyNote = note || 'Pembayaran sesuai, pesanan diteruskan ke dapur.';
    toast(code + ' disetujui → masuk antrean dapur 🔥');
  } else {
    if (!note) return toast('Tulis dulu alasan penolakan agar pelanggan paham ✍️');
    o.payStatus = 'Ditolak';
    o.status = 'Menunggu Pembayaran'; o.step = 0;
    o.verifyNote = note;
    toast(code + ' ditolak, pelanggan diminta kirim bukti yang benar');
  }
  o.verifiedBy = S.session.name; o.verifiedAt = nowStamp();
  SAVE(); closeModal(); renderAdmin();
}
/* --- kelola pesanan (status dapur, hanya admin) --- */
function admOrderRows(list) {
  if (!list.length) return '<div class="empty"><span class="em">📦</span><b>Belum ada pesanan</b></div>';
  var rows = list.map(function (o) {
    var items = o.items.map(function (i) { return i.em + '×' + i.q; }).join(' ');
    var next = NEXT[o.status];
    var canNext = o.payStatus === 'Disetujui' || o.payStatus === 'COD / Bayar di Tempat';
    var btn = next ? '<button title="Majukan ke ' + next + '" ' + (canNext ? '' : 'disabled ') + 'onclick="advStatus(\'' + o.code + '\')">▶</button>' : '';
    return '<tr><td><b>' + o.code + '</b><br><small class="muted">' + o.date + ' ' + o.time + '<br>' + esc(o.servis) + '</small></td>' +
      '<td>' + items + '<br><small class="muted">' + esc(o.customerName || '-') + '</small></td>' +
      '<td><b style="color:var(--brick)">' + money(o.total) + '</b></td>' +
      '<td>' + payPill(o) + '</td><td>' + statusPill(o) + '</td>' +
      '<td><div class="act">' + btn +
      '<button title="Lihat bukti / detail" onclick="openProof(\'' + o.code + '\')">👁</button></div></td></tr>';
  }).join('');
  return '<div class="tw"><table class="tbl"><thead><tr><th>Kode</th><th>Item &amp; pelanggan</th><th>Total</th><th>Bayar</th><th>Status dapur</th><th>Aksi</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}
var NEXT = { 'Menunggu Pembayaran': 'Pesanan Diterima', 'Pesanan Diterima': 'Dimasak', 'Dimasak': 'Dikemas', 'Dikemas': 'Diantar', 'Diantar': 'Selesai' };
var STEPNO = { 'Pesanan Diterima': 1, 'Dimasak': 2, 'Dikemas': 3, 'Diantar': 4, 'Selesai': 5 };
function advStatus(code) {
  var o = S.orders.filter(function (x) { return x.code === code; })[0];
  if (!o) return;
  if (o.payStatus !== 'Disetujui' && o.payStatus !== 'COD / Bayar di Tempat') return toast('Belum boleh dimasak: pembayaran belum disetujui 🧾');
  o.status = NEXT[o.status];
  o.step = STEPNO[o.status] || o.step;
  SAVE(); renderAdmin();
  toast(code + ' → ' + o.status);
}
function admOrders() {
  var tabs = ['Semua', 'Menunggu Pembayaran', 'Dimasak', 'Dikemas', 'Diantar', 'Selesai'].map(function (t) {
    return '<button class="tab ' + (S.amsg === t ? 'on' : '') + '" onclick="S.amsg=\'' + t + '\';renderAdmin()">' + t + '</button>';
  }).join('');
  var list = S.orders.filter(function (o) { return S.amsg === 'Semua' || o.status === S.amsg; });
  return '<div class="tabs">' + tabs + '</div><div class="card pad">' + admOrderRows(list) + '</div>';
}
/* --- kelola menu (form nyata) --- */
function admMenu() {
  var rows = S.menu.map(function (f) {
    var stock = f.on ? '<span class="pill done">Tersedia</span>' : '<span class="pill unpaid">Habis</span>';
    return '<tr><td><div class="tfood"><span class="em">' + f.em + '</span><div><b>' + esc(f.n) + '</b>' +
      '<small>' + f.cat + ' · ' + (f.spicyOpt ? '🌶 ada level pedas' : 'tanpa level pedas') + '</small></div></div></td>' +
      '<td><b style="color:var(--brick)">' + money(f.price) + '</b></td><td>' + stock + '</td>' +
      '<td>' + f.sold.toLocaleString('id-ID') + '</td><td><div class="act">' +
      '<button title="Ubah" onclick="menuForm(' + f.id + ')">✎</button>' +
      '<button title="Aktif/nonaktif" onclick="toggleStock(' + f.id + ')">' + (f.on ? '⏸' : '▶') + '</button>' +
      '<button class="del" title="Hapus" onclick="delMenu(' + f.id + ')">🗑</button></div></td></tr>';
  }).join('');
  return '<div class="filt"><span class="eyebrow">🍽 Kelola menu</span>' +
    '<span class="count">' + S.menu.length + ' menu · harga &amp; ketersediaan diubah admin</span>' +
    '<button class="btn btn-p btn-s" style="margin-left:auto" onclick="menuForm(0)">➕ Tambah menu</button></div>' +
    '<div class="card pad tw"><table class="tbl"><thead><tr><th>Menu</th><th>Harga</th><th>Stok</th><th>Terjual</th><th>Aksi</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}
function menuForm(id) {
  var f = id ? food(id) : null;
  var catOpts = CATS.slice(1).map(function (c) {
    return '<option ' + (f && f.cat === c ? 'selected' : '') + '>' + c + '</option>';
  }).join('');
  $('#modalBox').innerHTML = '<button class="mclose" onclick="closeModal()">✕</button>' +
    '<div class="mform"><span class="eyebrow">' + (f ? 'Ubah menu' : 'Menu baru') + '</span>' +
    '<h2 class="jk">' + (f ? esc(f.n) : 'Tambah menu ke katalog') + '</h2>' +
    '<div class="two"><div class="field"><label>Nama menu</label><input class="inp" id="mN" value="' + esc(f ? f.n : '') + '"></div>' +
    '<div class="field"><label>Harga (Rp)</label><input class="inp" id="mP" inputmode="numeric" value="' + (f ? f.price : '') + '"></div></div>' +
    '<div class="two"><div class="field"><label>Kategori</label><select class="sel" style="width:100%" id="mC">' + catOpts + '</select></div>' +
    '<div class="field"><label>Ikon / emoji</label><input class="inp" id="mE" maxlength="4" value="' + esc(f ? f.em : '🍲') + '"></div></div>' +
    '<div class="field"><label>Deskripsi singkat</label><input class="inp" id="mD" value="' + esc(f ? f.desc : '') + '"></div>' +
    '<div class="field"><label>Deskripsi lengkap</label><textarea class="ta" id="mL">' + esc(f ? f.long : '') + '</textarea></div>' +
    '<div class="switch"><span>Menu ini punya pilihan level pedas?</span>' +
    '<span class="tg ' + (!f || f.spicyOpt ? 'on' : '') + '" id="mS" onclick="this.classList.toggle(\'on\')"></span></div>' +
    '<div class="two"><div class="field"><label>Badge (opsional)</label><input class="inp" id="mB" value="' + esc(f ? f.badge : '') + '" placeholder="Favorit / Khas / Baru"></div>' +
    '<div class="field"><label>Status</label><select class="sel" style="width:100%" id="mO"><option ' + (!f || f.on ? 'selected' : '') + '>Tersedia</option><option ' + (f && !f.on ? 'selected' : '') + '>Habis</option></select></div></div>' +
    '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
    '<button class="btn btn-p" onclick="saveMenu(' + (id || 0) + ')">Simpan menu</button>' +
    '<button class="btn btn-o" onclick="closeModal()">Batal</button></div>' +
    '<p class="small muted" style="margin-top:12px">Perubahan tersimpan di katalog perangkat ini; di produksi disimpan ke tabel <code>menu_items</code> Supabase sehingga otomatis tampil di semua pengguna.</p></div>';
  $('#modal').classList.add('on'); document.body.style.overflow = 'hidden';
}
function saveMenu(id) {
  var n = $('#mN').value.trim(), p = parseRp($('#mP').value);
  if (n.length < 3) return toast('Nama menu minimal 3 karakter ✍️');
  if (p < 1000) return toast('Harga belum benar (min. Rp1.000) 💸');
  var data = {
    n: n, price: p, cat: $('#mC').value, em: $('#mE').value.trim() || '🍽',
    desc: $('#mD').value.trim() || 'Menu khas Sedep Wetan.', long: $('#mL').value.trim() || $('#mD').value.trim(),
    spicyOpt: $('#mS').classList.contains('on'), badge: $('#mB').value.trim(),
    on: $('#mO').value === 'Tersedia'
  };
  if (id) {
    var f = food(id); Object.keys(data).forEach(function (k) { f[k] = data[k]; });
  } else {
    var nid = S.menu.reduce(function (a, m) { return Math.max(a, m.id); }, 0) + 1;
    data.id = nid; data.rate = 5; data.sold = 0; data.fav = 0; data.tags = ['Baru'];
    data.old = 0;
    S.menu.push(data);
  }
  SAVE(); closeModal(); renderAdmin(); toast(n + (id ? ' diubah' : ' ditambahkan') + ' ✔');
}
function toggleStock(id) {
  var f = food(id); f.on = !f.on; SAVE(); renderAdmin();
  toast(esc(f.n) + (f.on ? ' diaktifkan lagi' : ' ditandai habis'));
}
function delMenu(id) {
  var f = food(id);
  S.menu = S.menu.filter(function (m) { return m.id !== id; });
  SAVE(); renderAdmin();
  toast(esc(f.n) + ' dihapus dari katalog');
}
function admMsg() {
  var box = LS('sw-messages', []);
  if (!box.length) return '<div class="card pad"><div class="empty"><span class="em">💬</span><b>Belum ada pesan</b>Pesan dari halaman Tentang akan muncul di sini.</div></div>';
  var rows = box.map(function (m) {
    return '<div class="hr" style="padding:12px"><div class="hrimg">💬</div><div class="hrinfo"><b>' + esc(m.name) + ' · ' + esc(m.email) + '</b>' +
      '<p>' + esc(m.msg) + '</p><small>' + m.at + '</small></div>' +
      '<button class="btn btn-o btn-s" onclick="delMsg(' + box.indexOf(m) + ')">✗</button></div>';
  }).join('');
  return '<div class="filt"><span class="eyebrow">💬 Pesan &amp; reservasi</span><span class="count">' + box.length + ' pesan</span></div>' +
    '<div class="card pad">' + rows + '</div>';
}
function delMsg(i) {
  var box = LS('sw-messages', []);
  box.splice(i, 1);
  localStorage.setItem('sw-messages', JSON.stringify(box));
  renderAdmin(); toast('Pesan ditandai selesai');
}
function admPaySum() {
  var by = {}, tot = 0;
  S.orders.forEach(function (o) {
    if (o.payStatus === 'Ditolak') return;
    by[o.pay] = (by[o.pay] || 0) + o.total; tot += o.total;
  });
  var t = tot || 1;
  return Object.keys(by).map(function (k) {
    return '<div class="lbar"><span class="nm">' + k + '</span><span class="tr"><i style="width:' +
      Math.round(by[k] / t * 100) + '%"></i></span><span class="vl">' + money(by[k]) + '</span></div>';
  }).join('') + '<div class="lbar"><span class="nm" style="color:var(--brick)"><b>Total tervalidasi</b></span>' +
    '<span class="tr"><i style="width:100%"></i></span><span class="vl">' + money(tot) + '</span></div>';
}
function admReport() {
  var sums = S.orders.reduce(function (a, o) {
    if (o.payStatus === 'Disetujui' || o.payStatus === 'COD / Bayar di Tempat') {
      a.ok += o.total; a.n++;
      a.ship += (o.servis === 'Antar' ? SHIP : 0);
    }
    if (o.payStatus === 'Ditolak') a.rej++;
    return a;
  }, { ok: 0, n: 0, ship: 0, rej: 0 });
  var rows = [['Pesanan tervalidasi', sums.n + ' transaksi'], ['Dana sah masuk', money(sums.ok)],
    ['Ditolak / ditunda', sums.rej + ' transaksi'], ['Estimasi ongkir', money(sums.ship)]]
    .map(function (s) { return '<div class="paysum"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>'; }).join('');
  return '<div class="card pad" style="margin-bottom:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
    '<span class="eyebrow">📈 Laporan penjualan</span><div class="filt" style="margin:0">' +
    '<select class="sel"><option>7 hari terakhir</option><option>Bulan ini</option><option>Custom range</option></select>' +
    '<button class="btn btn-o btn-s" onclick="dlCSV()">⬇ Unduh CSV</button></div></div>' + chart() + '</div>' +
    '<div class="two"><div class="card pad"><span class="eyebrow">🏆 Produk terlaris</span><div style="margin-top:12px">' + bars() + '</div></div>' +
    '<div class="card pad"><span class="eyebrow">🧮 Ringkasan berbasis data nyata</span><div style="margin-top:12px">' + rows +
    '<div class="paysum tot"><span>Rata-rata transaksi</span><span>' + money(sums.n ? sums.ok / sums.n : 0) + '</span></div></div>' +
    '<div class="card pad" style="margin-top:16px"><span class="eyebrow">💳 Masuk per metode (sudah tervalidasi)</span>' +
    '<div style="margin-top:12px">' + admPaySum() + '</div></div></div></div>';
}
function dlCSV() {
  var head = 'kode,tanggal,pelanggan,layanan,metode,total,status_bayar,status_dapur\n';
  var body = S.orders.map(function (o) {
    return [o.code, o.date + ' ' + o.time, o.customerName || '-', o.servis, o.pay, o.total, o.payStatus || '-', o.status].join(',');
  }).join('\n');
  var blob = new Blob([head + body], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'sedep-wetan-transaksi.csv'; a.click();
  toast('Laporan transaksi diunduh ⬇');
}

/* ---------------- footer ---------------- */
function renderFoot() {
  function col(title, items) {
    return '<div><h5>' + title + '</h5><div class="fl">' + items.map(function (i) {
      return '<button onclick="' + i[1] + '">' + i[0] + '</button>';
    }).join('') + '</div></div>';
  }
  $('#foot').innerHTML = '<div class="wrap"><div class="footgrid">' +
    '<div><div class="brand"><span class="logo" data-logo></span><span class="brandtxt"><b>sedep wetan</b>' +
    '<small style="color:#7FA18B">Rasa rumahan, bikin kangen</small></span></div>' +
    '<p>Rawon, rujak cingur, sego tempong, sate kerang, sampai wedang angsle. Makan di tempat, bungkus, atau diantar hangat dari dapur kami.</p>' +
    '<div class="soc"><button onclick="toast(\'Instagram @sedepwetan 📸\')">◎</button>' +
    '<button onclick="toast(\'WhatsApp 0812-3456-7890 💬\')">💬</button>' +
    '<button onclick="toast(\'TikTok @sedepwetan 🎵\')">♪</button></div></div>' +
    col('Jelajahi', [['Semua menu', 'go(\'menu\')'], ['Hidangan utama', 'pickCat(\'Hidangan Utama\')'],
      ['Paket hemat', 'pickCat(\'Paket Hemat Sedep\')'], ['Minuman segar', 'pickCat(\'Minuman Segar\')']]) +
    col('Layanan', [['Makan di tempat', 'toast(\'Pilih layanan ini saat checkout 🍽️\')'],
      ['Bungkus / ambil sendiri', 'toast(\'Ongkir tidak dihitung saat checkout 🥡\')'],
      ['Pesan-antar', 'toast(\'Ongkir Rp8.000, gratis di atas Rp75.000 🛵\')'],
      ['Cara verifikasi pembayaran', 'go(\'about\')']]) +
    col('Akun', [['Keranjang', 'openCart()'], ['Pesanan saya', 'loggedIn()?go(\'orders\'):requireLogin(\'orders\')'],
      ['Profil', 'loggedIn()?go(\'profile\'):requireLogin(\'profile\')'],
      ['Dashboard admin (khusus pengelola)', 'go(\'admin\')']]) +
    col('Kontak & jam buka', [['Jl. Raya Sidoarjo No. 45', 'go(\'about\')'],
      ['0812-3456-7890', 'toast(\'Telepon 0812-3456-7890 📞\')'],
      ['halo@sedepwetan.id', 'toast(\'Email halo@sedepwetan.id ✉️\')'],
      ['Setiap hari · 09.00–22.00 WIB', 'go(\'about\')']]) +
    '</div><div class="fbot"><span>© 2025 Sedep Wetan — prototype berfungsi; data tersimpan di browser, siap disambungkan ke Supabase.</span>' +
    '<span>Dibuat dengan 🌿 &amp; gula aren sejati.</span></div></div>';
  $$('#foot [data-logo]').forEach(function (e) { e.innerHTML = LEAF; });
}

/* ---------------- boot ---------------- */
function boot() {
  $$('[data-logo]').forEach(function (e) { e.innerHTML = LEAF; });
  var msgs = ['Menyiapkan dapur...', 'Merebus kaldu rawon...', 'Mengulek bumbu petis...', 'Menyusun lalapan segar...', 'Hampir siap, santai dulu ☕'];
  var mi = 0;
  var iv = setInterval(function () { $('#ldmsg').textContent = msgs[mi++ % msgs.length]; }, 520);
  renderAuthZone(); renderFoot(); renderHome(); renderCats(); renderMenu(); badgeUp();
  $('#q').addEventListener('input', function (e) { S.q = e.target.value; renderMenu(); });
  $('#sortSel').addEventListener('change', function (e) { S.sort = e.target.value; renderMenu(); });
  $$('#nav button, #mobnav button').forEach(function (b) {
    b.addEventListener('click', function () { go(b.getAttribute('data-v')); });
  });
  setTimeout(function () { clearInterval(iv); $('#loading').classList.add('hide'); }, 2300);
}
boot();
