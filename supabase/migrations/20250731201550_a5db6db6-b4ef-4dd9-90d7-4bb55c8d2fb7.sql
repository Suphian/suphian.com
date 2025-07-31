-- Fix sessions table: session_id should have a default value since it's required
ALTER TABLE public.sessions 
ALTER COLUMN session_id SET DEFAULT gen_random_uuid();

-- Also fix events table to ensure session_id can be provided
-- Check if events table has similar issues with required fields
ALTER TABLE public.events 
ALTER COLUMN session_id DROP NOT NULL;