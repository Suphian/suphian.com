-- Fix database function security by adding proper search_path protection
-- This prevents search_path injection attacks

-- Update check_rate_limit function to be more secure
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  current_attempts integer := 0;
  window_start_time timestamp with time zone;
BEGIN
  -- Clean up old records first
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Calculate window start time
  window_start_time := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current attempts in the window
  SELECT COALESCE(attempts, 0) INTO current_attempts
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action = p_action 
    AND window_start >= window_start_time;
  
  -- If we've exceeded the limit, return false
  IF current_attempts >= p_max_attempts THEN
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limits (identifier, action, attempts, window_start)
  VALUES (p_identifier, p_action, current_attempts + 1, COALESCE((
    SELECT window_start FROM public.rate_limits 
    WHERE identifier = p_identifier AND action = p_action
  ), NOW()))
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    attempts = public.rate_limits.attempts + 1,
    window_start = CASE 
      WHEN public.rate_limits.window_start < window_start_time THEN NOW()
      ELSE public.rate_limits.window_start
    END;
  
  RETURN true;
END;
$function$;

-- Update anonymize_ip function
CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_address text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
BEGIN
  -- For IPv4, mask the last octet
  IF ip_address ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$' THEN
    RETURN regexp_replace(ip_address, '\.([0-9]{1,3})$', '.0');
  END IF;
  
  -- For IPv6, mask the last 64 bits
  IF ip_address ~ '^([0-9a-fA-F]*:){2,7}[0-9a-fA-F]*$' THEN
    RETURN regexp_replace(ip_address, ':[0-9a-fA-F]*:[0-9a-fA-F]*:[0-9a-fA-F]*:[0-9a-fA-F]*$', '::0000');
  END IF;
  
  -- If format is unrecognized, return NULL for privacy
  RETURN NULL;
END;
$function$;

-- Update cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Delete sessions older than 90 days
  DELETE FROM public.sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete events older than 90 days
  DELETE FROM public.events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old rate limit records
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$function$;

-- Update verify_admin_access function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_id uuid;
  user_role text;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Return false if not authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists in profiles and has admin role
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Return true only if user has explicit admin role
  RETURN (user_role = 'admin');
END;
$function$;

-- Update get_contact_submissions function
CREATE OR REPLACE FUNCTION public.get_contact_submissions()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, name text, email text, phone text, subject text, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Verify admin access before returning any data
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return contact submissions only if admin verified
  RETURN QUERY
  SELECT cs.id, cs.created_at, cs.name, cs.email, cs.phone, cs.subject, cs.message
  FROM public.contact_submissions cs
  ORDER BY cs.created_at DESC;
END;
$function$;

-- Update get_analytics_sessions function
CREATE OR REPLACE FUNCTION public.get_analytics_sessions(limit_count integer DEFAULT 100, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, session_id uuid, created_at timestamp with time zone, visitor_id uuid, visit_count integer, country text, city text, referrer_source text, utm_source text, utm_medium text, utm_campaign text, browser text, os text, device_type text, is_internal_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update get_analytics_events function
CREATE OR REPLACE FUNCTION public.get_analytics_events(limit_count integer DEFAULT 100, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, session_id uuid, event_name text, page_url text, created_at timestamp with time zone, traffic_type text, is_internal_traffic boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update update_session_timestamp function
CREATE OR REPLACE FUNCTION public.update_session_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.sessions 
  SET updated_at = NOW() 
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$function$;

-- Update promote_user_to_admin function
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
$function$;

-- Update cleanup_old_rate_limits function
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$function$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$function$;