-- ============================================
-- SECURITY FIX: Contacts Table Protection
-- ============================================
-- This migration adds multiple layers of security to prevent abuse
-- while maintaining anonymous chatbot functionality

-- 1. Add critical NOT NULL constraints
ALTER TABLE public.contacts
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN name SET NOT NULL;

-- 2. Add validation CHECK constraints
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT contacts_email_length CHECK (length(email) >= 5 AND length(email) <= 255),
  ADD CONSTRAINT contacts_name_length CHECK (length(trim(name)) >= 2 AND length(name) <= 100),
  ADD CONSTRAINT contacts_phone_format CHECK (phone IS NULL OR (length(phone) >= 8 AND length(phone) <= 20));

-- 3. Create audit table for tracking insert attempts
CREATE TABLE IF NOT EXISTS public.contact_insert_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT true
);

-- Enable RLS on audit table (admins only)
ALTER TABLE public.contact_insert_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact audit logs"
  ON public.contact_insert_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create validation and rate-limiting function
CREATE OR REPLACE FUNCTION public.validate_contact_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Trim and validate email and name
  NEW.email := lower(trim(NEW.email));
  NEW.name := trim(NEW.name);
  
  -- Check for empty strings after trimming
  IF NEW.email = '' OR NEW.name = '' THEN
    RAISE EXCEPTION 'Email and name cannot be empty';
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
$$;

-- 5. Create trigger for validation
DROP TRIGGER IF EXISTS validate_contact_insert_trigger ON public.contacts;
CREATE TRIGGER validate_contact_insert_trigger
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_insert();

-- 6. Create audit logging trigger
CREATE OR REPLACE FUNCTION public.log_contact_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.contact_insert_audit (email, success)
  VALUES (NEW.email, true);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_contact_insert_trigger ON public.contacts;
CREATE TRIGGER log_contact_insert_trigger
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_insert();

-- 7. Update RLS policy with stricter validation
DROP POLICY IF EXISTS "Anyone can create contacts" ON public.contacts;
CREATE POLICY "Validated users can create contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND name IS NOT NULL 
    AND length(trim(email)) >= 5 
    AND length(trim(name)) >= 2
  );

-- 8. Add documentation comments
COMMENT ON TABLE public.contacts IS 'Customer contact information collected via chatbot. Protected by RLS with rate limiting and validation.';
COMMENT ON POLICY "Validated users can create contacts" ON public.contacts IS 'Allows anonymous users to submit contacts with strict validation and rate limiting (3 per hour per email).';