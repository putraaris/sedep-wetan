/* ============================================================
   SEDEP WETAN — Inisialisasi klien Supabase (TEMPLATE)
   Tahap pengembangan: ganti nilai di bawah dari Supabase Dashboard
   → Project Settings → API.
   ============================================================ */

/* ---- Cara 1 (disarankan): muat SDK dari CDN di <head> index.html ----
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
*/

const SUPABASE_CONFIG = {
  url: 'https://NAMAPROJEK.supabase.co',   // TODO: isi URL proyek
  anonKey: 'ANON_PUBLIC_KEY',              // TODO: isi anon/public key
  storageBucket: 'menu'
};

/* Jangan taruh service_role key di frontend — hanya untuk server/edge function. */

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.warn('[Supabase] SDK belum dimuat — masih mode prototype (data dummy).');
    return null;
  }
  if (SUPABASE_CONFIG.url.indexOf('NAMAPROJEK') > -1) {
    console.warn('[Supabase] Konfigurasi belum diisi — pakai data dummy.');
    return null;
  }
  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

const sb = initSupabase();

/* ---------- AUTH: daftar & masuk (email + password) ----------
   metadata saat signup dipakai trigger handle_new_user() di schema.sql.
*/
async function signUpCustomer({ email, password, fullName, phone, address }) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, phone, address } } // role default 'customer' via DB
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/* Simpan session (dipakai router untuk guard halaman). */
sb && sb.auth.onAuthStateChange((event, session) => {
  window.__SW_SESSION = session; // integrasikan ke state app: S.session
});

/* Cek peran admin dari table profiles (RLS sudah membatasi aksesnya). */
async function isAdmin() {
  if (!sb) return false;
  const { data, error } = await sb
    .from('profiles')
    .select('role')
    .eq('id', (await sb.auth.getUser()).data.user?.id)
    .single();
  return !error && data?.role === 'admin';
}
