// Kunci publishable/anon boleh di frontend. JANGAN isi service_role / secret key.
const SUPABASE_URL = 'https://wxhcnyiujxzesvrfypxb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V5z-_h6KkLc5VR-JZF2WiA_tj2cArfi';

// Beri nama sb. Jangan membuat fungsi bernama isAdmin: nama itu sudah dipakai sw.js.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)