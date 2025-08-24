-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.rate_limits CASCADE;

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.events;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_session_timestamp();
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();
DROP FUNCTION IF EXISTS public.promote_user_to_admin(TEXT);
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT,
  role TEXT DEFAULT 'user'::text
);

-- Create sessions table for analytics
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  is_internal_user BOOLEAN DEFAULT false,
  visitor_id UUID,
  visit_count INTEGER DEFAULT 1,
  referrer_source TEXT,
  referrer_detail TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  timezone TEXT,
  locale TEXT,
  referrer TEXT,
  landing_url TEXT,
  user_agent TEXT,
  location JSONB
);

-- Create events table for analytics tracking
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID,
  event_name TEXT NOT NULL,
  event_payload JSONB,
  page_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_internal_traffic BOOLEAN DEFAULT false,
  traffic_type TEXT DEFAULT 'external'::text
);

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL
);

-- Create rate_limits table
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Create function to handle new user registration
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

-- Create function to update session timestamps
CREATE OR REPLACE FUNCTION public.update_session_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.sessions 
  SET updated_at = NOW() 
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- Create function to cleanup old rate limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for session timestamp updates
CREATE TRIGGER update_sessions_updated_at
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_session_timestamp();

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create RLS policies for sessions
CREATE POLICY "Public can insert sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read sessions" 
ON public.sessions 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update sessions" 
ON public.sessions 
FOR UPDATE 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- Create RLS policies for events
CREATE POLICY "Public can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read events" 
ON public.events 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create RLS policies for contact submissions
CREATE POLICY "Public can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create RLS policies for rate limits
CREATE POLICY "Allow rate limit inserts" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow rate limit reads" 
ON public.rate_limits 
FOR SELECT 
USING (true);

CREATE POLICY "Allow rate limit updates" 
ON public.rate_limits 
FOR UPDATE 
USING (true) 
WITH CHECK (true);