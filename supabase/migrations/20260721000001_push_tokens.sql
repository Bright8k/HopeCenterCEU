-- Push token registration table for server-driven push notifications.
-- One row per (user, token) pair; updated_at refreshed on each app launch
-- so stale tokens can be pruned by a future cleanup job.

CREATE TABLE push_tokens (
  user_id    uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text  NOT NULL,
  platform   text  NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push tokens"
  ON push_tokens
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
