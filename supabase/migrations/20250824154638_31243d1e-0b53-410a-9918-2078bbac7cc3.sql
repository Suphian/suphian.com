-- Fix critical security vulnerability in contact_submissions table
-- The current policy allows authenticated users to potentially read submissions if is_admin() returns null

-- Drop the existing insecure policies
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Public can submit contact forms" ON public.contact_submissions;

-- Create a secure admin-only read policy that explicitly denies non-admin access
CREATE POLICY "Only verified admins can read contact submissions" 
ON public.contact_submissions 
FOR SELECT 
TO authenticated
USING (
  -- Explicitly check that user is authenticated AND is admin
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid()) = true
);

-- Create a secure insert policy for public contact form submissions
CREATE POLICY "Allow public contact form submissions" 
ON public.contact_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Ensure required fields are present and valid
  name IS NOT NULL 
  AND email IS NOT NULL 
  AND message IS NOT NULL
  AND length(trim(name)) >= 2
  AND length(trim(email)) >= 5
  AND length(trim(message)) >= 10
);

-- Add a policy to completely deny UPDATE and DELETE operations for extra security
CREATE POLICY "Deny all modifications to contact submissions" 
ON public.contact_submissions 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Deny all deletions of contact submissions" 
ON public.contact_submissions 
FOR DELETE 
TO authenticated 
USING (false);

-- Create an enhanced admin check function that's more secure
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Add a function for secure contact submission viewing (admin only)
CREATE OR REPLACE FUNCTION public.get_contact_submissions()
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  name text,
  email text,
  phone text,
  subject text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;