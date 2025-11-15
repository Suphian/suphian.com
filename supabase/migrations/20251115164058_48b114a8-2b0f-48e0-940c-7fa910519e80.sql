-- Allow anonymous users to insert contact submissions
CREATE POLICY "Allow anonymous contact form submissions"
ON public.contact_submissions
FOR INSERT
TO anon
WITH CHECK (true);