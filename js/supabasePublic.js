import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://mrmnstplsfupynafleht.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fwh5PGuYIajjwam7rE2Z3w_JRFqv-VG';

export const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
