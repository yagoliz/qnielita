-- 1. Add username column to profiles and backfill from auth.users email prefix
ALTER TABLE profiles ADD COLUMN username TEXT;

UPDATE profiles
SET username = split_part(u.email, '@', 1)
FROM auth.users u
WHERE profiles.id = u.id
  AND profiles.username IS NULL;

UPDATE profiles
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL;

ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Migrate invites to max_claims model

-- For single-use invites that were used, create invite_claims rows
INSERT INTO invite_claims (invite_id, user_id)
SELECT id, used_by
FROM invites
WHERE used_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add max_claims column
ALTER TABLE invites ADD COLUMN max_claims INTEGER;

-- Set max_claims for multi-use invites
UPDATE invites
SET max_claims = array_length(allowed_emails, 1)
WHERE allowed_emails IS NOT NULL AND array_length(allowed_emails, 1) > 0;

-- Set max_claims = 1 for single-use invites
UPDATE invites
SET max_claims = 1
WHERE max_claims IS NULL;

ALTER TABLE invites ALTER COLUMN max_claims SET NOT NULL;

-- Drop old columns
ALTER TABLE invites DROP COLUMN used_by;
ALTER TABLE invites DROP COLUMN allowed_emails;

-- 3. Update handle_new_user trigger to include username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;