import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gotxxgvyoqwvedubdrcz.supabase.co";
const supabaseKey = "sb_publishable_kpsmabVTGZNFFF2N89yNEQ_fxCyoF9K";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: "supabase-auth",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
