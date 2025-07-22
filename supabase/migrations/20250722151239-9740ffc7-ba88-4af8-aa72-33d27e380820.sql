-- Fix security vulnerabilities: Set search_path for database functions

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

-- Fix promote_user_to_admin function  
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

-- Fix is_admin function
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