
CREATE OR REPLACE FUNCTION public.public_certificate_for_user(_user_id uuid)
RETURNS TABLE (certificate_code text, recipient_name text, program_name text, issued_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT certificate_code, recipient_name, program_name, issued_at
  FROM public.certificates
  WHERE user_id = _user_id AND revoked_at IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.public_certificate_for_user(uuid) TO anon, authenticated;
