
-- Fix RLS policies to allow proper analytics data collection
-- Use the specific is_admin function signature to avoid conflicts

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Allow session creation only" ON public.sessions;
DROP POLICY IF EXISTS "Allow event creation only" ON public.events;
DROP POLICY IF EXISTS "Allow rate limit tracking" ON public.rate_limits;

-- Create new policies that allow anonymous users to insert analytics data
-- but only allow admins to read it

-- Sessions table policies
CREATE POLICY "Allow anonymous session tracking" ON public.sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read sessions" ON public.sessions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Events table policies  
CREATE POLICY "Allow anonymous event tracking" ON public.events 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read events" ON public.events 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Rate limits table policies
CREATE POLICY "Allow anonymous rate limit tracking" ON public.rate_limits 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous rate limit reading" ON public.rate_limits 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage rate limits" ON public.rate_limits 
  FOR ALL 
  TO authenticated
  USING (public.is_admin(auth.uid()));
