-- Step 1: Create the role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Step 2: Create the user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Update contact_submissions policies
DROP POLICY IF EXISTS "Only verified admins can read contact submissions" ON public.contact_submissions;
CREATE POLICY "Only verified admins can read contact submissions"
ON public.contact_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Step 5: Update events policies (consolidate duplicate policies)
DROP POLICY IF EXISTS "Only verified admins can read events" ON public.events;
DROP POLICY IF EXISTS "Only verified admins can read event data" ON public.events;
CREATE POLICY "Only verified admins can read events"
ON public.events
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Step 6: Update sessions policies (consolidate duplicate policies)
DROP POLICY IF EXISTS "Only verified admins can read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Only verified admins can read session data" ON public.sessions;
CREATE POLICY "Only verified admins can read sessions"
ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Only verified admins can update session data" ON public.sessions;
CREATE POLICY "Only verified admins can update session data"
ON public.sessions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Step 7: Update profiles policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Step 8: Drop the old is_admin function
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Step 9: Remove the role column from profiles (fixes privilege escalation vulnerability)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 10: Update the handle_new_user trigger to not assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (
    NEW.id,
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Step 11: Drop the old promote_user_to_admin function
DROP FUNCTION IF EXISTS public.promote_user_to_admin(text);

-- Step 12: Create new secure promote function for user_roles table
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

-- Step 13: Add explicit deny policies for defense-in-depth
DROP POLICY IF EXISTS "Deny public read access to contact submissions" ON public.contact_submissions;
CREATE POLICY "Deny public read access to contact submissions"
ON public.contact_submissions
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Deny public read access to sessions" ON public.sessions;
CREATE POLICY "Deny public read access to sessions"
ON public.sessions
FOR SELECT
USING (false);

-- Step 14: Add RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));