-- Add INSERT policy for profiles to prevent unauthorized profile creation
-- Only allow users to create their own profile with matching auth.uid()
CREATE POLICY "Users can only insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());