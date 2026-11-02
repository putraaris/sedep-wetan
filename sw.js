/* ============ SEDEP WETAN — data & core ============ */
var LEAF = '<img src="logo.jpg" alt="Logo Sedep Wetan">';

/* --- raw menu: id, nama, kategori, emoji, harga, coret, rating, terjual, badge, favorit, tag, levelPedas, desk, long --- */
const RAW = [
  [1, 'Rawon Daging Sapi', 'Hidangan Utama', '🍲', 28000, 0, 4.9, 1120, 'Favorit', 1, 'Kuah|Jawa Timur', false,
   'Kuah kluwek pekat, daging sandung lamur, tauge & telur asin.',
   'Kaldu daging sapi dimasak lama bersama kluwek, kencur, dan kunyit hingga hitam pekat, disajikan dengan tauge pendek, sambal terasi, dan telur asin asli Sidoarjo.'],
  [2, 'Rujak Cingur Surobooyo', 'Hidangan Utama', '🥗', 26000, 0, 4.8, 980, 'Khas', 1, 'Pedas|Jawa Timur', true,
   'Cingur sapi, bumbu petis, lontong, sayur & buah segar.',
   'Seperti di warung legendaris Surabaya: irisan cingur sapi rebus, tempe, tahu, kangkung, sayur, lontong, disiram bumbu petis Madura yang diulek dadakan.'],
  [3, 'Sego Tempong Banyuwangi', 'Hidangan Utama', '🍛', 25000, 30000, 4.9, 1310, 'Favorit', 1, 'Pedas|Jawa Timur', true,
   'Nasi, pecel ringan, ikan asin, sambal ijo tempong.',
   'Nasi hangat dengan sayuran rebus, tahu-tempe goreng, ikan asin, telur, dan sambal tempong hijau khas Osing yang terkenal “nampel” lidah.'],
  [4, 'Soto Ayam Lamongan', 'Hidangan Utama', '🍜', 22000, 0, 4.8, 1560, 'Best seller', 1, 'Kuah', false,
   'Kuah kunyit gurih, koya, ayam suwir, perkedel.',
   'Kuahnya bening kekuningan dari kunyit dan rempah utuh, ayam kampung suwir, taburan koya gurih, bihun, telur rebus, plus kerupuk pangsit.'],
  [5, 'Nasi Pecel Madioen', 'Hidangan Utama', '🥬', 18000, 0, 4.7, 870, '', 0, 'Pedas|Sayur', true,
   'Sayur rebus, bumbu pecel kacang, rempeyek, telur.',
   'Sayuran rebus (bayam, kecipir, kacang panjang, tauge) disiram sambal kacang asli Madiun, ditemani rempeyek kacang, tempe mendoan, dan telur pindang.'],
  [6, 'Tahoe Teh Surabaya', 'Hidangan Utama', '🧆', 18000, 0, 4.7, 760, '', 0, 'Jawa Timur', false,
   'Tahu goreng + lontong, saus kacang petis, telur.',
   'Tahu dan kentang digoreng setengah matang bersama lontong, lalu disiram saus kacang petis khas Surabaya, ditaburi bawang goreng.'],
  [7, 'Paket Bromo', 'Paket Hemat Sedep', '🌋', 33000, 45000, 4.9, 980, 'Hemat', 1, 'Paket|Pedas', true,
   'Rawon, nasi, tempe menjes, es sinom.',
   'Paket hemat untuk sarapan pagi di kaki Bromo: semangkuk rawon, nasi merah, tempe menjes goreng, sambal terasi, satu es sinom segar.'],
  [8, 'Paket Semeru', 'Paket Hemat Sedep', '🌄', 24000, 32000, 4.8, 1180, 'Hemat', 1, 'Paket|Pedas', true,
   'Sego tempong + es teh jumbo.',
   'Paket tempong ekonomis: sego tempong komplit dengan sambal ijo sedang, lauk tahu-tempe, ikan asin, dan satu es teh melati jumbo.'],
  [9, 'Ote-Ote Porong (2 pcs)', 'Camilan & Side', '🥟', 12000, 0, 4.7, 640, '', 0, 'Gorengan|Jawa Timur', false,
   'Bakwan sayur udang khas Porong.',
   'Bakwan sayur bercampur udang rebus khas Porong, digoreng garing keemasan, dicocol sambal rawit hijau.'],
  [10, 'Sate Kerang Sidoardjo (3 tusuk)', 'Camilan & Side', '🦪', 12000, 0, 4.8, 720, 'Khas', 1, 'Jawa Timur', false,
   'Sate kerang bumbu kecap manis gurih.',
   'Kerang segar dari pesisir Sidoarjo, ditusuk daun lontar, dibakar dengan bumbu kecap gula merah dan bawang putih hingga karamel.'],
  [11, 'Tempoe Menjes Goreng', 'Camilan & Side', '🫓', 8000, 0, 4.6, 810, '', 0, 'Gorengan', false,
   'Tempe menjes (bumbu warna oranye) digoreng.',
   'Tempe halus berbumbu menjes (warisan Arek Suroboyo) digoreng dadakan, bagian luar kriuk, bagian dalam lembut.'],
  [12, 'Es Dawet Siwalan', 'Minuman Segar', '🥥', 12000, 0, 4.8, 1240, 'Favorit', 1, 'Segar', false,
   'Cendol, siwalan, santan, gula aren.',
   'Cendol beras, buah siwalan muda, santan kental, dan gula aren cair — disajikan dengan es serut di gelas besar.'],
  [13, 'Wedang Angsle Hangat', 'Minuman Segar', '🫖', 12000, 0, 4.7, 540, 'Hangat', 1, 'Hangat', false,
   'Kuah jahe, roti, mutiara, kacang sangrai.',
   'Wedang khas Arema: kuah jahe kayu manis dengan bulatan mutiara, roti tawar, kacang tanah sangrai, dan ketan. Hangat sampai ke tulang.'],
  [14, 'Es Sinom Asli', 'Minuman Segar', '🌿', 8000, 0, 4.6, 890, '', 0, 'Segar', false,
   'Kunyit asam jawa, dingin, segar.',
   'Campuran kunyit segar dan asam jawa, disaring halus, diberi gula batu dan es. Biasa jadi teman rujak dan pecel di warung Jawa.'],
  [15, 'Kopi Toebroek Cangkir', 'Minuman Segar', '☕', 6000, 0, 4.7, 1450, 'Murah meriah', 1, 'Kafein', false,
   'Kopi tubruk robusta, gula batu, cangkir belerang.',
   'Serbuk kopi robusta Temanggung diseduh langsung dalam cangkir belerang dengan gula batu, diaduk, ampas mengendap. Ritual sederhana orang Jawa.'],
  [16, 'Es Teh Melati Jumbo', 'Minuman Segar', '🧋', 5000, 0, 4.9, 2680, 'Terlaris', 1, 'Segar', false,
   'Teh melati gula batu, gelas 1 liter.',
   'Teh melati diseduh, diberi gula batu alami agar tetap wangi, disajikan dalam gelas jumbo dengan es batu.'],

  /* Tambahan khas Jawa Timur / Jawa */
  [17, 'Nasi Bebek Madu', 'Hidangan Utama', '🦆', 32000, 0, 4.8, 640, 'Baru', 1, 'Pedas', true,
   'Bebek goreng madu, sambal dabu-dabu, nasi hangat.',
   'Bebek muda ungkep rempah, digoreng lalu disiram madu asli, disajikan dengan sambal korek dan lalapan.'],
  [18, 'Sate Ayam Madura', 'Hidangan Utama', '🍢', 25000, 0, 4.8, 1420, 'Favorit', 1, 'Jawa Timur', false,
   '10 tusuk bumbu kacang, lontong, bawang goreng.',
   'Daging ayam pilihan ditusuk, dibakar arang, disiram bumbu kacang asli Pamekasan, ditemani lontong dan sate jeroan.'],
  [19, 'Nasi Krawoen Gresik', 'Hidangan Utama', '🍚', 24000, 28000, 4.7, 560, 'Khas', 0, 'Jawa Timur', false,
   'Nasi, daging sapi serundeng, telur pindang.',
   'Kuliner legendaris Gresik: nasi putih, daging sapi yang dibumbui serundeng manis, disiram kuah kari kental dan telur pindang.'],
  [20, 'Sego Sambel Cak Har', 'Hidangan Utama', '🌶', 24000, 0, 4.9, 1180, 'Pedas', 0, 'Pedas|Jawa Timur', true,
   'Nasi, ayam kampung, telur, sambel bawang legendaris.',
   'Sego sambel viral Surabaya: nasi panas, lauk ayam kampung / Ikan teri / cumi, disiram sambal bawang mentah yang diguyur minyak panas.'],
  [21, 'Lontong Kupang Sidoardjo', 'Hidangan Utama', '🐚', 20000, 0, 4.7, 720, 'Khas', 1, 'Jawa Timur', false,
   'Lontong kupang, sate kerang, taoge.',
   'Kuliner khas pesisir Sidoarjo: kupang (kerang kecil) kuah petis, lontong, taoge, dan sate kerang di tusuk daun.'],
  [22, 'Bandeng Presto Sismin', 'Hidangan Utama', '🐟', 28000, 32000, 4.8, 940, 'Khas', 1, 'Jawa Timur', false,
   'Bandeng presto, sambal pencit, nasi hangat.',
   'Bandeng Sidoarjo presto tulang empuk, digoreng atau dibakar, disajikan dengan sambal pencit (mangga muda) khas pesisir.'],
  [23, 'Rujak Soto Banyuwangi', 'Hidangan Utama', '🥬', 22000, 0, 4.7, 460, 'Baru', 0, 'Pedas', true,
   'Kacang, lontong, sayur, kuah soto & bumbu petis.',
   'Perpaduan unik rujak sayur dan soto daging: bumbu petis gula merah, kuah soto gurih, irisan lontong dan sayur rebus.'],
  [24, 'Ayam Lodho Tulungagung', 'Hidangan Utama', '🍗', 26000, 0, 4.8, 610, 'Pedas', 0, 'Pedas', true,
   'Ayam kampung kuah santan pedas hitam.',
   'Ayam kampung muda dimasak dengan kuah santan hitam khas Lodho, rasa pedas dari cabai rawit utuh, beraroma kencur.'],
  [25, 'Nasi Campur Bali Wetan', 'Hidangan Utama', '🍛', 26000, 0, 4.6, 480, '', 0, 'Campur', true,
   'Nasi, ayam, sate lilit, sayur, sambal embe.',
   'Nasi campur kreasi dapur Wetan: ayam suwir bumbu genep, sate lilit, kacang sayur, sambal embe, dan lawar manis.'],
  [26, 'Tongseng Kambing Solo', 'Hidangan Utama', '🍲', 24000, 0, 4.7, 520, '', 0, 'Kuah', true,
   'Kambing muda, kuah santan, kol, tomat.',
   'Potongan kambing muda tanpa prengus, dimasak dengan kuah santan kecokelatan, taburan bawang goreng, dan sambal kecap cabai rawit.'],
  [27, 'Paket Ijo', 'Paket Hemat Sedep', '🌿', 28000, 35000, 4.8, 740, 'Hemat', 1, 'Paket|Pedas', true,
   'Sego tempong + es sinom.',
   'Paket hemat: sego tempong dengan lauk tahu-tempe-ikan asin, sambal ijo sedang, ditambah satu es sinom segar.'],
  [28, 'Paket Sate Kerang', 'Paket Hemat Sedep', '🦪', 30000, 36000, 4.8, 520, 'Hemat', 0, 'Paket', false,
   'Lontong kupang + sate kerang 3 tusuk.',
   'Paket pesisir: lontong kupang Sidoarjo hangat, sate kerang daun lontar 3 tusuk, dan es teh melati.'],
  [29, 'Kerupuk Udang Sidoardjo', 'Camilan & Side', '🍤', 6000, 0, 4.5, 1320, '', 0, 'Gorengan', false,
   'Kerupuk udang gurih, 1 bungkus.',
   'Kerupuk udang asli Sidoarjo, digoreng tanpa minyak berlebih, renyah gurih untuk teman makan apa pun.'],
  [30, 'Rempeyek Kacang', 'Camilan & Side', '🥜', 8000, 0, 4.6, 860, '', 0, 'Gorengan', false,
   'Rempeyek tepung beras + kacang tanah.',
   'Rempeyek buatan ibu-ibu: tepung beras, santan, daun jeruk, kacang tanah utuh. Renyah berbulan-bulan di toples kedap.'],
  [31, 'Bakwan Jagung Manis', 'Camilan & Side', '🌽', 10000, 0, 4.5, 720, '', 0, 'Gorengan', false,
   'Bakwan jagung manis, bumbu ketumbar.',
   'Jagung manis pipil dicampur tepung bumbu dan daun bawang, digoreng per scoop hingga cokelat keemasan.'],
  [32, 'Geti Singkong Madu', 'Camilan & Side', '🍠', 9000, 0, 4.6, 410, 'Baru', 0, 'Manis', false,
   'Geti singkong tabur kelapa parut + madu.',
   'Singkong putih parut, dikukus bersama gula aren dan daun pandan, dipotong dadu, ditaburi kelapa parut dan madu.'],
  [33, 'Tahu Petis Sidoardjo', 'Camilan & Side', '🧆', 10000, 0, 4.6, 620, '', 0, 'Jawa Timur', false,
   'Tahu goreng + bumbu petis kacang.',
   'Tahu goreng ringan dicelup bumbu petis Sidoarjo kental yang diulek bersama cabai, kacang tanah, dan gula merah.'],
  [34, 'Es Gempol Aven Asem', 'Minuman Segar', '🌾', 10000, 0, 4.6, 540, 'Baru', 0, 'Segar', false,
   'Biji selasih, gula aren, santan, es serut.',
   'Minuman khas pesisir Jawa Timur: biji selasih yang mekar seperti bunga gempol, santan encer, gula aren cair, dan es serut.'],
  [35, 'Es Cendol Siwalan Muda', 'Minuman Segar', '🥤', 10000, 0, 4.7, 820, '', 0, 'Segar', false,
   'Cendol, siwalan muda, gula aren, santan.',
   'Siwalan muda dari pesisir Tuban, disajikan bersama cendol pandan dan kuah gula aren asli, segar tanpa pemanis buatan.'],
  [36, 'Jamu Kunyit Asam', 'Minuman Segar', '🫚', 10000, 0, 4.5, 320, '', 0, 'Sehat', false,
   'Kunyit asam jawa gula aren, segar.',
   'Kunyit dan asam jawa segar diparut, disaring, diberi gula aren dan sedikit garam. Racikan sehat khas ibu-ibu Jawa.']
];
const FOODS = RAW.map(function (r) {
  return { id: r[0], n: r[1], cat: r[2], em: r[3], price: r[4], old: r[5], rate: r[6],
           sold: r[7], badge: r[8], fav: r[9], tags: r[10].split('|'), spicyOpt: r[11], desc: r[12], long: r[13] };
});

