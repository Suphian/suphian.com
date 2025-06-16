
-- Fix critical RLS policy conflicts and database issues

-- First, drop all conflicting policies on contact_submissions
DROP POLICY IF EXISTS "Allow contact form submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Users can insert contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Only admin can select contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can read all contact submissions" ON public.contact_submissions;

-- Create clean, single-purpose policies for contact_submissions
CREATE POLICY "Allow public contact form submissions" ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" ON public.contact_submissions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

-- Fix the events table foreign key constraint issue
-- The current constraint references session_id but should reference the sessions table properly
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_session_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES public.sessions(session_id) 
  ON DELETE CASCADE;

-- Add an index to improve session lookup performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id_lookup ON public.sessions(session_id);

-- Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- 'login_attempt', 'contact_form', etc
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for rate limiting (needed for anonymous users)
CREATE POLICY "Allow rate limit tracking" ON public.rate_limits 
  FOR INSERT 
  WITH CHECK (true);

-- Only admins can read rate limit data
CREATE POLICY "Admins can read rate limits" ON public.rate_limits 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

-- Add cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;
