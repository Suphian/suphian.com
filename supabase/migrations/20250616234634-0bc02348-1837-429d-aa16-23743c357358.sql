
-- Check current RLS policies and fix the sessions table
-- Let's ensure RLS is properly configured for anonymous access

-- First, let's check if RLS is enabled (it should be)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('sessions', 'events');

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous session tracking" ON public.sessions;
DROP POLICY IF EXISTS "Admins can read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow anonymous event tracking" ON public.events;
DROP POLICY IF EXISTS "Admins can read events" ON public.events;

-- For sessions table: Allow anyone to INSERT (for analytics)
CREATE POLICY "Enable insert for anonymous users" ON public.sessions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- For sessions table: Allow admins to SELECT
CREATE POLICY "Enable read for admin users" ON public.sessions
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- For events table: Allow anyone to INSERT (for analytics)  
CREATE POLICY "Enable insert for anonymous users" ON public.events
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- For events table: Allow admins to SELECT
CREATE POLICY "Enable read for admin users" ON public.events
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Ensure the anon role has the necessary permissions
GRANT INSERT ON public.sessions TO anon;
GRANT INSERT ON public.events TO anon;
