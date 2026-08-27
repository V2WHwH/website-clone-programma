-- M7: fleet operations. Alerts are server-raised, auto-resolving facts about a device;
-- health is the latest host-level measurement reported by the watchdog agent (load, memory,
-- disk, uptime, temperature where the host exposes it); sessions gain measured egress.
CREATE TABLE alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_id    uuid REFERENCES devices(id) ON DELETE CASCADE,
  kind         text NOT NULL,           -- offline | disk_low | stuck_fallback
  message      text NOT NULL,
  raised_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolve_note text
);
CREATE INDEX alerts_open_idx ON alerts (org_id, raised_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX alerts_device_idx ON alerts (device_id);

ALTER TABLE devices ADD COLUMN health jsonb;
ALTER TABLE devices ADD COLUMN health_at timestamptz;

-- Measured video egress (sender-side bytesSent across all published layers) per session.
ALTER TABLE sessions ADD COLUMN egress_bytes bigint;
