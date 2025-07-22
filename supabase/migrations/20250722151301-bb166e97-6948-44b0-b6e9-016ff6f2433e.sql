-- Fix security vulnerabilities: Set search_path for existing database functions

-- Fix update_session_timestamp function
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

-- Fix cleanup_old_rate_limits function
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

-- Drop functions that reference non-existent profiles table
DROP FUNCTION IF EXISTS public.promote_user_to_admin(text);
DROP FUNCTION IF EXISTS public.is_admin(uuid);