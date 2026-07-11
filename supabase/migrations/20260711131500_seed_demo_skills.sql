-- Seed demo skills for alice, bob, carol, dave, eve (no images)

DO $$
DECLARE
  skill_rec RECORD;
  target_user_id uuid;
  target_category_id uuid;
BEGIN
  FOR skill_rec IN
    SELECT *
    FROM (
      VALUES
        ('alice', 'JavaScript Basics', 'Intro to modern JavaScript: variables, functions, and DOM basics.', 'teach', 'programming'),
        ('alice', 'Spanish Conversation', 'Looking for a partner to practice conversational Spanish.', 'learn', 'languages'),
        ('bob', 'Acoustic Guitar', 'Beginner-friendly guitar lessons covering chords and simple songs.', 'teach', 'music'),
        ('bob', 'Web Design Fundamentals', 'Want to learn layout, typography, and basic UI principles.', 'learn', 'design'),
        ('carol', 'UI Design with Figma', 'Hands-on Figma workshops for wireframes and prototypes.', 'teach', 'design'),
        ('carol', 'Python for Beginners', 'Interested in learning Python for automation and scripting.', 'learn', 'programming'),
        ('dave', 'Strength Training', 'Personal training sessions focused on form and progressive overload.', 'teach', 'sports'),
        ('dave', 'Digital Marketing', 'Seeking guidance on social media and small business marketing.', 'learn', 'business'),
        ('eve', 'Traditional Bulgarian Cooking', 'Share family recipes for banitsa, shopska salad, and more.', 'teach', 'cooking'),
        ('eve', 'Piano Basics', 'Want to learn reading sheet music and simple piano pieces.', 'learn', 'music')
    ) AS seed_skills(username, title, description, skill_type, category_slug)
  LOOP
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE username = skill_rec.username;

    IF target_user_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT id INTO target_category_id
    FROM public.categories
    WHERE slug = skill_rec.category_slug;

    IF EXISTS (
      SELECT 1
      FROM public.skills
      WHERE user_id = target_user_id
        AND title = skill_rec.title
    ) THEN
      UPDATE public.skills
      SET
        description = skill_rec.description,
        type = skill_rec.skill_type::public.skill_type,
        category_id = target_category_id,
        image_url = NULL,
        is_active = true
      WHERE user_id = target_user_id
        AND title = skill_rec.title;

      CONTINUE;
    END IF;

    INSERT INTO public.skills (
      user_id,
      category_id,
      title,
      description,
      type,
      image_url,
      is_active
    ) VALUES (
      target_user_id,
      target_category_id,
      skill_rec.title,
      skill_rec.description,
      skill_rec.skill_type::public.skill_type,
      NULL,
      true
    );
  END LOOP;
END;
$$;
