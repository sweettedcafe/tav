
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Restrict execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Replace permissive public bucket listing with object-level read
DROP POLICY IF EXISTS "Public read datasets" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;

-- Restrict listing: users can read individual files via getPublicUrl, but cannot LIST without authentication
CREATE POLICY "Auth read datasets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'datasets');
CREATE POLICY "Auth read avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Auth read certificates" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificates');
