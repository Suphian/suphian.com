-- Fix RLS policies to allow anonymous analytics tracking
DROP POLICY IF EXISTS "Allow session creation for analytics" ON public.sessions;
DROP POLICY IF EXISTS "Allow event tracking for analytics" ON public.events;

-- Create proper RLS policies for anonymous analytics
CREATE POLICY "Enable anonymous session tracking" 
ON public.sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable anonymous event tracking" 
ON public.events 
FOR INSERT 
TO anon, authenticated  
WITH CHECK (true);

-- Enhance sessions table with advanced tracking fields
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS visitor_id uuid,
ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS referrer_source text,
ADD COLUMN IF NOT EXISTS referrer_detail text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS country text;

-- Create index for better performance on visitor tracking
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_internal ON public.sessions(is_internal_user);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);