const CATS = ['Semua', 'Hidangan Utama', 'Paket Hemat Sedep', 'Camilan & Side', 'Minuman Segar'];
const CAT_IC = {
  'Semua': '🍽️',
  'Hidangan Utama': '🍲',
  'Paket Hemat Sedep': '💰',
  'Camilan & Side': '🥟',
  'Minuman Segar': '🥤'
};
const SPICE = ['Tidak pedas', 'Sedang', 'Pedas', 'Nyoss!'];
const ADDONS = ['Tanpa tambahan', 'Nasi merah +Rp5.000', 'Lauk extra +Rp10.000', 'Sambal extra +Rp3.000'];
const SHIP = 8000, FREELIM = 75000;
const VOUCH = { 'SEDAP20': 20, 'NGEMIL10': 10 };

/* Jenis layanan checkout: makan di tempat / bungkus (takeaway) / antar */
const SERVIS = [
  { k: 'Antar', ic: '🛵', t: 'Diantar kurir', d: 'Ongkir Rp8.000, gratis di atas Rp75.000' },
  { k: 'Makan di Tempat', ic: '🍽️', t: 'Makan di tempat', d: 'Makan langsung di dapur Wetan (gratis)' },
  { k: 'Bungkus', ic: '🥡', t: 'Bungkus / ambil sendiri', d: 'Dikemas kedap, diambil di kasir (gratis)' }
];

