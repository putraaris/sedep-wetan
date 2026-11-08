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
})();