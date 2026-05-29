import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Use project-specific values from the system context
const supabaseUrl = "https://ujughujunixnwlmtdsxd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdWdodWp1bml4bndsbXRkc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzM2NDMsImV4cCI6MjA1OTU0OTY0M30.cYdp-7I8DBOl2rkR0yQXHSsaZGLQgkhFlqqOYqJ8JeA";

let client: SupabaseClient | null = null;
const getClient = (): SupabaseClient => {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }
    });
  }
  return client;
};

// Lazy proxy: the underlying client (and its network/auth setup) is created on
// first property access rather than at module import, so simply importing this
// module — e.g. from the deferred analytics chunk — no longer opens a Supabase
// connection during initial page load. Call sites keep using `supabase.x` as-is.
const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default supabase;
