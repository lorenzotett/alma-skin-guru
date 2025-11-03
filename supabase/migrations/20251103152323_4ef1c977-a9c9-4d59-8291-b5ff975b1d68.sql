-- Allow public (unauthenticated) users to insert contacts
-- Remove the old authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON public.contacts;

-- Create new policy allowing public inserts with proper validation
-- The validation trigger will handle all security checks (rate limiting, format validation, etc.)
CREATE POLICY "Public users can create contacts"
ON public.contacts
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL 
  AND name IS NOT NULL 
  AND length(TRIM(BOTH FROM email)) >= 5 
  AND length(TRIM(BOTH FROM name)) >= 2
);

-- Allow public inserts to contact_products (linked to public contact creation)
DROP POLICY IF EXISTS "Authenticated users can create contact products" ON public.contact_products;

CREATE POLICY "Public users can create contact products"
ON public.contact_products
FOR INSERT
TO public
WITH CHECK (true);

-- Update contacts table to make created_by_user_id nullable and not required
-- since we're now allowing public submissions without authentication
ALTER TABLE public.contacts 
ALTER COLUMN created_by_user_id DROP NOT NULL;