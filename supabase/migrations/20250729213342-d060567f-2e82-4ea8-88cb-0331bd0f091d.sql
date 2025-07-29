-- Fix RLS policies for anonymous session and event tracking

-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Enable anonymous session tracking" ON public.sessions;
DROP POLICY IF EXISTS "Enable anonymous event tracking" ON public.events;

-- Create proper policies for anonymous tracking
CREATE POLICY "Allow anonymous session inserts" 
ON public.sessions 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow anonymous event inserts" 
ON public.events 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Also ensure the sessions can be updated for timestamp tracking
CREATE POLICY "Allow session updates" 
ON public.sessions 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);