const PROMOS = [
  { cls: 'brick', ic: '🌶', t: 'Diskon 20% Rawon', s: 'Berlaku Senin–Rabu, selama stok ada.', code: 'SEDAP20' },
  { cls: 'amber', ic: '🛵', t: 'Gratis Ongkir', s: 'Min. belanja Rp75.000, khusus layanan antar.', code: 'ONGKIRGRATIS' },
  { cls: 'brown', ic: '🍲', t: 'Paket Hemat Bromo & Semeru', s: 'Harga bundling hemat, tiap hari.', code: 'JUMATSEDAP' }
];

/* ---------------- state ---------------- */
var VER = 'sw-v4';
function migrate() {
  if (localStorage.getItem('sw-ver') !== VER) {
    ['sw-users', 'sw-session', 'sw-cart', 'sw-orders', 'sw-menu', 'sw-service'].forEach(function (k) { localStorage.removeItem(k); });
    localStorage.setItem('sw-ver', VER);
  }
}
migrate();

function arr(v) { return Array.isArray(v) ? v : []; }
function LS(k, d) {
  try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
  catch (e) { return d; }
}
function SAVE() {
  localStorage.setItem('sw-users', JSON.stringify(S.users));
  localStorage.setItem('sw-session', JSON.stringify(S.session));
  localStorage.setItem('sw-cart', JSON.stringify(S.cart));
  localStorage.setItem('sw-orders', JSON.stringify(S.orders));
  localStorage.setItem('sw-menu', JSON.stringify(S.menu));
  localStorage.setItem('sw-service', JSON.stringify(S.servis));
}
var S = {
  users: LS('sw-users', [
    { name: 'Pelanggan Wetan', email: 'demo@sedepwetan.id', pass: 'demo123', phone: '0812-3456-7890', addr: 'Jl. Mayjen Sungkono No. 12, Surabaya', joined: 'Februari 2024', tier: 'Sedep Loyal', role: 'customer' },
    { name: 'Admin Sedep', email: 'admin@sedepwetan.id', pass: 'admin123', phone: '0812-0000-1111', addr: 'Jl. Raya Sidoarjo No. 45, Sidoarjo', joined: 'Januari 2024', tier: 'Pengelola', role: 'admin' }
  ]),
  session: LS('sw-session', null),
  cart: arr(LS('sw-cart', [])),
  orders: arr(LS('sw-orders', [
    { code: 'SW240817', date: '17 Agu 2025', time: '19:12', pay: 'Transfer Bank', total: 68000,
      servis: 'Antar', status: 'Selesai', step: 4, rated: true,
      items: [{ em: '🍲', n: 'Rawon Daging Sapi', q: 2, price: 28000 }, { em: '🌿', n: 'Es Sinom Asli', q: 2, price: 8000 }],
      proof: { name: 'bukti-transfer-rawon.jpg', uploaded: '17 Agu 2025 19:10', note: 'BCA 8890-2163-77 a.n. Sekar A.' },
      verified: { by: 'admin', at: '17 Agu 2025 19:12' } },
    { code: 'SW240809', date: '9 Agu 2025', time: '12:03', pay: 'QRIS', total: 58000,
      servis: 'Makan di Tempat', status: 'Selesai', step: 4, rated: false,
      items: [{ em: '🍛', n: 'Sego Tempong Banyuwangi', q: 1, price: 25000 }, { em: '🦆', n: 'Nasi Bebek Madu', q: 1, price: 32000 }] }
  ])),
  servis: LS('sw-service', 'Antar'),
  menu: (function () {
    var m = LS('sw-menu', null);
    if (!arr(m).length) m = FOODS.map(function (f) { f.on = true; return f; });
    return m;
  })(),
  cat: 'Semua', q: '', sort: 'pop', voucher: null,
  pay: 'Transfer Bank', pendingAction: null, tab: 'dash', amsg: 'Semua', note: ''
};
if (!localStorage.getItem('sw-menu')) SAVE();

