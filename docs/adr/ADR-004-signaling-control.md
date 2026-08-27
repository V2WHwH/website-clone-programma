# ADR-004 — Signaling & device control: LiveKit signaling for media, REST + WebSocket control plane

**Status:** Accepted (Desmond, 2026-08-27) · **Proposed:** 2026-08-27 · **Informs:** `ARCHITECTURE.md` §2–3, `SECURITY.md` §4

## Context

Two different problems hide under "signaling": (a) WebRTC session negotiation (offers/answers/ICE),
and (b) our own control traffic — device presence, health, remote commands, session orchestration.
Conflating them couples our fleet management to the media stack.

## Proposed decision

- **(a) Media signaling: LiveKit's built-in signaling** (WSS + protobuf), which comes with ADR-001.
  We write no SDP plumbing; our code exchanges only room tokens.
- **(b) Control plane: versioned REST (`/api/v1`, OpenAPI) for request/response + one persistent
  WSS connection per online device** for presence, health samples, and server→device commands
  (restart, logs, network test, update). JSON messages, schema-versioned envelope
  (`{v, type, id, payload}`), at-least-once with idempotent command IDs. Device online/offline state
  = WSS liveness (heartbeat 15 s) — the same signal the dashboard shows.
- HoloMe (browser) uses REST only; it needs no persistent control channel (session state arrives via
  the media room).

## Rejected alternatives

1. **MQTT broker for device control** — the classic IoT choice and the right one at tens of
   thousands of devices; but it adds a broker to operate, a second auth model to secure, and QoS
   semantics we would partially re-implement anyway on top (typed commands with idempotency). At
   hundreds of devices, one WSS endpoint on the API we already run does the same job with less
   surface. Rejected now; named as the scale path if fleet size or fan-out patterns demand it.
2. **SSE / long-polling for device channel** — trivially proxy-friendly but unidirectional;
   server→device commands would need a second mechanism, splitting one conversation across two
   transports with two failure modes. Rejected: complexity lands exactly where reliability matters
   most (unattended kiosks).

## Consequences

- The M5 reconnect logic (silent background reconnect, jittered backoff) is ours to build on the WSS
  channel — one implementation, well-tested, in the agent.
- Command audit trail falls out naturally: every command is a persisted row before it is sent
  (`DATA-MODEL.md` §2, `device_events`).
- If MQTT ever replaces the WSS channel, the REST API and message schemas survive unchanged.

## Revisit triggers

Fleet grows past low thousands of concurrently connected devices; a customer network blocks
WebSockets in a way TLS-on-443 doesn't solve; command fan-out (fleet-wide updates) starts straining
the single endpoint.
