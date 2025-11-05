-- Update the validation function to allow more submissions during testing
CREATE OR REPLACE FUNCTION public.validate_contact_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- Rate limiting: increased to 10 submissions per email per hour for testing
  SELECT COUNT(*) INTO recent_count
  FROM public.contacts
  WHERE email = NEW.email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Too many submissions. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$function$;