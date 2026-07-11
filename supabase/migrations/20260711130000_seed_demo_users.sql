-- Seed 5 demo users for SkillSwap (no avatars, no skill images)
-- Password for all: user123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  user_rec RECORD;
  new_user_id uuid;
BEGIN
  FOR user_rec IN
    SELECT *
    FROM (
      VALUES
        ('alice@skillswap.bg', 'alice', 'Alice Smith', 'Sofia', 'Frontend developer interested in language exchange.'),
        ('bob@skillswap.bg', 'bob', 'Bob Jones', 'Plovdiv', 'Musician and hobby chef.'),
        ('carol@skillswap.bg', 'carol', 'Carol White', 'Varna', 'Designer learning programming basics.'),
        ('dave@skillswap.bg', 'dave', 'Dave Brown', 'Burgas', 'Sports coach and business enthusiast.'),
        ('eve@skillswap.bg', 'eve', 'Eve Green', 'Sofia', 'Polyglot looking to share cooking skills.')
    ) AS seed_users(email, username, full_name, location, bio)
  LOOP
    SELECT id INTO new_user_id
    FROM auth.users
    WHERE email = user_rec.email;

    IF new_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET
        full_name = user_rec.full_name,
        location = user_rec.location,
        bio = user_rec.bio,
        avatar_url = NULL
      WHERE id = new_user_id;

      CONTINUE;
    END IF;

    new_user_id := gen_random_uuid();

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
      new_user_id,
      'authenticated',
      'authenticated',
      user_rec.email,
      crypt('user123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', user_rec.username, 'full_name', user_rec.full_name),
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
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', user_rec.email),
      'email',
      new_user_id::text,
      now(),
      now(),
      now()
    );

    UPDATE public.profiles
    SET
      location = user_rec.location,
      bio = user_rec.bio,
      avatar_url = NULL
    WHERE id = new_user_id;
  END LOOP;
END;
$$;
