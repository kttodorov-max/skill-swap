-- SkillSwap core schema: profiles, user_roles, categories, skills, swap_requests

-- ---------------------------------------------------------------------------
-- Custom types
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.skill_type AS ENUM ('teach', 'learn');
CREATE TYPE public.swap_request_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'completed'
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3)
);

CREATE INDEX profiles_username_idx ON public.profiles (username);

-- ---------------------------------------------------------------------------
-- user_roles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_roles_role_idx ON public.user_roles (role);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX categories_slug_idx ON public.categories (slug);

-- ---------------------------------------------------------------------------
-- skills (N:1 profiles, N:1 categories)
-- ---------------------------------------------------------------------------

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type public.skill_type NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skills_title_length CHECK (char_length(title) >= 2)
);

CREATE INDEX skills_user_id_idx ON public.skills (user_id);
CREATE INDEX skills_category_id_idx ON public.skills (category_id);
CREATE INDEX skills_type_idx ON public.skills (type);
CREATE INDEX skills_is_active_idx ON public.skills (is_active);
CREATE INDEX skills_created_at_idx ON public.skills (created_at DESC);

-- ---------------------------------------------------------------------------
-- swap_requests
-- ---------------------------------------------------------------------------

CREATE TABLE public.swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  offered_skill_id UUID NOT NULL REFERENCES public.skills (id) ON DELETE CASCADE,
  requested_skill_id UUID NOT NULL REFERENCES public.skills (id) ON DELETE CASCADE,
  message TEXT,
  status public.swap_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT swap_requests_different_users CHECK (requester_id <> recipient_id)
);

CREATE INDEX swap_requests_requester_id_idx ON public.swap_requests (requester_id);
CREATE INDEX swap_requests_recipient_id_idx ON public.swap_requests (recipient_id);
CREATE INDEX swap_requests_status_idx ON public.swap_requests (status);
CREATE INDEX swap_requests_created_at_idx ON public.swap_requests (created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed categories
-- ---------------------------------------------------------------------------

INSERT INTO public.categories (name, slug) VALUES
  ('Programming', 'programirane'),
  ('Languages', 'ezici'),
  ('Music', 'muzika'),
  ('Design', 'dizajn'),
  ('Sports', 'sport'),
  ('Cooking', 'gotvene'),
  ('Business', 'biznes'),
  ('Other', 'drugi');

-- ---------------------------------------------------------------------------
-- Utility triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER skills_set_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER swap_requests_set_updated_at
  BEFORE UPDATE ON public.swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := lower(
    regexp_replace(
      COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  IF base_username = '' OR char_length(base_username) < 3 THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants (RLS policies will be added in a follow-up migration)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON TYPE public.app_role TO anon, authenticated;
GRANT USAGE ON TYPE public.skill_type TO anon, authenticated;
GRANT USAGE ON TYPE public.swap_request_status TO anon, authenticated;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.skills TO authenticated;
GRANT ALL ON public.swap_requests TO authenticated;
