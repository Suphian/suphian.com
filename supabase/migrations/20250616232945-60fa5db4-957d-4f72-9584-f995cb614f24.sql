
-- Verify and ensure the correct RLS policies are in place
-- First, let's see what policies currently exist and remove any conflicting ones

DO $$
BEGIN
    -- Drop any existing policies that might conflict
    DROP POLICY IF EXISTS "Allow public access to sessions" ON public.sessions;
    DROP POLICY IF EXISTS "Allow session creation only" ON public.sessions;
    DROP POLICY IF EXISTS "Admins can read all sessions" ON public.sessions;
    
    -- Ensure we have the correct policies
    DROP POLICY IF EXISTS "Allow anonymous session tracking" ON public.sessions;
    DROP POLICY IF EXISTS "Admins can read sessions" ON public.sessions;
    
    -- Create the correct policies
    CREATE POLICY "Allow anonymous session tracking" ON public.sessions 
      FOR INSERT 
      WITH CHECK (true);

    CREATE POLICY "Admins can read sessions" ON public.sessions 
      FOR SELECT 
      TO authenticated
      USING (public.is_admin(auth.uid()));
      
    -- Do the same for events table
    DROP POLICY IF EXISTS "Allow public access to events" ON public.events;
    DROP POLICY IF EXISTS "Allow event creation only" ON public.events;
    DROP POLICY IF EXISTS "Admins can read all events" ON public.events;
    
    DROP POLICY IF EXISTS "Allow anonymous event tracking" ON public.events;
    DROP POLICY IF EXISTS "Admins can read events" ON public.events;
    
    CREATE POLICY "Allow anonymous event tracking" ON public.events 
      FOR INSERT 
      WITH CHECK (true);

    CREATE POLICY "Admins can read events" ON public.events 
      FOR SELECT 
      TO authenticated
      USING (public.is_admin(auth.uid()));
END $$;

-- Force a refresh of the policies
NOTIFY pgrst, 'reload schema';
