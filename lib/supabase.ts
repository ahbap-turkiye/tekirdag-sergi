import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  // Build-time fallback: use a valid-looking URL so createClient doesn't throw
  _supabase = createClient(
    url || "https://placeholder.supabase.co",
    key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.placeholder"
  );
  return _supabase;
}

// Lazy proxy - client is only created when a property is actually accessed at runtime
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export type Photo = {
  id: string;
  title: string;
  author: string;
  location: string;
  story: string;
  image_url: string;
  mobile_image_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Vote = {
  id: string;
  photo_id: string;
  device_id: string;
  fingerprint: string;
  ip_address: string;
  voter_name: string | null;
  created_at: string;
};
