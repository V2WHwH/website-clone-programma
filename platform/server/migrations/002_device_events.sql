-- M5: structured device events — one session ID traceable end to end (MILESTONES.md M5).
CREATE TABLE device_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES devices ON DELETE CASCADE,
  org_id uuid NOT NULL,
  type text NOT NULL,
  session_id uuid,
  at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX ON device_events (device_id, at DESC);
CREATE INDEX ON device_events (session_id);
