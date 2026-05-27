-- Add allowed_emails column to invites table.
-- When set, only emails in this list can register with the token.
-- When NULL, the invite works like before (single-use, any email).
ALTER TABLE invites
  ADD COLUMN allowed_emails TEXT[] DEFAULT NULL;

-- Change used_by to track multiple users when allowed_emails is set.
-- We add a junction table for multi-use invites.
CREATE TABLE invite_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

ALTER TABLE invite_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_claims: admin can read"
  ON invite_claims FOR SELECT USING (is_admin());
