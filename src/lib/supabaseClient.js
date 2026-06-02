import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabaseError = null;

function createSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseError = new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set these values in your Vercel environment variables and local .env.local."
    );
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
export const supabaseClientError = supabaseError;
