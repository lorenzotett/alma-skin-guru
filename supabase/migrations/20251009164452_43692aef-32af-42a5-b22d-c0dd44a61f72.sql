-- Add SELECT policy to protect sensitive customer data in contacts table
-- This ensures only authenticated admins can view contact records
CREATE POLICY "Only admins can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));