-- Fix analytics permissions

-- 1. Make the trigger function SECURITY DEFINER so it can update sessions without requiring public UPDATE permissions
CREATE OR REPLACE FUNCTION public.update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sessions 
  SET updated_at = NOW() 
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow anonymous users to insert sessions
-- Drop potentially conflicting policies first
DROP POLICY IF EXISTS "Allow anonymous session creation" ON public.sessions;
DROP POLICY IF EXISTS "Public can insert sessions" ON public.sessions;

CREATE POLICY "Allow anonymous session creation"
ON public.sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Allow anonymous users to insert events
DROP POLICY IF EXISTS "Allow anonymous event creation" ON public.events;
DROP POLICY IF EXISTS "Public can insert events" ON public.events;

CREATE POLICY "Allow anonymous event creation"
ON public.events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
