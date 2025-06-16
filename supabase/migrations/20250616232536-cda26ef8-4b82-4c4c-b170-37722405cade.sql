
-- Fix the duplicate is_admin functions and update RLS policies

-- Drop the conflicting is_admin function (the one without parameters)
DROP FUNCTION IF EXISTS public.is_admin();

-- Keep only the parameterized version with SECURITY DEFINER
-- (This one already exists and is working correctly)

-- Drop and recreate the problematic policies to fix any conflicts

-- Fix sessions table policies
DROP POLICY IF EXISTS "Allow anonymous session tracking" ON public.sessions;
DROP POLICY IF EXISTS "Admins can read sessions" ON public.sessions;

CREATE POLICY "Allow anonymous session tracking" ON public.sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read sessions" ON public.sessions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Fix events table policies  
DROP POLICY IF EXISTS "Allow anonymous event tracking" ON public.events;
DROP POLICY IF EXISTS "Admins can read events" ON public.events;

CREATE POLICY "Allow anonymous event tracking" ON public.events 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read events" ON public.events 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Fix contact_submissions policies for consistency
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;

CREATE POLICY "Allow public contact form submissions" ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" ON public.contact_submissions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));
