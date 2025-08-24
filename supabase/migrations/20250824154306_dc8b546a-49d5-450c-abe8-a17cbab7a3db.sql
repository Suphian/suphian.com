-- Fix critical rate limiting security vulnerability
-- Drop the overly permissive policies that allow anyone to manipulate rate limits
DROP POLICY IF EXISTS "Allow rate limit inserts" ON public.rate_limits;
DROP POLICY IF EXISTS "Allow rate limit reads" ON public.rate_limits;
DROP POLICY IF EXISTS "Allow rate limit updates" ON public.rate_limits;

-- Create secure rate limiting policies that only allow system access
-- Only allow service role to manage rate limits
CREATE POLICY "System can manage rate limits" ON public.rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- Create a secure server-side function for rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 60
) RETURNS boolean
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

-- Add unique constraint to prevent duplicate entries
ALTER TABLE public.rate_limits 
ADD CONSTRAINT unique_identifier_action UNIQUE (identifier, action);

-- Create function to anonymize IP addresses for privacy
CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
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

-- Create data retention function to automatically clean old data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;