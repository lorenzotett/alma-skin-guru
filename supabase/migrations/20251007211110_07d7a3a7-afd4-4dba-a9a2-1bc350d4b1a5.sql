-- Update function to assign admin role to both admin emails
CREATE OR REPLACE FUNCTION public.handle_admin_user_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user email is one of the admin emails, assign admin role
  IF NEW.email IN ('admin@admin.com', 'info@almanaturalbeauty.it') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;