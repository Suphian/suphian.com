
import { createClient } from "@supabase/supabase-js";

// Use project-specific values from the system context
const supabaseUrl = "https://ujughujunixnwlmtdsxd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdWdodWp1bml4bndsbXRkc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzM2NDMsImV4cCI6MjA1OTU0OTY0M30.cYdp-7I8DBOl2rkR0yQXHSsaZGLQgkhFlqqOYqJ8JeA";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  }
});

export default supabase;
