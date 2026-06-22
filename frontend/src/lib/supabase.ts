import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isLikelyValidSupabaseKey(key: string): boolean {
  return (
    key.startsWith("eyJ") ||
    key.startsWith("sb_publishable_") ||
    key.startsWith("sb_publishable-")
  );
}

export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.";
  }

  if (!supabaseUrl.includes(".supabase.co")) {
    return "VITE_SUPABASE_URL does not look like a valid Supabase project URL.";
  }

  if (!isLikelyValidSupabaseKey(supabaseAnonKey)) {
    return (
      "VITE_SUPABASE_ANON_KEY looks invalid. Copy the Publishable key (sb_publishable_...) " +
      "or legacy anon key (eyJ...) from Supabase Dashboard → Project Settings → API Keys."
    );
  }

  return null;
}

export const supabaseConfigError = getSupabaseConfigError();

if (supabaseConfigError) {
  console.error(`Supabase config error: ${supabaseConfigError}`);
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);
