
-- Drop the overly permissive RLS policies
DROP POLICY IF EXISTS "Allow public access to sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow public access to events" ON public.events;

-- Create restrictive RLS policies for sessions table
-- Only allow INSERT for tracking new sessions, no read/update/delete access
CREATE POLICY "Allow session creation only" ON public.sessions 
  FOR INSERT 
  WITH CHECK (true);

-- Create restrictive RLS policies for events table  
-- Only allow INSERT for tracking new events, no read/update/delete access
CREATE POLICY "Allow event creation only" ON public.events 
  FOR INSERT 
  WITH CHECK (true);

-- Add RLS policies for contact_submissions table
CREATE POLICY "Allow contact form submissions" ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Create admin role enum for future use
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create profiles table for user management (admin access)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Function to check if user is admin (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Admin-only access policies for analytics data
CREATE POLICY "Admins can read all sessions" ON public.sessions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can read all events" ON public.events 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can read all contact submissions" ON public.contact_submissions 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

-- Function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Remove precise location data by updating the existing sessions
-- This will anonymize existing data by removing lat/long coordinates
UPDATE public.sessions 
SET location = CASE 
  WHEN location IS NOT NULL THEN 
    jsonb_build_object(
      'country', location->>'country',
      'region', location->>'region', 
      'city', location->>'city',
      'timezone', location->>'timezone'
    )
  ELSE location
END
WHERE location IS NOT NULL 
AND (location ? 'latitude' OR location ? 'longitude');
