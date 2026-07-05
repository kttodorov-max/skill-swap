-- SkillSwap Storage: avatars + skill-images buckets with RLS policies
-- Path convention: {user_id}/filename.ext  (e.g. avatars/550e8400-e29b.../avatar.jpg)

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'skill-images',
    'skill-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Helper: first folder in object path must match auth user id
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.storage_user_owns_path(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (storage.foldername(object_name))[1] = auth.uid()::text;
$$;

GRANT EXECUTE ON FUNCTION public.storage_user_owns_path(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- avatars policies
-- ---------------------------------------------------------------------------

CREATE POLICY "avatars_select_public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.storage_user_owns_path(name)
  );

CREATE POLICY "avatars_update_own_or_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  );

CREATE POLICY "avatars_delete_own_or_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- skill-images policies
-- ---------------------------------------------------------------------------

CREATE POLICY "skill_images_select_public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'skill-images');

CREATE POLICY "skill_images_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'skill-images'
    AND public.storage_user_owns_path(name)
  );

CREATE POLICY "skill_images_update_own_or_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'skill-images'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'skill-images'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  );

CREATE POLICY "skill_images_delete_own_or_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'skill-images'
    AND (public.storage_user_owns_path(name) OR public.is_admin())
  );
