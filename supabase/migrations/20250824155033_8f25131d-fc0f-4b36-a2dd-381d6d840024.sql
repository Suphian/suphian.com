-- Create profiles table and implement comprehensive security fixes

-- 1. Create profiles table for user role management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can read their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Create trigger for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add explicit restrictive policies for sessions table to protect user privacy data
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
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only verified admins can update session data" 
ON public.sessions 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Deny all session deletions" 
ON public.sessions 
FOR DELETE 
TO authenticated 
USING (false);

-- 3. Add explicit restrictive policies for events table to protect user tracking data
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
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
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

-- 4. Update admin check functions to use the new profiles table
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