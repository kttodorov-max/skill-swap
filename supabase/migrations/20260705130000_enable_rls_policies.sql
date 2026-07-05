-- SkillSwap Row Level Security policies

-- ---------------------------------------------------------------------------
-- Helper: check if current user is admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on all public tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "categories_insert_admin"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_update_admin"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_delete_admin"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------

CREATE POLICY "skills_select_public_or_own"
  ON public.skills
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "skills_insert_own"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "skills_update_own_or_admin"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "skills_delete_own_or_admin"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ---------------------------------------------------------------------------
-- swap_requests (participants only)
-- ---------------------------------------------------------------------------

CREATE POLICY "swap_requests_select_participants_or_admin"
  ON public.swap_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "swap_requests_insert_as_requester"
  ON public.swap_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_id <> recipient_id
    AND EXISTS (
      SELECT 1
      FROM public.skills
      WHERE id = offered_skill_id
        AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.skills
      WHERE id = requested_skill_id
        AND user_id = recipient_id
    )
  );

CREATE POLICY "swap_requests_update_participants_or_admin"
  ON public.swap_requests
  FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    requester_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "swap_requests_delete_participants_or_admin"
  ON public.swap_requests
  FOR DELETE
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin()
  );
