-- Security Fix Migration: Resolve RLS Issues and Clean Up Policies

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

-- Rate limits: Simplified policies for functionality
CREATE POLICY "Allow rate limit operations" ON public.rate_limits
  FOR ALL 
  TO anon, authenticated
  WITH CHECK (true)
  USING (true);

-- Add database constraints for security
ALTER TABLE public.sessions 
  ADD CONSTRAINT check_screen_dimensions 
  CHECK (screen_width >= 0 AND screen_width <= 10000 AND screen_height >= 0 AND screen_height <= 10000);

ALTER TABLE public.sessions 
  ADD CONSTRAINT check_viewport_dimensions 
  CHECK (viewport_width >= 0 AND viewport_width <= 10000 AND viewport_height >= 0 AND viewport_height <= 10000);

ALTER TABLE public.contact_submissions 
  ADD CONSTRAINT check_email_format 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.contact_submissions 
  ADD CONSTRAINT check_message_length 
  CHECK (length(message) >= 10 AND length(message) <= 5000);

ALTER TABLE public.contact_submissions 
  ADD CONSTRAINT check_name_length 
  CHECK (length(name) >= 2 AND length(name) <= 100);

-- Add validation function for event payloads
CREATE OR REPLACE FUNCTION validate_event_payload()
RETURNS TRIGGER AS $$
BEGIN
  -- Limit event payload size to 10KB
  IF pg_column_size(NEW.event_payload) > 10240 THEN
    RAISE EXCEPTION 'Event payload too large (max 10KB)';
  END IF;
  
  -- Sanitize event name
  IF NEW.event_name !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid event name format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_event_trigger ON public.events;
CREATE TRIGGER validate_event_trigger 
  BEFORE INSERT ON public.events 
  FOR EACH ROW 
  EXECUTE FUNCTION validate_event_payload();

-- Grant necessary permissions
GRANT INSERT ON public.sessions TO anon;
GRANT INSERT ON public.events TO anon;
GRANT INSERT ON public.contact_submissions TO anon;
GRANT ALL ON public.rate_limits TO anon;