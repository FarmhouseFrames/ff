// Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mrmnstplsfupynafleht.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fwh5PGuYIajjwam7rE2Z3w_JRFqv-VG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
