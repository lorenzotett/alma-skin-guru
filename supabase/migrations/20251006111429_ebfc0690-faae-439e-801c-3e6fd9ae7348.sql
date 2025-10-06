-- Fix critical security issues

-- 1. Create user roles system for proper admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
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

-- Allow users to read their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix contacts table security - CRITICAL
-- Drop existing permissive policy
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to contacts"
ON public.contacts FOR SELECT
TO anon
USING (false);

-- Only authenticated admins can view contacts
CREATE POLICY "Admins can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update contacts
CREATE POLICY "Admins can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete contacts
CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep INSERT open for chatbot functionality (anonymous users can submit)
-- This is already set correctly

-- 3. Fix contact_products table security
DROP POLICY IF EXISTS "Anyone can view contact products" ON public.contact_products;

-- Only authenticated admins can view contact-product relationships
CREATE POLICY "Admins can view contact products"
ON public.contact_products FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep INSERT open for chatbot results page
-- This is already set correctly

-- 4. Fix conversations table security
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.conversations;

-- Only authenticated admins can view conversations
CREATE POLICY "Admins can view conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep INSERT open for chatbot if needed
-- This is already set correctly

-- 5. Fix email_logs table security
DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;

-- Only authenticated admins can view email logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert email logs (for edge functions)
CREATE POLICY "System can create email logs"
ON public.email_logs FOR INSERT
WITH CHECK (true);

-- Only admins can update email logs
CREATE POLICY "Admins can update email logs"
ON public.email_logs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Prevent deletion for audit trail
CREATE POLICY "Prevent email log deletion"
ON public.email_logs FOR DELETE
TO authenticated
USING (false);

-- 6. Remove unsafe admin_users table
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 7. Add input validation constraints
ALTER TABLE public.contacts
ADD CONSTRAINT valid_email_length CHECK (length(email) <= 255);

ALTER TABLE public.contacts
ADD CONSTRAINT valid_name_length CHECK (length(name) <= 100);

ALTER TABLE public.contacts
ADD CONSTRAINT valid_phone_length CHECK (phone IS NULL OR length(phone) <= 20);

ALTER TABLE public.contacts
ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 13 AND age <= 120));