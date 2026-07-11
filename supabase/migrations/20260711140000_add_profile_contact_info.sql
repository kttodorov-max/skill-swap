-- Add contact info for swap partners (revealed after request is accepted)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_info TEXT;

COMMENT ON COLUMN public.profiles.contact_info IS
  'Email, phone, or other contact details shared with swap partners after acceptance.';
