-- M6: capability negotiation. The receiver measures what it can actually decode
-- (MediaCapabilities) plus its physical screen, and reports it after pairing/boot.
-- The session start uses this to cap the sender's ladder — no rung is offered that
-- the glass cannot honestly play.
ALTER TABLE devices ADD COLUMN caps jsonb;
