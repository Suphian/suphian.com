// Production always talks to Supabase. Locally the contact pipeline is a dry
// run unless VITE_LIVE_BACKEND=true is set (e.g. in .env.local).
export const LIVE = import.meta.env.PROD || import.meta.env.VITE_LIVE_BACKEND === 'true';

// Public by design: the anon key only grants what row-level security allows.
export const SUPABASE_URL = 'https://ujughujunixnwlmtdsxd.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdWdodWp1bml4bndsbXRkc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzM2NDMsImV4cCI6MjA1OTU0OTY0M30.cYdp-7I8DBOl2rkR0yQXHSsaZGLQgkhFlqqOYqJ8JeA';

let client = null;

// supabase-js is imported on first use (a contact submit), so it never lands in
// the initial bundle.
export function getSupabase() {
  if (!client) {
    client = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }),
      )
      .catch((error) => {
        client = null;
        throw error;
      });
  }
  return client;
}
