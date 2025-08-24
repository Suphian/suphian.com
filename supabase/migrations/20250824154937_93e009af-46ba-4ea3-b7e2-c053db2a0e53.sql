-- Fix critical privacy vulnerability in analytics tables
-- Add explicit policies to deny public access to user tracking data

-- First, handle the sessions table privacy protection
-- Drop existing admin read policy to recreate with explicit denial
DROP POLICY IF EXISTS "Admins can read sessions" ON public.sessions;

-- Create explicit deny policy for public access to sessions
CREATE POLICY "Deny public access to user sessions" 
ON public.sessions 
FOR SELECT 
TO anon
USING (false);

-- Create restrictive admin-only read policy for sessions
CREATE POLICY "Only verified admins can read sessions" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (
  -- Explicitly check that user is authenticated AND is admin
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

-- Now handle the events table privacy protection
-- Drop existing admin read policy to recreate with explicit denial
DROP POLICY IF EXISTS "Admins can read events" ON public.events;

-- Create explicit deny policy for public access to events
CREATE POLICY "Deny public access to user events" 
ON public.events 
FOR SELECT 
TO anon
USING (false);

-- Create restrictive admin-only read policy for events
CREATE POLICY "Only verified admins can read events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (
  -- Explicitly check that user is authenticated AND is admin
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

-- Add a secure function for admin analytics access
CREATE OR REPLACE FUNCTION public.get_analytics_sessions(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  session_id uuid,
  created_at timestamptz,
  visitor_id uuid,
  visit_count integer,
  country text,
  city text,
  referrer_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  browser text,
  os text,
  device_type text,
  is_internal_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verify admin access before returning any analytics data
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required for analytics data';
  END IF;
  
  -- Return sessions data with privacy-safe fields only
  RETURN QUERY
  SELECT 
    s.id, 
    s.session_id, 
    s.created_at, 
    s.visitor_id, 
    s.visit_count,
    s.country, 
    s.city, 
    s.referrer_source,
    s.utm_source, 
    s.utm_medium, 
    s.utm_campaign,
    s.browser, 
    s.os, 
    s.device_type,
    s.is_internal_user
  FROM public.sessions s
  ORDER BY s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Add a secure function for admin events access
CREATE OR REPLACE FUNCTION public.get_analytics_events(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  session_id uuid,
  event_name text,
  page_url text,
  created_at timestamptz,
  traffic_type text,
  is_internal_traffic boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verify admin access before returning any events data
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required for events data';
  END IF;
  
  -- Return events data with privacy-safe fields only
  RETURN QUERY
  SELECT 
    e.id,
    e.session_id,
    e.event_name,
    e.page_url,
    e.created_at,
    e.traffic_type,
    e.is_internal_traffic
  FROM public.events e
  ORDER BY e.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;