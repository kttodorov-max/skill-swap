-- Translate seeded category names to English (slugs unchanged)

UPDATE public.categories SET name = 'Programming' WHERE slug = 'programirane';
UPDATE public.categories SET name = 'Languages' WHERE slug = 'ezici';
UPDATE public.categories SET name = 'Music' WHERE slug = 'muzika';
UPDATE public.categories SET name = 'Design' WHERE slug = 'dizajn';
UPDATE public.categories SET name = 'Sports' WHERE slug = 'sport';
UPDATE public.categories SET name = 'Cooking' WHERE slug = 'gotvene';
UPDATE public.categories SET name = 'Business' WHERE slug = 'biznes';
UPDATE public.categories SET name = 'Other' WHERE slug = 'drugi';
