-- Fix contacts table RLS policies
-- Remove the redundant "Deny anonymous access to contacts" policy
-- It's unnecessary because RLS is deny-by-default, and the "Admins can view all contacts" 
-- policy already restricts SELECT to admins only
DROP POLICY IF EXISTS "Deny anonymous access to contacts" ON public.contacts;

-- The remaining policies provide clear security:
-- 1. "Anyone can create contacts" - Allows lead generation (business requirement)
-- 2. "Admins can view all contacts" - Only admins can SELECT
-- 3. "Admins can update contacts" - Only admins can UPDATE
-- 4. "Admins can delete contacts" - Only admins can DELETE

-- Fix email_logs INSERT policy to restrict to service role only
-- Drop the overly permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "System can create email logs" ON public.email_logs;

-- Create a new policy that only allows service role (backend/edge functions) to insert
CREATE POLICY "Service role can create email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Note: The conversations table allows anonymous INSERT which is acceptable for chatbot functionality
-- but consider adding rate limiting at the application layer to prevent abuse