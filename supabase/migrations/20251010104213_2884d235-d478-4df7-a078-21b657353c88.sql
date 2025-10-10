-- Phase 2: Fix insecure database policies

-- Fix conversations table: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add missing UPDATE policy (admin only)
CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add missing DELETE policy (admin only)
CREATE POLICY "Admins can delete conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix contact_products table: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can create contact products" ON public.contact_products;

CREATE POLICY "Authenticated users can create contact products"
ON public.contact_products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Phase 5: Add explicit denial policies for defense-in-depth

-- Contacts table: Deny anonymous SELECT
CREATE POLICY "Deny anonymous access to contacts"
ON public.contacts
FOR SELECT
TO anon
USING (false);

-- Email logs table: Deny anonymous SELECT
CREATE POLICY "Deny anonymous access to email logs"
ON public.email_logs
FOR SELECT
TO anon
USING (false);

-- Contact audit table: Deny anonymous SELECT
CREATE POLICY "Deny anonymous access to contact audit"
ON public.contact_insert_audit
FOR SELECT
TO anon
USING (false);