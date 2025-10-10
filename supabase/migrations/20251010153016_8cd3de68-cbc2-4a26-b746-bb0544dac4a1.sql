-- =====================================================
-- COMPREHENSIVE SECURITY FIXES
-- =====================================================

-- 1. FIX CONVERSATIONS TABLE - Add user_id for proper isolation
ALTER TABLE public.conversations 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);

-- Update RLS policies for conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.conversations;

-- New policies with proper user isolation
CREATE POLICY "Users can create their own conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX CONTACTS TABLE - Add user tracking
ALTER TABLE public.contacts 
ADD COLUMN created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_contacts_created_by ON public.contacts(created_by_user_id);

-- Update INSERT policy to track creator
DROP POLICY IF EXISTS "Validated users can create contacts" ON public.contacts;

CREATE POLICY "Authenticated users can create contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid() AND
  email IS NOT NULL AND 
  name IS NOT NULL AND 
  length(TRIM(BOTH FROM email)) >= 5 AND 
  length(TRIM(BOTH FROM name)) >= 2
);

-- Add policy for users to view their own contacts
CREATE POLICY "Users can view their own contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 3. COMPREHENSIVE INPUT VALIDATION - Enhanced trigger
CREATE OR REPLACE FUNCTION public.validate_contact_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_count integer;
  email_regex text := '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$';
  temp_domains text[] := ARRAY['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email', 'mailinator.com'];
  email_domain text;
BEGIN
  -- Trim and validate email and name
  NEW.email := lower(trim(NEW.email));
  NEW.name := trim(NEW.name);
  
  -- Validate field lengths
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be less than 255 characters';
  END IF;
  
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be less than 100 characters';
  END IF;
  
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 20 THEN
    RAISE EXCEPTION 'Phone number must be less than 20 characters';
  END IF;
  
  -- Check for empty strings after trimming
  IF NEW.email = '' OR NEW.name = '' THEN
    RAISE EXCEPTION 'Email and name cannot be empty';
  END IF;
  
  -- Email format validation using regex
  IF NEW.email !~ email_regex THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Block temporary email domains
  email_domain := split_part(NEW.email, '@', 2);
  IF email_domain = ANY(temp_domains) THEN
    RAISE EXCEPTION 'Temporary email addresses are not allowed';
  END IF;
  
  -- Phone format validation (if provided)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF NOT (regexp_replace(NEW.phone, '\s', '', 'g') ~ '^[\+]?[0-9]{7,15}$') THEN
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;
  
  -- Validate text fields lengths
  IF NEW.additional_info IS NOT NULL AND length(NEW.additional_info) > 1000 THEN
    RAISE EXCEPTION 'Additional info must be less than 1000 characters';
  END IF;
  
  IF NEW.product_type IS NOT NULL AND length(NEW.product_type) > 500 THEN
    RAISE EXCEPTION 'Product type must be less than 500 characters';
  END IF;
  
  IF NEW.skin_type IS NOT NULL AND length(NEW.skin_type) > 200 THEN
    RAISE EXCEPTION 'Skin type must be less than 200 characters';
  END IF;
  
  -- Rate limiting: max 3 submissions per email per hour
  SELECT COUNT(*) INTO recent_count
  FROM public.contacts
  WHERE email = NEW.email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many submissions. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. FIX SQL INJECTION IN LOG FUNCTION
CREATE OR REPLACE FUNCTION public.log_contact_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use parameterized insert to prevent SQL injection
  INSERT INTO public.contact_insert_audit (email, success)
  VALUES (NEW.email, true);
  
  RETURN NEW;
END;
$function$;

-- 5. ADMIN AUDIT LOGGING - Create audit table
CREATE TABLE IF NOT EXISTS public.admin_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  action text NOT NULL,
  record_id uuid,
  details jsonb,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Create index for performance
CREATE INDEX idx_admin_audit_user ON public.admin_access_audit(admin_user_id);
CREATE INDEX idx_admin_audit_table ON public.admin_access_audit(table_name);
CREATE INDEX idx_admin_audit_time ON public.admin_access_audit(accessed_at DESC);

-- Enable RLS on audit table
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_access_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert audit logs (for application-level logging)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.admin_access_audit
FOR INSERT
TO authenticated
WITH CHECK (admin_user_id = auth.uid());

-- Create helper function for manual audit logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_table_name text,
  p_action text,
  p_record_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.admin_access_audit (
      admin_user_id,
      table_name,
      action,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      p_table_name,
      p_action,
      p_record_id,
      p_details
    );
  END IF;
END;
$function$;