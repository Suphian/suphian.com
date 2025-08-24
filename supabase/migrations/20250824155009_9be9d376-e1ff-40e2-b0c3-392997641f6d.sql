-- Comprehensive security fixes for user privacy data protection

-- 1. Add explicit restrictive policies for sessions table to protect user privacy data
DROP POLICY IF EXISTS "Public can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON public.sessions;

-- Create secure policies for sessions table
CREATE POLICY "Allow anonymous session creation" 
ON public.sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only verified admins can read session data" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

CREATE POLICY "Only verified admins can update session data" 
ON public.sessions 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

CREATE POLICY "Deny all session deletions" 
ON public.sessions 
FOR DELETE 
TO authenticated 
USING (false);

-- 2. Add explicit restrictive policies for events table to protect user tracking data
DROP POLICY IF EXISTS "Public can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can read events" ON public.events;

-- Create secure policies for events table
CREATE POLICY "Allow anonymous event creation" 
ON public.events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only verified admins can read event data" 
ON public.events 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

CREATE POLICY "Deny all event modifications" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Deny all event deletions" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (false);

-- 3. Security harden existing database functions with proper search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text, 
  p_action text, 
  p_max_attempts integer DEFAULT 5, 
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
    attempts = rate_limits.attempts + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start_time THEN NOW()
      ELSE rate_limits.window_start
    END;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
$$;

-- 4. Add security logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  access_type text,
  table_name text,
  user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log access to sensitive data for audit purposes
  INSERT INTO public.events (
    session_id,
    event_name,
    event_payload,
    is_internal_traffic,
    traffic_type
  ) VALUES (
    gen_random_uuid(),
    'sensitive_data_access',
    jsonb_build_object(
      'access_type', access_type,
      'table_name', table_name,
      'user_id', user_id,
      'timestamp', NOW()
    ),
    true,
    'internal'
  );
END;
$$;