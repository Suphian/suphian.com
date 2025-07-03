-- Security Fix Migration: Phase 1 - Fix RLS Policies Only

-- First, drop all conflicting policies to start clean
DROP POLICY IF EXISTS "Anyone can insert contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;

DROP POLICY IF EXISTS "Allow anonymous rate limit tracking" ON public.rate_limits;
DROP POLICY IF EXISTS "Allow anonymous rate limit reading" ON public.rate_limits;
DROP POLICY IF EXISTS "Admins can read rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Admins can manage rate limits" ON public.rate_limits;

DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.sessions;
DROP POLICY IF EXISTS "Enable read for admin users" ON public.sessions;

DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.events;
DROP POLICY IF EXISTS "Enable read for admin users" ON public.events;

-- Create clean, non-conflicting policies

-- Contact submissions: Allow public submissions, admin read access
CREATE POLICY "Public can submit contact forms" ON public.contact_submissions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" ON public.contact_submissions
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Sessions: Allow anonymous session creation for analytics, admin read access
CREATE POLICY "Allow session creation for analytics" ON public.sessions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read sessions" ON public.sessions
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Events: Allow anonymous event tracking, admin read access
CREATE POLICY "Allow event tracking for analytics" ON public.events
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read events" ON public.events
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Rate limits: Separate policies for different operations
CREATE POLICY "Allow rate limit inserts" ON public.rate_limits
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow rate limit reads" ON public.rate_limits
  FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow rate limit updates" ON public.rate_limits
  FOR UPDATE 
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.sessions TO anon;
GRANT INSERT ON public.events TO anon;
GRANT INSERT ON public.contact_submissions TO anon;
GRANT ALL ON public.rate_limits TO anon;