-- M3 schema — MVP subset of DATA-MODEL.md. Every tenant-owned row carries org_id.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  totp_secret text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_memberships (
  org_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','operator','presenter','viewer')),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Amsterdam'
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  location_id uuid REFERENCES locations,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('holobox','holomini','holowall')),
  public_key_jwk jsonb NOT NULL,
  state text NOT NULL DEFAULT 'offline' CHECK (state IN ('online','offline','degraded')),
  agent_version text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON devices (org_id);

-- Pairing: the receiver generates a keypair and requests a code bound to its public key;
-- an admin claims the code, which creates the device row (SECURITY.md §3).
CREATE TABLE pairing_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text UNIQUE NOT NULL,
  public_key_jwk jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  device_id uuid, -- filled on claim so the waiting receiver can discover its identity
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES users,
  device_ids uuid[] NOT NULL,
  expires_at timestamptz NOT NULL,
  max_uses int,
  uses int NOT NULL DEFAULT 0,
  password_hash text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON invite_links (org_id);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  presenter_kind text NOT NULL CHECK (presenter_kind IN ('user','guest')),
  presenter_user_id uuid REFERENCES users,
  presenter_name text NOT NULL,
  invite_id uuid REFERENCES invite_links,
  state text NOT NULL DEFAULT 'connecting' CHECK (state IN ('connecting','live','ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX ON sessions (org_id, started_at DESC);

CREATE TABLE session_destinations (
  session_id uuid NOT NULL REFERENCES sessions ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES devices ON DELETE CASCADE,
  PRIMARY KEY (session_id, device_id)
);

CREATE TABLE audit_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid,
  actor text NOT NULL,
  action text NOT NULL,
  target text,
  at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX ON audit_entries (org_id, at DESC);