/* ---------------- helpers ---------------- */
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function money(n) { return 'Rp' + Math.round(n).toLocaleString('id-ID'); }
function food(id) { return S.menu.filter(function (f) { return f.id == id; })[0]; }
function cartCount() { return S.cart.reduce(function (a, c) { return a + c.q; }, 0); }
function addonPrice(a) {
  if (!a || a === 'Tanpa tambahan') return 0;
  var m = a.match(/\+Rp([\d.]+)/);
  return m ? parseInt(m[1].replace(/\./g, ''), 10) : 0;
}
function linePrice(i) { return i.price + addonPrice(i.addon); }
function subTotal() { return S.cart.reduce(function (a, i) { return a + linePrice(i) * i.q; }, 0); }
function discPct() { return (S.voucher && VOUCH[S.voucher]) || 0; }
function discAmt(s) { return Math.round(s * discPct() / 100); }
/* Ongkir hanya dihitung saat memilih layanan "Antar" */
function shipOf(s, servis) {
  if ((servis || S.servis) !== 'Antar') return 0;
  return (s >= FREELIM || !s) ? 0 : SHIP;
}
function grand() { var s = subTotal(); return s - discAmt(s) + shipOf(s, S.servis); }
function initials(n) {
  return n.trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
}
function loggedIn() { return !!S.session; }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function nowStamp() {
  var d = new Date();
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

var tt;
function toast(m) {
  var t = $('#toast');
  t.innerHTML = '🌿 ' + m;
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(function () { t.classList.remove('show'); }, 2600);
}

/* ---------------- router ---------------- */
var GUARD = ['checkout', 'payment', 'orders', 'profile'];
function isAdmin() { return loggedIn() && S.session.role === 'admin'; }
function go(v, force) {
  if (!force && !loggedIn() && GUARD.indexOf(v) > -1) return requireLogin(v);
  if (v === 'admin' && !isAdmin()) { S.pendingAction = 'admin'; toast('Halaman admin khusus akun pengelola 🔒'); return go('auth', true); }
  $$('.view').forEach(function (s) { s.classList.toggle('on', s.id === 'v-' + v); });
  $$('#nav button, #mobnav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
  if (v === 'home') renderHome();
  if (v === 'menu') renderMenu();
  if (v === 'auth') renderAuth();
  if (v === 'checkout') renderCheckout();
  if (v === 'payment') renderPayment();
  if (v === 'orders') renderOrders();
  if (v === 'profile') renderProfile();
  if (v === 'about') renderAbout();
  if (v === 'admin') renderAdmin();
  $('#foot').style.display = (v === 'auth') ? 'none' : 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function requireLogin(next) {
  S.pendingAction = next || 'checkout';
  go('auth', true);
  toast('Login dulu ya, supaya pesananmu bisa terlacak 🙏');
  return false;
}
function openCart() { loggedIn() ? go('checkout') : requireLogin('checkout'); }

/* ---------------- header auth zone ---------------- */
function renderAuthZone() {
  var z = $('#authzone');
  var a = $('#navAdmin');
  if (a) a.style.display = isAdmin() ? '' : 'none';
  if (loggedIn()) {
    var badge = isAdmin() ? '<span class="pill pay" style="padding:3px 8px;font-size:9.5px">ADMIN</span>' : '';
    z.innerHTML = '<button class="userchip" onclick="go(\'profile\')"><span class="avatar">' +
      initials(S.session.name) + '</span>' + esc(S.session.name.split(' ')[0]) + badge + '</button>';
  } else {
    z.innerHTML = '<button class="btn btn-o btn-s" onclick="go(\'auth\',true)">Masuk</button>' +
      '<button class="btn btn-p btn-s" onclick="regMode()">Daftar</button>';
  }
}
function regMode() { AUTH.mode = 'register'; go('auth', true); }

/* ---------------- food card ---------------- */
function fcard(f) {
  var badge = f.badge ? '<span class="ftag ' + (f.badge === 'Baru' ? 'new' : '') + '">' + f.badge + '</span>' : '';
  var coret = f.old ? '<s>' + money(f.old) + '</s>' : '';
  var hot = f.spicyOpt ? '<span class="ftag hot" style="left:auto;right:10px">🌶</span>' : '';
  return '<article class="fcard">' +
    '<div class="fph" onclick="detail(' + f.id + ')" style="cursor:pointer">' + badge + hot + '<span class="em">' + f.em + '</span></div>' +
    '<div class="fbody">' +
      '<h4 onclick="detail(' + f.id + ')" style="cursor:pointer">' + esc(f.n) + '</h4>' +
      '<div class="fdesc">' + esc(f.desc) + '</div>' +
      '<div class="fmeta"><span class="frate">★ ' + f.rate.toFixed(1) + '</span><span>· ' + f.sold.toLocaleString('id-ID') + ' terjual</span></div>' +
      '<div class="fbot"><span class="fprice">' + money(f.price) + coret + '</span>' +
      '<button class="plus" title="Tambah ke keranjang" onclick="addToCart(' + f.id + ')">+</button></div>' +
    '</div></article>';
}
function addToCart(id) {
  if (!loggedIn()) return requireLogin('menu');
  detail(id, true);
}
function badgeUp() { $('#cbadge').textContent = cartCount(); }

/* ---------------- home ---------------- */
function renderHome() {
  $('#hero').innerHTML =
    '<div class="hero"><div class="heroin">' +
      '<span class="eyebrow">🌿 Dapur terbuka tiap hari 09.00–22.00</span>' +
      '<h1>Surabaya–Banyuwangi,<br>semuanya sedep di sini.</h1>' +
      '<p>Rawon, rujak cingur, sego tempong, sate kerang, sampai wedang angsle. Dibuat segar setiap hari, bisa makan di tempat, bungkus, atau diantar.</p>' +
      '<div class="heroact"><button class="btn btn-a" onclick="go(\'menu\')">Pesan Sekarang →</button>' +
      '<button class="btn btn-g" onclick="go(\'about\')">Tentang Kami</button></div>' +
    '</div><div class="herostat"><div class="splate">🍲</div>' +
      '<div class="chipstat">⭐ 4,9 · 2.300+ ulasan</div>' +
      '<div class="chipstat">🛵 Diantar 20–35 menit</div></div></div>';

  $('#promos').innerHTML = PROMOS.map(function (p) {
    return '<div class="promo ' + p.cls + '"><em>' + p.ic + '</em><b>' + p.t + '</b><span>' + p.s + '</span><code>' + p.code + '</code></div>';
  }).join('');

  var favs = S.menu.filter(function (f) { return f.fav && f.on; });
  $('#favCount').textContent = favs.length + ' menu pilihan';
  $('#favs').innerHTML = favs.map(fcard).join('');
  $('#homeGrid').innerHTML = S.menu.filter(function (f) { return f.on; }).slice(0, 8).map(fcard).join('');

  $('#homeVals').innerHTML = '<div class="vals">' +
    '<div class="val"><i>🌱</i><b>Bahan segar pasar lokal</b><p>Kupang, siwalan, dan bandeng langsung dari pesisir Jawa Timur.</p></div>' +
    '<div class="val"><i>👵</i><b>Resep turun-temurun</b><p>Bumbu yang sama sejak warung kecil di sisi timur kota tahun 1998.</p></div>' +
    '<div class="val"><i>🛵</i><b>Diantar penuh hati</b><p>Kurir internal, kemasan kedap, pesanan tiba hangat dan utuh.</p></div></div>';
}

/* ---------------- menu ---------------- */
function renderCats() {
  $('#cats').innerHTML = CATS.map(function (c) {
    return '<button class="cat ' + (S.cat === c ? 'on' : '') + '" onclick="pickCat(\'' + c + '\')"><i>' + CAT_IC[c] + '</i>' + c + '</button>';
  }).join('');
}
function pickCat(c) { S.cat = c; go('menu'); }
function filtered() {
  var q = S.q.toLowerCase();
  var l = S.menu.filter(function (f) {
    var hay = (f.n + ' ' + f.desc + ' ' + f.tags.join(' ')).toLowerCase();
    return f.on && (S.cat === 'Semua' || f.cat === S.cat) && hay.indexOf(q) > -1;
  });
  var cmp = {
    lo: function (a, b) { return a.price - b.price; },
    hi: function (a, b) { return b.price - a.price; },
    az: function (a, b) { return a.n.localeCompare(b.n); },
    rate: function (a, b) { return b.rate - a.rate; },
    pop: function (a, b) { return b.sold - a.sold; }
  }[S.sort];
  return l.slice().sort(cmp);
}
function renderMenu() {
  renderCats();
  var l = filtered();
  $('#mTitle').textContent = S.cat === 'Semua' ? 'Semua menu' : S.cat;
  $('#mCount').textContent = l.length + ' menu ditemukan';
  $('#mGrid').innerHTML = l.map(fcard).join('') ||
    '<div class="empty" style="grid-column:1/-1"><span class="em">🔍</span><b>Menu tidak ditemukan</b>Coba kata kunci atau kategori lain.</div>';
}

/* ---------------- product detail ---------------- */
var DET = {};
function detail(id, quick) {
  var f = food(id);
  DET = { id: id, qty: 1, spice: 'Sedang', addon: 'Tanpa tambahan' };
  var spiceBlock = f.spicyOpt
    ? '<div class="opttl">Level pedas</div>' +
      '<div class="spice">' + SPICE.map(function (s) {
        return '<button class="' + (s === DET.spice ? 'on' : '') + '" onclick="setSpice(this,\'' + s + '\')">' + s + '</button>';
      }).join('') + '</div>'
    : '';
  $('#modalBox').innerHTML = '<button class="mclose" onclick="closeModal()">✕</button>' +
    '<div class="pdet"><div class="pdimg"><span class="em">' + f.em + '</span></div>' +
    '<div class="pdbody">' +
      '<span class="eyebrow">' + f.cat + (f.badge ? ' · ' + f.badge : '') + '</span>' +
      '<h2>' + esc(f.n) + '</h2>' +
      '<div class="stars"><b>★ ' + f.rate.toFixed(1) + '</b><span>· ' + f.sold.toLocaleString('id-ID') + ' terjual · 20–35 menit</span></div>' +
      '<p class="pdesc">' + esc(f.long) + '</p>' +
      '<div class="fmeta" style="font-size:11.5px">' + f.tags.map(function (t) {
        var ic = t === 'Pedas' ? '🌶 ' : t === 'Manis' ? '🍯 ' : t === 'Kuah' ? '🍲 ' : '';
        return '<span class="chip" style="pointer-events:none">' + ic + t + '</span>';
      }).join('') + '</div>' +
      spiceBlock +
      '<div class="opttl">Tambahan</div>' +
      '<div class="chips">' + ADDONS.map(function (a) {
        return '<button class="chip ' + (a === DET.addon ? 'on' : '') + '" onclick="setAddon(this,\'' + a + '\')">' + a + '</button>';
      }).join('') + '</div>' +
      '<div class="qtyrow"><div class="stepper"><button onclick="stepQty(-1)">−</button><span id="dqty">1</span><button onclick="stepQty(1)">+</button></div>' +
      '<span class="muted small">Jumlah porsi</span></div>' +
      '<div class="pfoot"><div><span class="tp" id="dtotal">' + money(f.price) + '</span><small>sudah termasuk pajak</small></div>' +
      '<button class="btn btn-p" onclick="confirmAdd()">🛍 Tambah ke keranjang</button></div>' +
    '</div></div>';
  $('#modal').classList.add('on');
  document.body.style.overflow = 'hidden';
  if (quick && f.spicyOpt) toast('Atur level pedas & tambahannya dulu ya 🌶');
}
function setSpice(el, s) {
  DET.spice = s;
  $$('.spice button').forEach(function (b) { b.classList.toggle('on', b.textContent === s); });
}
function setAddon(el, a) {
  DET.addon = a;
  $$('.chips .chip').forEach(function (b) { b.classList.toggle('on', b.textContent.replace(' ✓', '') === a); });
  recalc();
}
function stepQty(d) { DET.qty = Math.max(1, DET.qty + d); $('#dqty').textContent = DET.qty; recalc(); }
function recalc() {
  var f = food(DET.id);
  $('#dtotal').textContent = money((f.price + addonPrice(DET.addon)) * DET.qty);
}
function confirmAdd() {
  if (!loggedIn()) { closeModal(); return requireLogin('menu'); }
  var f = food(DET.id);
  var spice = f.spicyOpt ? DET.spice : null;
  var item = { id: f.id, n: f.n, em: f.em, price: f.price, q: DET.qty, spice: spice, addon: DET.addon };
  var ex = S.cart.filter(function (i) { return i.id === f.id && i.spice === spice && i.addon === DET.addon; })[0];
  if (ex) ex.q += DET.qty; else S.cart.push(item);
  SAVE(); badgeUp(); closeModal();
  toast(esc(f.n) + ' ×' + DET.qty + ' masuk keranjang 🛍');
}
function closeModal() { $('#modal').classList.remove('on'); document.body.style.overflow = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

/* ---------------- auth ---------------- */
var AUTH = { mode: 'login' };
function renderAuth() {
  var r = AUTH.mode === 'register';
  var fields = '';
  if (r) fields += '<div class="field"><label>Nama lengkap</label><input class="inp" id="fName" placeholder="Misal: Sekar Ayu"></div>';
  fields += '<div class="field"><label>Email</label><input class="inp" id="fEmail" type="email" placeholder="nama@email.com"></div>';
  if (r) fields += '<div class="field"><label>No. WhatsApp</label><input class="inp" id="fPhone" placeholder="08xxxxxxxxxx"></div>';
  fields += '<div class="field"><label>Kata sandi</label><div class="inpw"><input class="inp" id="fPass" type="password" placeholder="' +
    (r ? 'Minimal 6 karakter' : '••••••••') + '"><button onclick="peek(\'fPass\',this)">👁</button></div></div>';
  if (r) {
    fields += '<div class="field"><label>Alamat pengiriman</label><textarea class="ta" id="fAddr" placeholder="Jalan, nomor, kelurahan, kota"></textarea></div>' +
      '<div class="frow"><label><input type="checkbox" class="chk" id="fAgree">Saya setuju dengan syarat &amp; kebijakan privasi</label></div>';
  } else {
    fields += '<div class="frow"><label><input type="checkbox" class="chk">Ingat saya</label>' +
      '<a href="#" onclick="toast(\'Cek email untuk tautan reset 🔑\');return false">Lupa sandi?</a></div>';
  }

  $('#authWrap').innerHTML = '<div class="auth">' +
    '<div class="authside"><span class="em">🍲</span>' +
      '<span class="eyebrow" style="color:var(--amber-l)">Selamat datang</span>' +
      '<h2>' + (r ? 'Satu akun,<br>segudang rasa rumahan.' : 'Kangen masakan<br>rumah lagi?') + '</h2>' +
      '<p>Masuk untuk menyimpan favorit, melacak pesanan, dan mengecek riwayat transaksi kapan saja.</p>' +
      '<div class="authlist"><div><i>🛵</i>Lacak pesanan real-time</div>' +
      '<div><i>❤️</i>Simpan menu favorit di satu tempat</div>' +
      '<div><i>🎟️</i>Kumpulkan poin &amp; voucher pelanggan lama</div></div></div>' +
    '<div class="authmain"><div class="authbox">' +
      '<button class="brand" onclick="go(\'home\',true)"><span class="logo sm" data-logo></span><span class="brandtxt"><b>sedep wetan</b></span></button>' +
      '<h1>' + (r ? 'Buat akun baru' : 'Masuk ke akunmu') + '</h1>' +
      '<p>' + (r ? 'Isi data singkat, langsung bisa memesan.' : 'Halo lagi! Silakan masuk untuk lanjut memesan.') + '</p>' +
      '<div class="err" id="authErr"></div>' + fields +
      '<button class="btn btn-p btn-f" onclick="submitAuth()">' + (r ? 'Buat akun &amp; mulai pesan' : 'Masuk') + '</button>' +
      '<div class="divider">atau</div>' +
      '<div class="social"><button class="btn btn-o" onclick="social(\'Google\')">G&nbsp; Google</button>' +
      '<button class="btn btn-o" onclick="social(\'WhatsApp\')">💬 WhatsApp</button></div>' +
      '<div class="swap">' + (r ? 'Sudah punya akun?' : 'Belum punya akun?') +
      '<button onclick="AUTH.mode=\'' + (r ? 'login' : 'register') + '\';renderAuth()">' + (r ? 'Masuk di sini' : 'Daftar sekarang') + '</button></div>' +
      '<div class="demo">🔑 <b>Akun pelanggan:</b> demo@sedepwetan.id / demo123<br>' +
      '🛡️ <b>Akun admin:</b> admin@sedepwetan.id / admin123<br>' +
      '<div style="display:flex;gap:8px;margin-top:9px">' +
      '<button class="btn btn-o btn-s" style="flex:1" onclick="demoLogin(\'customer\')">Masuk pelanggan</button>' +
      '<button class="btn btn-p btn-s" style="flex:1" onclick="demoLogin(\'admin\')">Masuk admin</button></div>' +
      '<p class="small muted" style="margin-top:10px;line-height:1.5">Catatan prototype: akun, pesanan, dan bukti pembayaran disimpan di <b>localStorage browser</b> (per perangkat), belum backend bersama. Integrasi Supabase (auth + storage bukti bayar + realtime) disiapkan pada fase berikutnya.</p></div>' +
    '</div></div></div>';
  $$('[data-logo]').forEach(function (e) { e.innerHTML = LEAF; });
}
function peek(id, btn) {
  var i = $('#' + id);
  i.type = i.type === 'password' ? 'text' : 'password';
  btn.textContent = i.type === 'password' ? '👁' : '🙈';
}
function authErr(m) {
  var e = $('#authErr');
  e.textContent = '⚠ ' + m;
  e.classList.add('on');
}
function submitAuth() {
  var email = $('#fEmail').value.trim().toLowerCase();
  var pass = $('#fPass').value;
  if (AUTH.mode === 'login') {
    var u = S.users.filter(function (x) { return x.email.toLowerCase() === email; })[0];
    if (!u) return authErr('Email belum terdaftar. Coba daftar dulu, ya.');
    if (u.pass !== pass) return authErr('Kata sandi salah. Periksa kembali.');
    login(u);
  } else {
    var name = $('#fName').value.trim();
    var phone = $('#fPhone').value.trim();
    var addr = $('#fAddr').value.trim();
    if (name.length < 3) return authErr('Nama lengkap minimal 3 karakter.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return authErr('Format email belum benar.');
    if (S.users.some(function (x) { return x.email.toLowerCase() === email; })) return authErr('Email sudah dipakai. Silakan masuk.');
    if (pass.length < 6) return authErr('Kata sandi minimal 6 karakter.');
    if (!$('#fAgree').checked) return authErr('Centang persetujuan syarat & ketentuan.');
    var nu = { name: name, email: email, pass: pass, phone: phone || '-', addr: addr || '-',
            joined: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), tier: 'Pendatang Baru', role: 'customer' };
    S.users.push(nu);
    login(nu);
  }
}
function social(p) { toast(p + ' login menyusul — pakai akun demo dulu ya 🙏'); }
function demoLogin(role) {
  var u = role === 'admin'
    ? S.users.filter(function (x) { return x.role === 'admin'; })[0] || S.users[1]
    : S.users.filter(function (x) { return (x.role || 'customer') === 'customer'; })[0];
  login(u, role === 'admin' ? 'Akun admin' : 'Akun demo');
}
function login(u, label) {
  S.session = { name: u.name, email: u.email, phone: u.phone, addr: u.addr, joined: u.joined, tier: u.tier, role: u.role || 'customer' };
  SAVE(); renderAuthZone();
  toast('Sugeng rawuh, ' + esc(u.name.split(' ')[0]) + '! ' + (label ? '(' + label + ')' : '') + ' 👋');
  var back = S.pendingAction;
  S.pendingAction = null;
  if (back === 'checkout' || back === 'payment' || back === 'admin') go(back);
  else if (back === 'orders' || back === 'profile' || back === 'menu') go(back);
  else go('home', true);
}
function logout() {
  S.session = null; SAVE(); renderAuthZone();
  toast('Kamu sudah keluar. Hati-hati di jalan 🙏');
  go('home', true);
}
