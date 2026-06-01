import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set these values in your Vercel environment variables and local .env.local."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
