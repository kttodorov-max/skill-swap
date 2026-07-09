-- Demo admin user for SkillSwap capstone testing
-- Credentials: demo@skillswap.bg / demo123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@skillswap.bg';

  IF demo_user_id IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = demo_user_id;
    RETURN;
  END IF;

  demo_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    demo_user_id,
    'authenticated',
    'authenticated',
    'demo@skillswap.bg',
    crypt('demo123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"demo","full_name":"Demo Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    demo_user_id,
    format('{"sub":"%s","email":"%s"}', demo_user_id::text, 'demo@skillswap.bg')::jsonb,
    'email',
    demo_user_id::text,
    now(),
    now(),
    now()
  );

  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = demo_user_id;
END;
$$;
