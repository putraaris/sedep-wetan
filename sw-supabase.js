/* ============================================================
   SEDEP WETAN — sw-supabase.js  (v4: menu + FOTO di semua halaman)
   Muat file ini PALING AKHIR (setelah sw.js dan sw2.js).
   - Mengambil menu dari tabel menu_items (termasuk kolom image_url)
   - Menampilkan foto di kartu menu, detail, keranjang, pembayaran, pesanan,
     riwayat, profil, dan semua panel dashboard admin
   - Jika foto gagal dimuat, otomatis kembali ke emoji
   - Jika Supabase gagal, aplikasi tetap memakai menu lokal
   ============================================================ */
(function () {
  if (typeof sb === 'undefined' || !sb) {
    console.warn('[Supabase] klien "sb" belum ada — cek urutan script & supabase/supabase-config.js. Memakai menu lokal.');
    return;
  }

  /* ---- gaya untuk foto (tidak bergantung pada isi sw.css) ---- */
  var st = document.createElement('style');
  st.textContent =
    '.fph{overflow:hidden}' +
    '.splate{overflow:hidden;padding:0}' +
    '.splate img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.crimg{position:relative;overflow:hidden;font-size:0}' +
    '.crimg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.qrbox.qrimg{width:240px;height:240px;padding:6px}' +
    '.qrbox.qrimg img{width:100%;height:100%;object-fit:contain;border-radius:10px}' +
    '.fphoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
    '.fph:has(.fphoto) .em{display:none}' +
    '.fph:has(.fphoto)::before{display:none}' +
    '.fph .ftag{z-index:2}' +
    '.pdimg:has(.pdphoto) .em{display:none}' +
    '.pdimg:has(.pdphoto)::before{display:none}' +
    '.pdimg{overflow:hidden}' +
    '.pdphoto{position:relative;z-index:1;width:100%;height:100%;min-height:330px;object-fit:cover;display:block}' +
    '.crimg{overflow:hidden}.crimg img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.eimg{width:1.5em;height:1.5em;border-radius:5px;object-fit:cover;vertical-align:-.4em;display:inline-block}' +
    '.hrimg,.pi .ic{overflow:hidden}' +
    '.hrimg .eimg,.pi .ic .eimg{width:100%;height:100%;border-radius:0;vertical-align:top;display:block}' +
    '.tfood .tph{width:38px;height:38px;border-radius:11px;object-fit:cover;flex:none;display:block;border:1px solid var(--line,#ddd)}';
  document.head.appendChild(st);

  /* foto gagal dimuat -> hapus <img>, emoji muncul lagi */
  window.swImgFail = function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); };

  function photo(f, cls) {
    return f.img ? '<img class="' + cls + '" src="' + esc(f.img) + '" alt="' + esc(f.n) +
                   '" loading="lazy" onerror="swImgFail(this)">' : '';
  }

  /* ---- kartu menu: emoji + foto (jika ada) ---- */
  window.fcard = function (f) {
    var badge = f.badge ? '<span class="ftag ' + (f.badge === 'Baru' ? 'new' : '') + '">' + esc(f.badge) + '</span>' : '';
    var coret = f.old ? '<s>' + money(f.old) + '</s>' : '';
    var hot = f.spicyOpt ? '<span class="ftag hot" style="left:auto;right:10px">🌶</span>' : '';
    return '<article class="fcard">' +
      '<div class="fph" onclick="detail(' + f.id + ')" style="cursor:pointer">' + badge + hot +
        '<span class="em">' + f.em + '</span>' + photo(f, 'fphoto') + '</div>' +
      '<div class="fbody">' +
        '<h4 onclick="detail(' + f.id + ')" style="cursor:pointer">' + esc(f.n) + '</h4>' +
        '<div class="fdesc">' + esc(f.desc) + '</div>' +
        '<div class="fmeta"><span class="frate">★ ' + f.rate.toFixed(1) + '</span><span>· ' + f.sold.toLocaleString('id-ID') + ' terjual</span></div>' +
        '<div class="fbot"><span class="fprice">' + money(f.price) + coret + '</span>' +
        '<button class="plus" title="Tambah ke keranjang" onclick="addToCart(' + f.id + ')">+</button></div>' +
      '</div></article>';
  };

  /* ---- detail menu: pasang foto di panel gambar ---- */
  var origDetail = window.detail;
  window.detail = function (id, quick) {
    origDetail(id, quick);
    var f = food(id), box = document.querySelector('#modalBox .pdimg');
    if (f && f.img && box) box.insertAdjacentHTML('beforeend', photo(f, 'pdphoto'));
  };

  /* ---- keranjang: foto kecil di tiap baris ---- */
  var origCheckout = window.renderCheckout;
  if (origCheckout) window.renderCheckout = function () {
    origCheckout.apply(this, arguments);
    var rows = document.querySelectorAll('#checkoutBody .cr');
    for (var i = 0; i < rows.length; i++) {
      var it = S.cart[i], f = it && food(it.id), im = rows[i].querySelector('.crimg');
      if (f && f.img && im && !im.querySelector('img')) im.insertAdjacentHTML('beforeend', photo(f, 'crphoto'));
    }
  };

  /* ---- foto kecil pengganti emoji di halaman lain ---- */
  window.swEmFail = function (el) {
    if (el && el.parentNode) el.parentNode.replaceChild(document.createTextNode(el.getAttribute('data-em') || ''), el);
  };
  function byName(n) { return S.menu.filter(function (m) { return m.n === n; })[0]; }
  function eimg(f) {
    return '<img class="eimg" src="' + esc(f.img) + '" alt="" data-em="' + esc(f.em) + '" onerror="swEmFail(this)">';
  }
  /* "EMOJI Nama ×2 · EMOJI Nama ×1" -> foto bila ada */
  function fixLine(el, sep, rx) {
    var parts = el.textContent.split(sep), changed = false;
    var out = parts.map(function (t) {
      var m = t.match(rx), f = m && byName(m[2]);
      if (f && f.img) { changed = true; return eimg(f) + ' ' + esc(m[2]) + (m[3] ? ' ×' + m[3] : ''); }
      return esc(t);
    });
    if (changed) el.innerHTML = out.join(sep);
  }
  function photoize(root) {
    if (!root) return;
    var i, els;
    els = root.querySelectorAll('.hrimg');                     /* item pesanan (lacak) */
    for (i = 0; i < els.length; i++) {
      var b = els[i].parentNode.querySelector('.hrinfo b'), f = b && byName(b.textContent);
      if (f && f.img && !els[i].querySelector('img')) els[i].innerHTML = eimg(f);
    }
    els = root.querySelectorAll('.pi');                        /* favorit di profil */
    for (i = 0; i < els.length; i++) {
      var ic = els[i].querySelector('.ic'), nb = els[i].querySelector('b'), g = nb && byName(nb.textContent);
      if (ic && g && g.img && !ic.querySelector('img')) ic.innerHTML = eimg(g);
    }
    els = root.querySelectorAll('.paysum > span');             /* ringkasan pembayaran */
    for (i = 0; i < els.length; i++) fixLine(els[i], '\u0000', /^(\S+)\s+(.+?)\s×(\d+)$/);
    els = root.querySelectorAll('.hrinfo p');                  /* riwayat transaksi */
    for (i = 0; i < els.length; i++) fixLine(els[i], ' · ', /^(\S+)\s+(.+?)\s×(\d+)$/);
    els = root.querySelectorAll('.lbar .nm');                  /* grafik menu terlaris */
    for (i = 0; i < els.length; i++) fixLine(els[i], '\u0000', /^(\S+)\s+(.+?)()$/);
  }
  function wrapRender(name, root) {
    var o = window[name];
    if (typeof o !== 'function') return;
    window[name] = function () {
      var r = o.apply(this, arguments);
      try { photoize(document.querySelector(root)); } catch (e) { console.error(e); }
      return r;
    };
  }
  wrapRender('renderPayment', '#payBody');
  wrapRender('renderOrders', '#ordersBody');
  wrapRender('renderProfile', '#profileBody');

  /* tabel pesanan admin: "EMOJI×2" -> foto×2 (dibangun dari data pesanan) */
  var origRows = window.admOrderRows;
  if (origRows) window.admOrderRows = function (list) {
    var html = origRows.apply(this, arguments);
    if (!list || !list.length) return html;
    var cut = html.indexOf('<tbody>');
    if (cut < 0) return html;
    var head = html.slice(0, cut), parts = html.slice(cut).split('</tr>');
    list.forEach(function (o, i) {
      var plain = o.items.map(function (it) { return it.em + '×' + it.q; }).join(' ');
      var rich = o.items.map(function (it) { var f = byName(it.n); return (f && f.img ? eimg(f) : it.em) + '×' + it.q; }).join(' ');
      if (parts[i] && rich !== plain) parts[i] = parts[i].replace('<td>' + plain + '<br>', function () { return '<td>' + rich + '<br>'; });
    });
    return head + parts.join('</tr>');
  };

  /* kartu verifikasi bayar admin: daftar item pesanan */
  var origCards = window.admPayCards;
  if (origCards) window.admPayCards = function (list) {
    var html = origCards.apply(this, arguments);
    (list || []).forEach(function (o) {
      var plain = o.items.map(function (it) { return it.em + ' ' + esc(it.n) + ' ×' + it.q; }).join('<br>');
      var rich = o.items.map(function (it) { var f = byName(it.n); return (f && f.img ? eimg(f) : it.em) + ' ' + esc(it.n) + ' ×' + it.q; }).join('<br>');
      if (rich !== plain) html = html.replace('<p class="small">' + plain + '</p>', function () { return '<p class="small">' + rich + '</p>'; });
    });
    return html;
  };

  /* ---- dashboard admin: foto di tabel kelola menu ---- */
  var origAdmin = window.renderAdmin;
  if (origAdmin) window.renderAdmin = function () {
    origAdmin.apply(this, arguments);
    try { photoize(document.querySelector('#adminBody')); } catch (e) { console.error(e); }
    var rows = document.querySelectorAll('#adminBody .tfood');
    for (var i = 0; i < rows.length; i++) {
      var b = rows[i].querySelector('b'), em = rows[i].querySelector('.em');
      if (!b || !em) continue;
      var name = b.textContent, f = S.menu.filter(function (m) { return m.n === name; })[0];
      if (f && f.img) {
        em.insertAdjacentHTML('afterend', '<img class="tph" src="' + esc(f.img) + '" alt="' + esc(f.n) + '">');
        em.style.display = 'none';
        var im = rows[i].querySelector('img.tph');
        im.onerror = function () { this.parentNode.querySelector('.em').style.display = ''; this.remove(); };
      }
    }
  };

  /* ---- ambil menu dari Supabase ---- */
  function fromRow(r) {
    return {
      id: r.id, n: r.name,
      cat: (r.categories && r.categories.name) || 'Hidangan Utama',
      em: r.emoji || '🍽',
      price: Number(r.price) || 0, old: Number(r.compare_at_price) || 0,
      rate: Number(r.rating) || 0, sold: Number(r.sold_count) || 0,
      badge: r.badge || '', fav: r.is_favorite ? 1 : 0,
      tags: Array.isArray(r.tags) ? r.tags : [],
      spicyOpt: !!r.spicy_option,
      desc: r.description || '', long: r.long_description || r.description || '',
      img: r.image_url || null,
      on: r.is_active !== false
    };
  }

  function rerender() {
    try { renderHome(); } catch (e) { console.error(e); }
    try { renderMenu(); } catch (e) { console.error(e); }
  }

  async function loadMenu() {
    var res = await sb.from('menu_items')
      .select('*, categories(name)')
      .order('sold_count', { ascending: false });
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) throw new Error('tabel menu_items kosong');
    S.menu = res.data.map(fromRow);
    rerender();
    var n = S.menu.filter(function (m) { return m.img; }).length;
    console.log('[Supabase] ' + S.menu.length + ' menu dimuat dari database (' + n + ' dengan foto).');
  }

  loadMenu().catch(function (err) {
    console.error('[Supabase] gagal memuat menu:', err);
    try { toast('Menu dari database belum bisa dimuat, memakai data lokal'); } catch (e) {}
  });

  /* ============ LOGIN, PESANAN, VERIFIKASI via SUPABASE ============ */
  var SPICES = ['Tidak pedas', 'Sedang', 'Pedas', 'Nyoss!'];
  var SVC = { antar: 'Antar', dine_in: 'Makan di Tempat', takeaway: 'Bungkus' };
  var SVCREV = { 'Antar': 'antar', 'Makan di Tempat': 'dine_in', 'Bungkus': 'takeaway' };
  var PAYMAP = { awaiting_proof: 'Menunggu Bukti', under_review: 'Menunggu Verifikasi', verified: 'Disetujui', rejected: 'Ditolak', cash_on_site: 'COD / Bayar di Tempat' };
  var STAT = { 'Menunggu Pembayaran': ['Menunggu Pembayaran', 0], 'Pesanan Diterima': ['Pesanan Diterima', 1], 'Dimasak': ['Dimasak', 2],
               'Dikemas': ['Dikemas', 3], 'Diantar / Siap': ['Diantar', 4], 'Selesai': ['Selesai', 5], 'Dibatalkan': ['Dibatalkan', 0] };

  // jangan simpan akun lokal / data URL bukti di localStorage
  S.users = [];
  var _save = window.SAVE;
  window.SAVE = function () {
    var oo = S.orders;
    try {
      S.orders = (oo || []).map(function (o) {
        return (o.uid && o.proof && o.proof.dataUrl) ? Object.assign({}, o, { proof: Object.assign({}, o.proof, { dataUrl: null }) }) : o;
      });
      _save();
    } catch (e) { console.warn('SAVE:', e); }
    finally { S.orders = oo; }
  };

  function errID(e) {
    var m = (e && e.message) || String(e);
    if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.';
    if (/already registered|already been registered/i.test(m)) return 'Email sudah dipakai. Silakan masuk.';
    if (/not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek emailmu, atau matikan "Confirm email" di Supabase (Authentication → Providers → Email).';
    if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
    if (/at least 6|password should/i.test(m)) return 'Kata sandi minimal 6 karakter.';
    if (/failed to fetch|network/i.test(m)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.';
    return m;
  }
  function curView() { var v = document.querySelector('.view.on'); return v ? v.id.replace(/^v-/, '') : ''; }
  function rerenderView() {
    var v = curView();
    try {
      if (v === 'orders') renderOrders();
      else if (v === 'admin') renderAdmin();
      else if (v === 'profile') renderProfile();
      else if (v === 'payment') renderPayment();
    } catch (e) { console.warn(e); }
  }
  var fmtD = function (d) { return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); };
  var fmtT = function (d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); };

  function fromOrder(r) {
    var uid = S.session && S.session.uid, email = S.session && S.session.email;
    var pr = (r.order_proofs || []).slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
    var st = STAT[r.order_status] || [r.order_status, 0];
    var d = new Date(r.created_at);
    return {
      uid: r.id, code: r.order_code, date: fmtD(d), time: fmtT(d),
      customer: r.user_id === uid ? email : (r.user_id || ''), customerName: r.customer_name || r.recipient_name,
      items: (r.order_items || []).map(function (i) {
        return { em: i.menu_emoji || '🍽️', n: i.menu_name, q: i.quantity, price: i.unit_price, spice: i.spice_level };
      }),
      pay: r.method, total: r.grand_total, servis: SVC[r.service] || r.service, detail: r.detail_text || '', note: r.note || '',
      payStatus: PAYMAP[r.payment_status] || r.payment_status,
      proof: pr ? { name: pr.file_name, size: 0, dataUrl: null, paid: pr.claimed_amount, ref: pr.bank_ref || '-', uploaded: fmtD(new Date(pr.created_at)) + ' ' + fmtT(new Date(pr.created_at)), path: pr.file_path } : null,
      verifyNote: r.verify_note || '', verifiedBy: r.verified_by ? 'Admin' : '',
      verifiedAt: r.verified_at ? fmtD(new Date(r.verified_at)) + ' ' + fmtT(new Date(r.verified_at)) : '',
      status: st[0], step: st[1], rated: false, eta: '25–35 menit'
    };
  }

  var proofCache = {};
  function hydrateProofs() {
    var todo = (S.orders || []).filter(function (o) { return o.proof && o.proof.path; });
    todo.forEach(function (o) { if (proofCache[o.proof.path]) o.proof.dataUrl = proofCache[o.proof.path]; });
    var need = todo.filter(function (o) { return !o.proof.dataUrl; });
    if (!need.length) return;
    Promise.all(need.map(function (o) {
      return sb.storage.from('proofs').download(o.proof.path).then(function (r) {
        if (r.error || !r.data) return;
        return new Promise(function (ok) {
          var fr = new FileReader();
          fr.onload = function () { proofCache[o.proof.path] = fr.result; o.proof.dataUrl = fr.result; ok(); };
          fr.onerror = function () { ok(); };
          fr.readAsDataURL(r.data);
        });
      }).catch(function () {});
    })).then(rerenderView);
  }

  async function loadOrders() {
    if (!S.session || !S.session.uid) { S.orders = []; return; }
    var r = await sb.from('orders').select('*, order_items(*), order_proofs(*)').order('created_at', { ascending: false }).limit(300);
    if (r.error) { console.error('[Supabase] pesanan:', r.error); try { toast('Gagal memuat pesanan: ' + r.error.message); } catch (e) {} return; }
    S.orders = r.data.map(fromOrder);
    SAVE(); try { badgeUp(); } catch (e) {}
    rerenderView(); hydrateProofs();
  }

  var rt = null, rtTimer = null;
  function startRealtime() {
    if (rt) return;
    try {
      rt = sb.channel('sw-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function () {
        clearTimeout(rtTimer); rtTimer = setTimeout(loadOrders, 400);
      }).subscribe();
    } catch (e) { console.warn('realtime:', e); }
  }
  function stopRealtime() { if (rt) { try { sb.removeChannel(rt); } catch (e) {} rt = null; } }

  async function profileSession(user) {
    var p = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    p = p.data || {};
    return {
      name: p.full_name || (user.email || '').split('@')[0], email: user.email, phone: p.phone || '-', addr: p.address || '-',
      joined: new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      tier: p.tier || 'Pendatang Baru', role: p.role || 'customer'
    };
  }
  async function finishLogin(user, needRole) {
    var u = await profileSession(user);
    if (needRole && u.role !== needRole) {
      await sb.auth.signOut();
      return authErr('Akun ini bukan akun ' + (needRole === 'admin' ? 'admin' : 'pelanggan') + '.');
    }
    login(u, u.role === 'admin' ? 'Akun admin' : null);
    S.session.uid = user.id; SAVE();
    startRealtime(); loadOrders(); loadMenu();
  }

  var authBusy = false;
  async function doAuth(needRole) {
    if (authBusy) return;
    var email = ($('#fEmail').value || '').trim().toLowerCase(), pass = $('#fPass').value || '';
    authBusy = true;
    try {
      if (needRole || AUTH.mode === 'login') {
        if (!email || !pass) return authErr('Isi email dan kata sandi dulu.');
        var r = await sb.auth.signInWithPassword({ email: email, password: pass });
        if (r.error) return authErr(errID(r.error));
        await finishLogin(r.data.user, needRole);
      } else {
        var name = $('#fName').value.trim(), phone = $('#fPhone').value.trim(), addr = $('#fAddr').value.trim();
        if (name.length < 3) return authErr('Nama lengkap minimal 3 karakter.');
        if (!/^\S+@\S+\.\S+$/.test(email)) return authErr('Format email belum benar.');
        if (pass.length < 6) return authErr('Kata sandi minimal 6 karakter.');
        if (!$('#fAgree').checked) return authErr('Centang persetujuan syarat & ketentuan.');
        var g = await sb.auth.signUp({ email: email, password: pass, options: { data: { full_name: name, phone: phone || '', address: addr || '' } } });
        if (g.error) return authErr(errID(g.error));
        if (!g.data.session) {
          AUTH.mode = 'login'; renderAuth();
          return toast('Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk.');
        }
        await finishLogin(g.data.user, null);
      }
    } catch (e) { authErr(errID(e)); }
    finally { authBusy = false; }
  }
  window.submitAuth = function () { return doAuth(null); };
  window.demoLogin = function (role) { return doAuth(role); };
  window.social = function (p) { toast('Login ' + p + ' belum tersedia — pakai email & kata sandi ya 🙏'); };

  var _logout = window.logout;
  window.logout = function () {
    stopRealtime();
    try { sb.auth.signOut(); } catch (e) {}
    S.orders = []; S.resend = null;
    _logout(); loadMenu();
  };

  var _go = window.go;
  window.go = function (v) {
    if (v !== 'payment' && v !== 'checkout') S.resend = null;
    return _go.apply(this, arguments);
  };

  // tombol "Masuk" di header selalu membuka form masuk
  window.loginMode = function () { AUTH.mode = 'login'; go('auth', true); };
  var _raz = window.renderAuthZone;
  window.renderAuthZone = function () {
    _raz.apply(this, arguments);
    var z = document.getElementById('authzone');
    if (z && !S.session) z.innerHTML = z.innerHTML.replace("go('auth',true)", 'loginMode()').replace('go(&#39;auth&#39;,true)', 'loginMode()');
  };
  try { renderAuthZone(); } catch (e) {}

  // petunjuk di kotak demo (tanpa menampilkan akun)
  var _ra = window.renderAuth;
  window.renderAuth = function () {
    _ra.apply(this, arguments);
    var d = document.querySelector('.demo');
    if (d) d.innerHTML = d.innerHTML.replace(/^[\s\S]*?(<div style="display:flex)/, '<b>Masuk cepat:</b> isi email &amp; kata sandi di atas, lalu pilih peran.$1')
      .replace(/<p class="small muted"[\s\S]*?<\/p>/, '<p class="small muted" style="margin-top:10px;line-height:1.5">Akun, pesanan, dan bukti pembayaran tersimpan aman di database Supabase.</p>');
  };

  // ---- profil ----
  window.saveProfile = async function () {
    if (!S.session || !S.session.uid) return;
    var name = $('#pName').value.trim() || S.session.name, ph = $('#pPhone').value.trim(), ad = $('#pAddr').value.trim();
    var r = await sb.from('profiles').update({ full_name: name, phone: ph, address: ad }).eq('id', S.session.uid);
    if (r.error) return toast('Gagal menyimpan profil: ' + errID(r.error));
    S.session.name = name; S.session.phone = ph; S.session.addr = ad;
    SAVE(); renderAuthZone(); renderProfile(); toast('Profil tersimpan ✔');
  };

  // ---- kirim pesanan ----
  var orderBusy = false;
  window.submitOrder = async function () {
    if (orderBusy) return;
    if (!S.session || !S.session.uid) { toast('Silakan masuk dulu 🔒'); return go('auth', true); }
    var s = subTotal(), tot = s - discAmt(s) + shipOf(s, S.servis);
    var need = payNeed();
    var paid = need ? parseRp($('#pPaid').value) : 0;
    var ref = need ? ($('#pRef').value.trim() || '-') : '-';
    if (need && !PROOF.dataUrl) return toast('Unggah bukti pembayaran dulu ya 📎');
    if (need && !/^data:image/.test(PROOF.dataUrl)) return toast('Bukti harus berupa gambar (JPG/PNG), bukan PDF 🖼️');
    if (need && paid <= 0) return toast('Isi nominal yang kamu bayarkan dulu ya');
    orderBusy = true;
    var oid = null, code = '', stage = 'pesanan';
    try {
      if (S.resend) {
        var ex = S.orders.filter(function (o) { return o.code === S.resend; })[0];
        if (!ex) throw new Error('Pesanan lama tidak ditemukan');
        oid = ex.uid; code = ex.code;
      } else {
        var items = S.cart.map(function (i) {
          return { menu_item_id: i.id, quantity: i.q, spice_level: SPICES.indexOf(i.spice) > -1 ? i.spice : null, addon: i.addon || 'Tanpa tambahan' };
        });
        var res = await sb.rpc('place_order', {
          p_service: SVCREV[S.servis] || 'antar', p_method: S.pay, p_promo: S.voucher || '', p_items: items,
          p_form: { name: S.recipient || S.session.name, phone: S.phone || S.session.phone, address: S.addr || '', landmark: S.land || '',
                    party_size: S.pax || '', detail_text: S.detail || '', note: S.note || '' }
        });
        if (res.error) throw res.error;
        oid = res.data.order_id; code = res.data.order_code;
        if (need && res.data.grand_total !== paid) toast('Total resmi dari server: ' + money(res.data.grand_total) + '. Pastikan nominal bukti sama persis.');
      }
      if (need) {
        stage = 'bukti';
        var blob = await (await fetch(PROOF.dataUrl)).blob();
        var path = oid + '/' + Date.now() + '.jpg';
        var up = await sb.storage.from('proofs').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        var sp = await sb.rpc('submit_proof', { p_order: oid, p_file_path: path, p_claimed: paid, p_ref: ref, p_file_name: PROOF.name || 'bukti.jpg' });
        if (sp.error) throw sp.error;
      }
      S.resend = null; S.cart = []; S.voucher = null; S.note = '';
      PROOF = { dataUrl: null, name: '', size: 0 };
      SAVE(); badgeUp();
      toast(need ? 'Bukti terkirim! Admin akan memeriksa nominal ' + money(paid) + ' 🧾' : 'Pesanan terkirim, bayar di tempat ya 🙏');
      await loadOrders();
      go('orders');
    } catch (e) {
      if (stage === 'bukti' && oid) {
        S.cart = []; S.voucher = null; PROOF = { dataUrl: null, name: '', size: 0 }; SAVE(); badgeUp();
        toast('Pesanan ' + code + ' dibuat, tapi bukti gagal terkirim: ' + errID(e) + '. Kirim ulang dari halaman Pesanan.');
        await loadOrders(); go('orders');
      } else toast('Gagal mengirim pesanan: ' + errID(e));
    } finally { orderBusy = false; }
  };

  // ---- verifikasi & status dapur (admin) ----
  window.verifyPay = async function (code, dec) {
    var o = S.orders.filter(function (x) { return x.code === code; })[0];
    if (!o) return;
    var ne = $('#vn-' + code), note = ne ? ne.value.trim() : '', r;
    if (dec === 'ok') {
      if (o.proof && o.proof.paid !== o.total) return toast('Tidak bisa disetujui: nominal ' + money(o.proof.paid) + ' ≠ tagihan ' + money(o.total));
      r = await sb.rpc('approve_payment', { p_order: o.uid, p_note: note });
    } else {
      if (!note) return toast('Tulis dulu alasan penolakan agar pelanggan paham ✍️');
      r = await sb.rpc('reject_payment', { p_order: o.uid, p_reason: note });
    }
    if (r.error) return toast('Gagal: ' + errID(r.error));
    toast(dec === 'ok' ? code + ' disetujui → masuk antrean dapur 🔥' : code + ' ditolak, pelanggan diminta kirim bukti yang benar');
    closeModal(); await loadOrders(); renderAdmin();
  };
  window.advStatus = async function (code) {
    var o = S.orders.filter(function (x) { return x.code === code; })[0];
    if (!o) return;
    var r = await sb.rpc('advance_order', { p_order: o.uid });
    if (r.error) return toast('Gagal: ' + errID(r.error));
    toast(code + ' → ' + r.data);
    await loadOrders(); renderAdmin();
  };


  /* ============ KELOLA MENU (admin) → database + foto ke Storage ============ */
  var BUCKET = 'Menu_wetan';
  var MI = { blob: null, url: null };
  var catMap = null;
  async function catId(name) {
    if (!catMap) {
      var r = await sb.from('categories').select('id,name');
      catMap = {}; (r.data || []).forEach(function (c) { catMap[c.name] = c.id; });
    }
    return catMap[name] || null;
  }
  window.menuPick = function (inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { inp.value = ''; return toast('Pilih berkas gambar (JPG/PNG/WEBP) 🖼️'); }
    if (f.size > 12 * 1024 * 1024) { inp.value = ''; return toast('Ukuran foto maksimal 12 MB'); }
    var u = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      c.toBlob(function (b) {
        MI.blob = b;
        var pv = document.getElementById('mImgPrev');
        if (pv) { pv.src = URL.createObjectURL(b); pv.style.display = 'block'; }
        var t = document.getElementById('mImgTxt'); if (t) t.textContent = f.name;
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function () { toast('Foto tidak bisa dibaca 😢'); };
    img.src = u;
  };
  var _menuForm = window.menuForm;
  window.menuForm = function (id) {
    _menuForm.apply(this, arguments);
    var f = id ? food(id) : null;
    MI = { blob: null, url: f && f.img ? f.img : null };
    var d = document.getElementById('mD');
    if (d) d.closest('.field').insertAdjacentHTML('beforebegin',
      '<div class="field"><label>Foto menu</label>' +
      '<label class="upl" style="padding:14px;display:flex;gap:14px;align-items:center;text-align:left">' +
      '<img id="mImgPrev" alt="" src="' + (MI.url || '') + '" style="' + (MI.url ? '' : 'display:none;') + 'width:72px;height:72px;object-fit:cover;border-radius:12px;flex:none">' +
      '<span><b>' + (MI.url ? 'Ganti foto' : 'Unggah foto menu') + '</b><br><small id="mImgTxt">JPG / PNG / WEBP — otomatis dikecilkan</small></span>' +
      '<input type="file" accept="image/*" onchange="menuPick(this)"></label></div>');
    var e = document.getElementById('mE');
    if (e) { var lb = e.closest('.field').querySelector('label'); if (lb) lb.textContent = 'Emoji cadangan (bila tanpa foto)'; }
    $$('#modalBox p.small.muted').forEach(function (p) {
      if (/Perubahan tersimpan/.test(p.textContent)) p.innerHTML = 'Menu dan foto disimpan ke database Supabase, otomatis tampil di semua pengguna.';
    });
  };
  var menuBusy = false;
  window.saveMenu = async function (id) {
    if (menuBusy) return;
    var n = $('#mN').value.trim(), pr = parseRp($('#mP').value);
    if (n.length < 3) return toast('Nama menu minimal 3 karakter ✍️');
    if (pr < 1000) return toast('Harga belum benar (min. Rp1.000) 💸');
    if (!isAdmin()) return toast('Hanya admin yang boleh mengubah menu 🔒');
    menuBusy = true;
    try {
      var row = {
        name: n, price: pr, category_id: await catId($('#mC').value), emoji: $('#mE').value.trim() || '🍽',
        description: $('#mD').value.trim() || 'Menu khas Sedep Wetan.', long_description: $('#mL').value.trim() || $('#mD').value.trim(),
        spicy_option: $('#mS').classList.contains('on'), badge: $('#mB').value.trim(), is_active: $('#mO').value === 'Tersedia'
      };
      if (MI.blob) {
        var path = 'menu-' + Date.now() + '-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '.jpg';
        var up = await sb.storage.from(BUCKET).upload(path, MI.blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        row.image_url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      var r = id ? await sb.from('menu_items').update(row).eq('id', id) : await sb.from('menu_items').insert(Object.assign({ tags: ['Baru'] }, row));
      if (r.error) throw r.error;
      MI = { blob: null, url: null };
      closeModal(); await loadMenu(); try { renderAdmin(); } catch (e) {}
      toast(n + (id ? ' diubah' : ' ditambahkan') + ' ✔');
    } catch (e) {
      var m = errID(e);
      if (/duplicate|unique/i.test(m)) m = 'Nama menu itu sudah ada.';
      if (/row-level security|policy/i.test(m)) m = 'Ditolak database. Jalankan SQL izin unggah foto untuk admin (lihat panduan).';
      toast('Gagal menyimpan menu: ' + m);
    } finally { menuBusy = false; }
  };
  window.toggleStock = async function (id) {
    var f = food(id); if (!f) return;
    var r = await sb.from('menu_items').update({ is_active: !f.on }).eq('id', id);
    if (r.error) return toast('Gagal: ' + errID(r.error));
    await loadMenu(); try { renderAdmin(); } catch (e) {}
    toast(esc(f.n) + (f.on ? ' ditandai habis' : ' diaktifkan lagi'));
  };
  window.delMenu = async function (id) {
    var f = food(id); if (!f) return;
    if (!confirm('Hapus "' + f.n + '" dari katalog? Ini permanen.')) return;
    var r = await sb.from('menu_items').delete().eq('id', id);
    if (r.error) return toast('Gagal menghapus: ' + errID(r.error));
    await loadMenu(); try { renderAdmin(); } catch (e) {}
    toast(esc(f.n) + ' dihapus dari katalog');
  };

  // logo sendiri di bagian hero beranda (menggantikan emoji panci)
  var _rh = window.renderHome;
  window.renderHome = function () {
    _rh.apply(this, arguments);
    var sp = document.querySelector('#hero .splate');
    if (sp && !sp.querySelector('img')) sp.innerHTML = '<img src="logo.jpg" alt="Logo Sedep Wetan">';
  };
  try { renderHome(); } catch (e) {}

  // jumlah "terjual" ikut berubah langsung saat ada pesanan (realtime tabel menu_items)
  (function menuRealtime() {
    var t = null;
    try {
      sb.channel('sw-menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, function () {
        clearTimeout(t); t = setTimeout(function () { loadMenu().catch(function () {}); }, 600);
      }).subscribe();
    } catch (e) { console.warn('realtime menu:', e); }
  })();

  // ---- sesi saat halaman dibuka ----
  (async function restore() {
    try {
      var r = await sb.auth.getSession();
      if (r.data && r.data.session) {
        S.session = Object.assign(await profileSession(r.data.session.user), { uid: r.data.session.user.id });
        SAVE(); renderAuthZone(); startRealtime(); await loadOrders(); loadMenu();
        if (curView() === 'admin' && !isAdmin()) go('home', true);
      } else if (S.session) {
        S.session = null; S.orders = []; SAVE(); renderAuthZone();
        if (['checkout', 'payment', 'orders', 'profile', 'admin'].indexOf(curView()) > -1) go('home', true);
      }
    } catch (e) { console.error('[Supabase] sesi:', e); }
  })();/* ============================================================
   SEDEP WETAN — sw-supabase.js  (v4: menu + FOTO di semua halaman)
   Muat file ini PALING AKHIR (setelah sw.js dan sw2.js).
   - Mengambil menu dari tabel menu_items (termasuk kolom image_url)
   - Menampilkan foto di kartu menu, detail, keranjang, pembayaran, pesanan,
     riwayat, profil, dan semua panel dashboard admin
   - Jika foto gagal dimuat, otomatis kembali ke emoji
   - Jika Supabase gagal, aplikasi tetap memakai menu lokal
   ============================================================ */
(function () {
  if (typeof sb === 'undefined' || !sb) {
    console.warn('[Supabase] klien "sb" belum ada — cek urutan script & supabase/supabase-config.js. Memakai menu lokal.');
    return;
  }

  /* ---- gaya untuk foto (tidak bergantung pada isi sw.css) ---- */
  var st = document.createElement('style');
  st.textContent =
    '.fph{overflow:hidden}' +
    '.splate{overflow:hidden;padding:0}' +
    '.about-hero:after{content:none!important}' +
    '.authside .em{font-size:0!important;line-height:0}' +
    '.splate img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.crimg{position:relative;overflow:hidden;font-size:0}' +
    '.crimg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.qrbox.qrimg{width:240px;height:240px;padding:6px}' +
    '.qrbox.qrimg img{width:100%;height:100%;object-fit:contain;border-radius:10px}' +
    '.fphoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
    '.fph:has(.fphoto) .em{display:none}' +
    '.fph:has(.fphoto)::before{display:none}' +
    '.fph .ftag{z-index:2}' +
    '.pdimg:has(.pdphoto) .em{display:none}' +
    '.pdimg:has(.pdphoto)::before{display:none}' +
    '.pdimg{overflow:hidden}' +
    '.pdphoto{position:relative;z-index:1;width:100%;height:100%;min-height:330px;object-fit:cover;display:block}' +
    '.crimg{overflow:hidden}.crimg img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.eimg{width:1.5em;height:1.5em;border-radius:5px;object-fit:cover;vertical-align:-.4em;display:inline-block}' +
    '.hrimg,.pi .ic{overflow:hidden}' +
    '.hrimg .eimg,.pi .ic .eimg{width:100%;height:100%;border-radius:0;vertical-align:top;display:block}' +
    '.tfood .tph{width:38px;height:38px;border-radius:11px;object-fit:cover;flex:none;display:block;border:1px solid var(--line,#ddd)}';
  document.head.appendChild(st);

  /* foto gagal dimuat -> hapus <img>, emoji muncul lagi */
  window.swImgFail = function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); };

  function photo(f, cls) {
    return f.img ? '<img class="' + cls + '" src="' + esc(f.img) + '" alt="' + esc(f.n) +
                   '" loading="lazy" onerror="swImgFail(this)">' : '';
  }

  /* ---- kartu menu: emoji + foto (jika ada) ---- */
  window.fcard = function (f) {
    var badge = f.badge ? '<span class="ftag ' + (f.badge === 'Baru' ? 'new' : '') + '">' + esc(f.badge) + '</span>' : '';
    var coret = f.old ? '<s>' + money(f.old) + '</s>' : '';
    var hot = f.spicyOpt ? '<span class="ftag hot" style="left:auto;right:10px">🌶</span>' : '';
    return '<article class="fcard">' +
      '<div class="fph" onclick="detail(' + f.id + ')" style="cursor:pointer">' + badge + hot +
        '<span class="em">' + f.em + '</span>' + photo(f, 'fphoto') + '</div>' +
      '<div class="fbody">' +
        '<h4 onclick="detail(' + f.id + ')" style="cursor:pointer">' + esc(f.n) + '</h4>' +
        '<div class="fdesc">' + esc(f.desc) + '</div>' +
        '<div class="fmeta"><span class="frate">★ ' + f.rate.toFixed(1) + '</span><span>· ' + f.sold.toLocaleString('id-ID') + ' terjual</span></div>' +
        '<div class="fbot"><span class="fprice">' + money(f.price) + coret + '</span>' +
        '<button class="plus" title="Tambah ke keranjang" onclick="addToCart(' + f.id + ')">+</button></div>' +
      '</div></article>';
  };

  /* ---- detail menu: pasang foto di panel gambar ---- */
  var origDetail = window.detail;
  window.detail = function (id, quick) {
    origDetail(id, quick);
    var f = food(id), box = document.querySelector('#modalBox .pdimg');
    if (f && f.img && box) box.insertAdjacentHTML('beforeend', photo(f, 'pdphoto'));
  };

  /* ---- keranjang: foto kecil di tiap baris ---- */
  var origCheckout = window.renderCheckout;
  if (origCheckout) window.renderCheckout = function () {
    origCheckout.apply(this, arguments);
    var rows = document.querySelectorAll('#checkoutBody .cr');
    for (var i = 0; i < rows.length; i++) {
      var it = S.cart[i], f = it && food(it.id), im = rows[i].querySelector('.crimg');
      if (f && f.img && im && !im.querySelector('img')) im.insertAdjacentHTML('beforeend', photo(f, 'crphoto'));
    }
  };

  /* ---- foto kecil pengganti emoji di halaman lain ---- */
  window.swEmFail = function (el) {
    if (el && el.parentNode) el.parentNode.replaceChild(document.createTextNode(el.getAttribute('data-em') || ''), el);
  };
  function byName(n) { return S.menu.filter(function (m) { return m.n === n; })[0]; }
  function eimg(f) {
    return '<img class="eimg" src="' + esc(f.img) + '" alt="" data-em="' + esc(f.em) + '" onerror="swEmFail(this)">';
  }
  /* "EMOJI Nama ×2 · EMOJI Nama ×1" -> foto bila ada */
  function fixLine(el, sep, rx) {
    var parts = el.textContent.split(sep), changed = false;
    var out = parts.map(function (t) {
      var m = t.match(rx), f = m && byName(m[2]);
      if (f && f.img) { changed = true; return eimg(f) + ' ' + esc(m[2]) + (m[3] ? ' ×' + m[3] : ''); }
      return esc(t);
    });
    if (changed) el.innerHTML = out.join(sep);
  }
  function photoize(root) {
    if (!root) return;
    var i, els;
    els = root.querySelectorAll('.hrimg');                     /* item pesanan (lacak) */
    for (i = 0; i < els.length; i++) {
      var b = els[i].parentNode.querySelector('.hrinfo b'), f = b && byName(b.textContent);
      if (f && f.img && !els[i].querySelector('img')) els[i].innerHTML = eimg(f);
    }
    els = root.querySelectorAll('.pi');                        /* favorit di profil */
    for (i = 0; i < els.length; i++) {
      var ic = els[i].querySelector('.ic'), nb = els[i].querySelector('b'), g = nb && byName(nb.textContent);
      if (ic && g && g.img && !ic.querySelector('img')) ic.innerHTML = eimg(g);
    }
    els = root.querySelectorAll('.paysum > span');             /* ringkasan pembayaran */
    for (i = 0; i < els.length; i++) fixLine(els[i], '\u0000', /^(\S+)\s+(.+?)\s×(\d+)$/);
    els = root.querySelectorAll('.hrinfo p');                  /* riwayat transaksi */
    for (i = 0; i < els.length; i++) fixLine(els[i], ' · ', /^(\S+)\s+(.+?)\s×(\d+)$/);
    els = root.querySelectorAll('.lbar .nm');                  /* grafik menu terlaris */
    for (i = 0; i < els.length; i++) fixLine(els[i], '\u0000', /^(\S+)\s+(.+?)()$/);
  }
  function wrapRender(name, root) {
    var o = window[name];
    if (typeof o !== 'function') return;
    window[name] = function () {
      var r = o.apply(this, arguments);
      try { photoize(document.querySelector(root)); } catch (e) { console.error(e); }
      return r;
    };
  }
  wrapRender('renderPayment', '#payBody');
  wrapRender('renderOrders', '#ordersBody');
  wrapRender('renderProfile', '#profileBody');

  /* tabel pesanan admin: "EMOJI×2" -> foto×2 (dibangun dari data pesanan) */
  var origRows = window.admOrderRows;
  if (origRows) window.admOrderRows = function (list) {
    var html = origRows.apply(this, arguments);
    if (!list || !list.length) return html;
    var cut = html.indexOf('<tbody>');
    if (cut < 0) return html;
    var head = html.slice(0, cut), parts = html.slice(cut).split('</tr>');
    list.forEach(function (o, i) {
      var plain = o.items.map(function (it) { return it.em + '×' + it.q; }).join(' ');
      var rich = o.items.map(function (it) { var f = byName(it.n); return (f && f.img ? eimg(f) : it.em) + '×' + it.q; }).join(' ');
      if (parts[i] && rich !== plain) parts[i] = parts[i].replace('<td>' + plain + '<br>', function () { return '<td>' + rich + '<br>'; });
    });
    return head + parts.join('</tr>');
  };

  /* kartu verifikasi bayar admin: daftar item pesanan */
  var origCards = window.admPayCards;
  if (origCards) window.admPayCards = function (list) {
    var html = origCards.apply(this, arguments);
    (list || []).forEach(function (o) {
      var plain = o.items.map(function (it) { return it.em + ' ' + esc(it.n) + ' ×' + it.q; }).join('<br>');
      var rich = o.items.map(function (it) { var f = byName(it.n); return (f && f.img ? eimg(f) : it.em) + ' ' + esc(it.n) + ' ×' + it.q; }).join('<br>');
      if (rich !== plain) html = html.replace('<p class="small">' + plain + '</p>', function () { return '<p class="small">' + rich + '</p>'; });
    });
    return html;
  };

  /* ---- dashboard admin: foto di tabel kelola menu ---- */
  var origAdmin = window.renderAdmin;
  if (origAdmin) window.renderAdmin = function () {
    origAdmin.apply(this, arguments);
    try { photoize(document.querySelector('#adminBody')); } catch (e) { console.error(e); }
    var rows = document.querySelectorAll('#adminBody .tfood');
    for (var i = 0; i < rows.length; i++) {
      var b = rows[i].querySelector('b'), em = rows[i].querySelector('.em');
      if (!b || !em) continue;
      var name = b.textContent, f = S.menu.filter(function (m) { return m.n === name; })[0];
      if (f && f.img) {
        em.insertAdjacentHTML('afterend', '<img class="tph" src="' + esc(f.img) + '" alt="' + esc(f.n) + '">');
        em.style.display = 'none';
        var im = rows[i].querySelector('img.tph');
        im.onerror = function () { this.parentNode.querySelector('.em').style.display = ''; this.remove(); };
      }
    }
  };

  /* ---- ambil menu dari Supabase ---- */
  function fromRow(r) {
    return {
      id: r.id, n: r.name,
      cat: (r.categories && r.categories.name) || 'Hidangan Utama',
      em: r.emoji || '🍽',
      price: Number(r.price) || 0, old: Number(r.compare_at_price) || 0,
      rate: Number(r.rating) || 0, sold: Number(r.sold_count) || 0,
      badge: r.badge || '', fav: r.is_favorite ? 1 : 0,
      tags: Array.isArray(r.tags) ? r.tags : [],
      spicyOpt: !!r.spicy_option,
      desc: r.description || '', long: r.long_description || r.description || '',
      img: r.image_url || null,
      on: r.is_active !== false
    };
  }

  function rerender() {
    try { renderHome(); } catch (e) { console.error(e); }
    try { renderMenu(); } catch (e) { console.error(e); }
  }

  async function loadMenu() {
    var res = await sb.from('menu_items')
      .select('*, categories(name)')
      .order('sold_count', { ascending: false });
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) throw new Error('tabel menu_items kosong');
    S.menu = res.data.map(fromRow);
    rerender();
    var n = S.menu.filter(function (m) { return m.img; }).length;
    console.log('[Supabase] ' + S.menu.length + ' menu dimuat dari database (' + n + ' dengan foto).');
  }

  loadMenu().catch(function (err) {
    console.error('[Supabase] gagal memuat menu:', err);
    try { toast('Menu dari database belum bisa dimuat, memakai data lokal'); } catch (e) {}
  });

  /* ============ LOGIN, PESANAN, VERIFIKASI via SUPABASE ============ */
  var SPICES = ['Tidak pedas', 'Sedang', 'Pedas', 'Nyoss!'];
  var SVC = { antar: 'Antar', dine_in: 'Makan di Tempat', takeaway: 'Bungkus' };
  var SVCREV = { 'Antar': 'antar', 'Makan di Tempat': 'dine_in', 'Bungkus': 'takeaway' };
  var PAYMAP = { awaiting_proof: 'Menunggu Bukti', under_review: 'Menunggu Verifikasi', verified: 'Disetujui', rejected: 'Ditolak', cash_on_site: 'COD / Bayar di Tempat' };
  var STAT = { 'Menunggu Pembayaran': ['Menunggu Pembayaran', 0], 'Pesanan Diterima': ['Pesanan Diterima', 1], 'Dimasak': ['Dimasak', 2],
               'Dikemas': ['Dikemas', 3], 'Diantar / Siap': ['Diantar', 4], 'Selesai': ['Selesai', 5], 'Dibatalkan': ['Dibatalkan', 0] };

  // jangan simpan akun lokal / data URL bukti di localStorage
  S.users = [];
  var _save = window.SAVE;
  window.SAVE = function () {
    var oo = S.orders;
    try {
      S.orders = (oo || []).map(function (o) {
        return (o.uid && o.proof && o.proof.dataUrl) ? Object.assign({}, o, { proof: Object.assign({}, o.proof, { dataUrl: null }) }) : o;
      });
      _save();
    } catch (e) { console.warn('SAVE:', e); }
    finally { S.orders = oo; }
  };

  function errID(e) {
    var m = (e && e.message) || String(e);
    if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.';
    if (/already registered|already been registered/i.test(m)) return 'Email sudah dipakai. Silakan masuk.';
    if (/not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek emailmu, atau matikan "Confirm email" di Supabase (Authentication → Providers → Email).';
    if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
    if (/at least 6|password should/i.test(m)) return 'Kata sandi minimal 6 karakter.';
    if (/failed to fetch|network/i.test(m)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.';
    return m;
  }
  function curView() { var v = document.querySelector('.view.on'); return v ? v.id.replace(/^v-/, '') : ''; }
  function rerenderView() {
    var v = curView();
    try {
      if (v === 'orders') renderOrders();
      else if (v === 'admin') renderAdmin();
      else if (v === 'profile') renderProfile();
      else if (v === 'payment') renderPayment();
    } catch (e) { console.warn(e); }
  }
  var fmtD = function (d) { return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); };
  var fmtT = function (d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); };

  function fromOrder(r) {
    var uid = S.session && S.session.uid, email = S.session && S.session.email;
    var pr = (r.order_proofs || []).slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
    var st = STAT[r.order_status] || [r.order_status, 0];
    var d = new Date(r.created_at);
    return {
      uid: r.id, code: r.order_code, date: fmtD(d), time: fmtT(d),
      customer: r.user_id === uid ? email : (r.user_id || ''), customerName: r.customer_name || r.recipient_name,
      items: (r.order_items || []).map(function (i) {
        return { em: i.menu_emoji || '🍽️', n: i.menu_name, q: i.quantity, price: i.unit_price, spice: i.spice_level };
      }),
      pay: r.method, total: r.grand_total, servis: SVC[r.service] || r.service, detail: r.detail_text || '', note: r.note || '',
      payStatus: PAYMAP[r.payment_status] || r.payment_status,
      proof: pr ? { name: pr.file_name, size: 0, dataUrl: null, paid: pr.claimed_amount, ref: pr.bank_ref || '-', uploaded: fmtD(new Date(pr.created_at)) + ' ' + fmtT(new Date(pr.created_at)), path: pr.file_path } : null,
      verifyNote: r.verify_note || '', verifiedBy: r.verified_by ? 'Admin' : '',
      verifiedAt: r.verified_at ? fmtD(new Date(r.verified_at)) + ' ' + fmtT(new Date(r.verified_at)) : '',
      status: st[0], step: st[1], rated: false, eta: '25–35 menit'
    };
  }

  var proofCache = {};
  function hydrateProofs() {
    var todo = (S.orders || []).filter(function (o) { return o.proof && o.proof.path; });
    todo.forEach(function (o) { if (proofCache[o.proof.path]) o.proof.dataUrl = proofCache[o.proof.path]; });
    var need = todo.filter(function (o) { return !o.proof.dataUrl; });
    if (!need.length) return;
    Promise.all(need.map(function (o) {
      return sb.storage.from('proofs').download(o.proof.path).then(function (r) {
        if (r.error || !r.data) return;
        return new Promise(function (ok) {
          var fr = new FileReader();
          fr.onload = function () { proofCache[o.proof.path] = fr.result; o.proof.dataUrl = fr.result; ok(); };
          fr.onerror = function () { ok(); };
          fr.readAsDataURL(r.data);
        });
      }).catch(function () {});
    })).then(rerenderView);
  }

  async function loadOrders() {
    if (!S.session || !S.session.uid) { S.orders = []; return; }
    var r = await sb.from('orders').select('*, order_items(*), order_proofs(*)').order('created_at', { ascending: false }).limit(300);
    if (r.error) { console.error('[Supabase] pesanan:', r.error); try { toast('Gagal memuat pesanan: ' + r.error.message); } catch (e) {} return; }
    S.orders = r.data.map(fromOrder);
    SAVE(); try { badgeUp(); } catch (e) {}
    rerenderView(); hydrateProofs();
  }

  var rt = null, rtTimer = null;
  function startRealtime() {
    if (rt) return;
    try {
      rt = sb.channel('sw-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function () {
        clearTimeout(rtTimer); rtTimer = setTimeout(loadOrders, 400);
      }).subscribe();
    } catch (e) { console.warn('realtime:', e); }
  }
  function stopRealtime() { if (rt) { try { sb.removeChannel(rt); } catch (e) {} rt = null; } }

  async function profileSession(user) {
    var p = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    p = p.data || {};
    return {
      name: p.full_name || (user.email || '').split('@')[0], email: user.email, phone: p.phone || '-', addr: p.address || '-',
      joined: new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      tier: p.tier || 'Pendatang Baru', role: p.role || 'customer'
    };
  }
  async function finishLogin(user, needRole) {
    var u = await profileSession(user);
    if (needRole && u.role !== needRole) {
      await sb.auth.signOut();
      return authErr('Akun ini bukan akun ' + (needRole === 'admin' ? 'admin' : 'pelanggan') + '.');
    }
    login(u, u.role === 'admin' ? 'Akun admin' : null);
    S.session.uid = user.id; SAVE();
    startRealtime(); loadOrders(); loadMenu();
  }

  var authBusy = false;
  async function doAuth(needRole) {
    if (authBusy) return;
    var email = ($('#fEmail').value || '').trim().toLowerCase(), pass = $('#fPass').value || '';
    authBusy = true;
    try {
      if (needRole || AUTH.mode === 'login') {
        if (!email || !pass) return authErr('Isi email dan kata sandi dulu.');
        var r = await sb.auth.signInWithPassword({ email: email, password: pass });
        if (r.error) return authErr(errID(r.error));
        await finishLogin(r.data.user, needRole);
      } else {
        var name = $('#fName').value.trim(), phone = $('#fPhone').value.trim(), addr = $('#fAddr').value.trim();
        if (name.length < 3) return authErr('Nama lengkap minimal 3 karakter.');
        if (!/^\S+@\S+\.\S+$/.test(email)) return authErr('Format email belum benar.');
        if (pass.length < 6) return authErr('Kata sandi minimal 6 karakter.');
        if (!$('#fAgree').checked) return authErr('Centang persetujuan syarat & ketentuan.');
        var g = await sb.auth.signUp({ email: email, password: pass, options: { data: { full_name: name, phone: phone || '', address: addr || '' } } });
        if (g.error) return authErr(errID(g.error));
        if (!g.data.session) {
          AUTH.mode = 'login'; renderAuth();
          return toast('Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk.');
        }
        await finishLogin(g.data.user, null);
      }
    } catch (e) { authErr(errID(e)); }
    finally { authBusy = false; }
  }
  window.submitAuth = function () { return doAuth(null); };
  window.demoLogin = function (role) { return doAuth(role); };
  window.social = function (p) { toast('Login ' + p + ' belum tersedia — pakai email & kata sandi ya 🙏'); };

  var _logout = window.logout;
  window.logout = function () {
    stopRealtime();
    try { sb.auth.signOut(); } catch (e) {}
    S.orders = []; S.resend = null;
    _logout(); loadMenu();
  };

  var _go = window.go;
  window.go = function (v) {
    if (v !== 'payment' && v !== 'checkout') S.resend = null;
    return _go.apply(this, arguments);
  };

  // tombol "Masuk" di header selalu membuka form masuk
  window.loginMode = function () { AUTH.mode = 'login'; go('auth', true); };
  var _raz = window.renderAuthZone;
  window.renderAuthZone = function () {
    _raz.apply(this, arguments);
    var z = document.getElementById('authzone');
    if (z && !S.session) z.innerHTML = z.innerHTML.replace("go('auth',true)", 'loginMode()').replace('go(&#39;auth&#39;,true)', 'loginMode()');
  };
  try { renderAuthZone(); } catch (e) {}

  // petunjuk di kotak demo (tanpa menampilkan akun)
  var _ra = window.renderAuth;
  window.renderAuth = function () {
    _ra.apply(this, arguments);
    var d = document.querySelector('.demo');
    if (d) d.innerHTML = d.innerHTML.replace(/^[\s\S]*?(<div style="display:flex)/, '<b>Masuk cepat:</b> isi email &amp; kata sandi di atas, lalu pilih peran.$1')
      .replace(/<p class="small muted"[\s\S]*?<\/p>/, '<p class="small muted" style="margin-top:10px;line-height:1.5">Akun, pesanan, dan bukti pembayaran tersimpan aman di database Supabase.</p>');
  };

  // ---- profil ----
  window.saveProfile = async function () {
    if (!S.session || !S.session.uid) return;
    var name = $('#pName').value.trim() || S.session.name, ph = $('#pPhone').value.trim(), ad = $('#pAddr').value.trim();
    var r = await sb.from('profiles').update({ full_name: name, phone: ph, address: ad }).eq('id', S.session.uid);
    if (r.error) return toast('Gagal menyimpan profil: ' + errID(r.error));
    S.session.name = name; S.session.phone = ph; S.session.addr = ad;
    SAVE(); renderAuthZone(); renderProfile(); toast('Profil tersimpan ✔');
  };

  // ---- kirim pesanan ----
  var orderBusy = false;
  window.submitOrder = async function () {
    if (orderBusy) return;
    if (!S.session || !S.session.uid) { toast('Silakan masuk dulu 🔒'); return go('auth', true); }
    var s = subTotal(), tot = s - discAmt(s) + shipOf(s, S.servis);
    var need = payNeed();
    var paid = need ? parseRp($('#pPaid').value) : 0;
    var ref = need ? ($('#pRef').value.trim() || '-') : '-';
    if (need && !PROOF.dataUrl) return toast('Unggah bukti pembayaran dulu ya 📎');
    if (need && !/^data:image/.test(PROOF.dataUrl)) return toast('Bukti harus berupa gambar (JPG/PNG), bukan PDF 🖼️');
    if (need && paid <= 0) return toast('Isi nominal yang kamu bayarkan dulu ya');
    orderBusy = true;
    var oid = null, code = '', stage = 'pesanan';
    try {
      if (S.resend) {
        var ex = S.orders.filter(function (o) { return o.code === S.resend; })[0];
        if (!ex) throw new Error('Pesanan lama tidak ditemukan');
        oid = ex.uid; code = ex.code;
      } else {
        var items = S.cart.map(function (i) {
          return { menu_item_id: i.id, quantity: i.q, spice_level: SPICES.indexOf(i.spice) > -1 ? i.spice : null, addon: i.addon || 'Tanpa tambahan' };
        });
        var res = await sb.rpc('place_order', {
          p_service: SVCREV[S.servis] || 'antar', p_method: S.pay, p_promo: S.voucher || '', p_items: items,
          p_form: { name: S.recipient || S.session.name, phone: S.phone || S.session.phone, address: S.addr || '', landmark: S.land || '',
                    party_size: S.pax || '', detail_text: S.detail || '', note: S.note || '' }
        });
        if (res.error) throw res.error;
        oid = res.data.order_id; code = res.data.order_code;
        if (need && res.data.grand_total !== paid) toast('Total resmi dari server: ' + money(res.data.grand_total) + '. Pastikan nominal bukti sama persis.');
      }
      if (need) {
        stage = 'bukti';
        var blob = await (await fetch(PROOF.dataUrl)).blob();
        var path = oid + '/' + Date.now() + '.jpg';
        var up = await sb.storage.from('proofs').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        var sp = await sb.rpc('submit_proof', { p_order: oid, p_file_path: path, p_claimed: paid, p_ref: ref, p_file_name: PROOF.name || 'bukti.jpg' });
        if (sp.error) throw sp.error;
      }
      S.resend = null; S.cart = []; S.voucher = null; S.note = '';
      PROOF = { dataUrl: null, name: '', size: 0 };
      SAVE(); badgeUp();
      toast(need ? 'Bukti terkirim! Admin akan memeriksa nominal ' + money(paid) + ' 🧾' : 'Pesanan terkirim, bayar di tempat ya 🙏');
      await loadOrders();
      go('orders');
    } catch (e) {
      if (stage === 'bukti' && oid) {
        S.cart = []; S.voucher = null; PROOF = { dataUrl: null, name: '', size: 0 }; SAVE(); badgeUp();
        toast('Pesanan ' + code + ' dibuat, tapi bukti gagal terkirim: ' + errID(e) + '. Kirim ulang dari halaman Pesanan.');
        await loadOrders(); go('orders');
      } else toast('Gagal mengirim pesanan: ' + errID(e));
    } finally { orderBusy = false; }
  };

  // ---- verifikasi & status dapur (admin) ----
  window.verifyPay = async function (code, dec) {
    var o = S.orders.filter(function (x) { return x.code === code; })[0];
    if (!o) return;
    var ne = $('#vn-' + code), note = ne ? ne.value.trim() : '', r;
    if (dec === 'ok') {
      if (o.proof && o.proof.paid !== o.total) return toast('Tidak bisa disetujui: nominal ' + money(o.proof.paid) + ' ≠ tagihan ' + money(o.total));
      r = await sb.rpc('approve_payment', { p_order: o.uid, p_note: note });
    } else {
      if (!note) return toast('Tulis dulu alasan penolakan agar pelanggan paham ✍️');
      r = await sb.rpc('reject_payment', { p_order: o.uid, p_reason: note });
    }
    if (r.error) return toast('Gagal: ' + errID(r.error));
    toast(dec === 'ok' ? code + ' disetujui → masuk antrean dapur 🔥' : code + ' ditolak, pelanggan diminta kirim bukti yang benar');
    closeModal(); await loadOrders(); renderAdmin();
  };
  window.advStatus = async function (code) {
    var o = S.orders.filter(function (x) { return x.code === code; })[0];
    if (!o) return;
    var r = await sb.rpc('advance_order', { p_order: o.uid });
    if (r.error) return toast('Gagal: ' + errID(r.error));
    toast(code + ' → ' + r.data);
    await loadOrders(); renderAdmin();
  };


  /* ============ KELOLA MENU (admin) → database + foto ke Storage ============ */
  var BUCKET = 'Menu_wetan';
  var MI = { blob: null, url: null };
  var catMap = null;
  async function catId(name) {
    if (!catMap) {
      var r = await sb.from('categories').select('id,name');
      catMap = {}; (r.data || []).forEach(function (c) { catMap[c.name] = c.id; });
    }
    return catMap[name] || null;
  }
  window.menuPick = function (inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { inp.value = ''; return toast('Pilih berkas gambar (JPG/PNG/WEBP) 🖼️'); }
    if (f.size > 12 * 1024 * 1024) { inp.value = ''; return toast('Ukuran foto maksimal 12 MB'); }
    var u = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      c.toBlob(function (b) {
        MI.blob = b;
        var pv = document.getElementById('mImgPrev');
        if (pv) { pv.src = URL.createObjectURL(b); pv.style.display = 'block'; }
        var t = document.getElementById('mImgTxt'); if (t) t.textContent = f.name;
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function () { toast('Foto tidak bisa dibaca 😢'); };
    img.src = u;
  };
  var _menuForm = window.menuForm;
  window.menuForm = function (id) {
    _menuForm.apply(this, arguments);
    var f = id ? food(id) : null;
    MI = { blob: null, url: f && f.img ? f.img : null };
    var d = document.getElementById('mD');
    if (d) d.closest('.field').insertAdjacentHTML('beforebegin',
      '<div class="field"><label>Foto menu</label>' +
      '<label class="upl" style="padding:14px;display:flex;gap:14px;align-items:center;text-align:left">' +
      '<img id="mImgPrev" alt="" src="' + (MI.url || '') + '" style="' + (MI.url ? '' : 'display:none;') + 'width:72px;height:72px;object-fit:cover;border-radius:12px;flex:none">' +
      '<span><b>' + (MI.url ? 'Ganti foto' : 'Unggah foto menu') + '</b><br><small id="mImgTxt">JPG / PNG / WEBP — otomatis dikecilkan</small></span>' +
      '<input type="file" accept="image/*" onchange="menuPick(this)"></label></div>');
    var e = document.getElementById('mE');
    if (e) { var lb = e.closest('.field').querySelector('label'); if (lb) lb.textContent = 'Emoji cadangan (bila tanpa foto)'; }
    $$('#modalBox p.small.muted').forEach(function (p) {
      if (/Perubahan tersimpan/.test(p.textContent)) p.innerHTML = 'Menu dan foto disimpan ke database Supabase, otomatis tampil di semua pengguna.';
    });
  };
  var menuBusy = false;
  window.saveMenu = async function (id) {
    if (menuBusy) return;
    var n = $('#mN').value.trim(), pr = parseRp($('#mP').value);
    if (n.length < 3) return toast('Nama menu minimal 3 karakter ✍️');
    if (pr < 1000) return toast('Harga belum benar (min. Rp1.000) 💸');
    if (!isAdmin()) return toast('Hanya admin yang boleh mengubah menu 🔒');
    menuBusy = true;
    try {
      var row = {
        name: n, price: pr, category_id: await catId($('#mC').value), emoji: $('#mE').value.trim() || '🍽',
        description: $('#mD').value.trim() || 'Menu khas Sedep Wetan.', long_description: $('#mL').value.trim() || $('#mD').value.trim(),
        spicy_option: $('#mS').classList.contains('on'), badge: $('#mB').value.trim(), is_active: $('#mO').value === 'Tersedia'
      };
      if (MI.blob) {
        var path = 'menu-' + Date.now() + '-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '.jpg';
        var up = await sb.storage.from(BUCKET).upload(path, MI.blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        row.image_url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      var r = id ? await sb.from('menu_items').update(row).eq('id', id) : await sb.from('menu_items').insert(Object.assign({ tags: ['Baru'] }, row));
      if (r.error) throw r.error;
      MI = { blob: null, url: null };
      closeModal(); await loadMenu(); try { renderAdmin(); } catch (e) {}
      toast(n + (id ? ' diubah' : ' ditambahkan') + ' ✔');
    } catch (e) {
      var m = errID(e);
      if (/duplicate|unique/i.test(m)) m = 'Nama menu itu sudah ada.';
      if (/row-level security|policy/i.test(m)) m = 'Ditolak database. Jalankan SQL izin unggah foto untuk admin (lihat panduan).';
      toast('Gagal menyimpan menu: ' + m);
    } finally { menuBusy = false; }
  };
  window.toggleStock = async function (id) {
    var f = food(id); if (!f) return;
    var r = await sb.from('menu_items').update({ is_active: !f.on }).eq('id', id);
    if (r.error) return toast('Gagal: ' + errID(r.error));
    await loadMenu(); try { renderAdmin(); } catch (e) {}
    toast(esc(f.n) + (f.on ? ' ditandai habis' : ' diaktifkan lagi'));
  };
  window.delMenu = async function (id) {
    var f = food(id); if (!f) return;
    if (!confirm('Hapus "' + f.n + '" dari katalog? Ini permanen.')) return;
    var r = await sb.from('menu_items').delete().eq('id', id);
    if (r.error) return toast('Gagal menghapus: ' + errID(r.error));
    await loadMenu(); try { renderAdmin(); } catch (e) {}
    toast(esc(f.n) + ' dihapus dari katalog');
  };

  // logo sendiri di bagian hero beranda (menggantikan emoji panci)
  function logoize() {
    $$('.splate').forEach(function (sp) {
      if (!sp.querySelector('img')) sp.innerHTML = '<img src="logo.jpg" alt="Logo Sedep Wetan">';
    });
    var ae = document.querySelector('.authside .em');
    if (ae && !ae.querySelector('img')) ae.innerHTML = '<img src="logo.jpg" alt="Logo Sedep Wetan" style="width:96px;height:96px;border-radius:26px;object-fit:cover;display:block;box-shadow:0 10px 24px rgba(0,0,0,.25)">';
  }
  ['renderHome', 'renderAbout', 'renderAuth'].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { var r = orig.apply(this, arguments); try { logoize(); } catch (e) {} return r; };
  });
  try { renderHome(); } catch (e) {}

  // jumlah "terjual" ikut berubah langsung saat ada pesanan (realtime tabel menu_items)
  (function menuRealtime() {
    var t = null;
    try {
      sb.channel('sw-menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, function () {
        clearTimeout(t); t = setTimeout(function () { loadMenu().catch(function () {}); }, 600);
      }).subscribe();
    } catch (e) { console.warn('realtime menu:', e); }
  })();

  // ---- sesi saat halaman dibuka ----
  (async function restore() {
    try {
      var r = await sb.auth.getSession();
      if (r.data && r.data.session) {
        S.session = Object.assign(await profileSession(r.data.session.user), { uid: r.data.session.user.id });
        SAVE(); renderAuthZone(); startRealtime(); await loadOrders(); loadMenu();
        if (curView() === 'admin' && !isAdmin()) go('home', true);
      } else if (S.session) {
        S.session = null; S.orders = []; SAVE(); renderAuthZone();
        if (['checkout', 'payment', 'orders', 'profile', 'admin'].indexOf(curView()) > -1) go('home', true);
      }
    } catch (e) { console.error('[Supabase] sesi:', e); }
  })();
  // QRIS asli
  if (typeof window.payPanel === 'function') {
    var _pp = window.payPanel;
    window.payPanel = function (tot) {
      var h = _pp.apply(this, arguments);
      if (S.pay === 'QRIS') {
        h = h.replace(/<div class="qrbox">[\s\S]*?<\/svg><\/div>/, '<div class="qrbox qrimg"><img src="uploads/qris.jpg" alt="QRIS Sedep Wetan a.n. MOH. ARIS"></div>')
             .replace('BRI / GoPay / OVO / DANA', 'a.n. MOH. ARIS · semua e-wallet &amp; m-banking');
      }
      return h;
    };
  }
})();
  // QRIS asli
  if (typeof window.payPanel === 'function') {
    var _pp = window.payPanel;
    window.payPanel = function (tot) {
      var h = _pp.apply(this, arguments);
      if (S.pay === 'QRIS') {
        h = h.replace(/<div class="qrbox">[\s\S]*?<\/svg><\/div>/, '<div class="qrbox qrimg"><img src="uploads/qris.jpg" alt="QRIS Sedep Wetan a.n. MOH. ARIS"></div>')
             .replace('BRI / GoPay / OVO / DANA', 'a.n. MOH. ARIS · semua e-wallet &amp; m-banking');
      }
      return h;
    };
  }
})();