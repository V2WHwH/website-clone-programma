# MILESTONES — HEREweHOLO Beam

Nine slices. Each ends in something that runs. Each has a **gate**: a condition Desmond verifies
before the next slice starts. Claude Code does not cross a gate on its own.

The order is deliberate. Streaming is proven before identity is built, because a beautiful
dashboard on top of a stream that does not work is the most expensive kind of wasted effort.

---

## M0 — Research and design (no application code)

**Deliverables**
- `ARCHITECTURE.md` — component diagram, data flow, process boundaries, deployment topology
- `STREAMING.md` — protocol choices (WebRTC / SRT / RTMP / HLS), codec ladder, why AV1 or not
- `SECURITY.md` — threat model, device identity, token lifetimes, RBAC model
- `DATA-MODEL.md` — entities, relations, migration strategy
- `docs/adr/` — one ADR per open decision from `CLAUDE.md` § Stack, two rejected alternatives each
- `MVP-PLAN.md` — this file, refined with real estimates

**Gate:** Desmond approves the ADRs. No code before this.

---

## M1 — Vertical slice: camera to glass

The smallest thing that proves the product exists.

**Scope:** browser camera → signaling → receiver on the same LAN → fullscreen output on a display.
No auth, no database, no cloud, no UI polish. Hardcoded room ID is acceptable *here and only here*.

**Deliverables**
- Minimal signaling service
- Browser sender page: camera permission, preview, connect button
- Receiver: fullscreen video, no window chrome, no visible desktop
- A diagnostic printout of the full resolution chain (capture → encode → transport → decode → render)

**Gate:** a live face appears fullscreen on a second machine, and the diagnostic chain reports the
same resolution at every stage. Measured glass-to-glass latency recorded.

---

## M2 — Across the internet

**Scope:** get M1 working from a phone on 4G to a receiver behind a normal consumer router.

**Deliverables**
- Media server / SFU deployed
- STUN and TURN, with TURN relay verified as a fallback path
- NAT traversal tested from at least three network types (home, mobile, corporate/restrictive)
- Signaling deployed, no longer on localhost

**Gate:** sender on mobile data, receiver in a different building, stream stable for 10 minutes.
Relay path forced and verified separately.

---

## M3 — Identity, organisations, devices

**Scope:** the platform becomes multi-tenant and devices become real entities.

**Deliverables**
- PostgreSQL with migrations, entities per `DATA-MODEL.md`
- Authentication, MFA-ready, secure password hashing
- Organisation → location → device → user hierarchy, with isolation enforced at query level
- Device registration with QR pairing: receiver shows code, admin scans, device is bound
- Signed device credentials, not copyable from a config file
- Device online/offline state, visible in a minimal dashboard

**Gate:** two organisations exist; neither can see the other's devices, verified by test. A new
receiver pairs from scratch in under two minutes.

---

## M4 — The session

**Scope:** the actual user-facing flow from `docs/00-REFERENCE.md` §4, rebuilt as our own.

**Deliverables**
- Destination selection before camera opens, multi-select, online/offline status per device
- Preview with camera and microphone selection
- Status strip: session duration, connection state, resolution, fps, bitrate — live, honest values
- GO LIVE / STOP
- Return video and return audio, as a dockable inset that does not interrupt the stream
- Echo cancellation, mandatory and verified
- Secure invitation links: time-limited, revocable, single-use or reusable, optional password
- Settings frozen while live

**Gate:** the `docs/ACCEPTANCE.md` scenario runs manually, start to finish, with a guest who has
installed nothing.

---

## M5 — Unattended operation

**Scope:** the receiver survives a week alone in a reception area.

**Deliverables**
- Kiosk mode, autostart, auto-login, auto-connect
- Watchdog, crash recovery, network recovery
- Local fallback content: when the connection drops, brand loop plays — never an error, never Windows
- Silent background reconnect
- Structured logging, one session ID traceable end to end

**Gate:** pull the network cable mid-stream. Fallback appears within a defined window, reconnect
happens without human action, no error dialog is ever visible. Then pull the power. Same result.

---

## M6 — Quality that is real

**Scope:** make the 4K claim true, or make the UI stop making it.

**Deliverables**
- Hardware encoder detection: NVENC, Quick Sync, AMF, VideoToolbox — with graceful fallback
- Capability negotiation between sender, cloud and receiver
- Adaptive ladder: 4K60 → 4K30 → 1440p → 1080p60 → 1080p30 → 720p, and controlled recovery upward
- Network pre-flight test before GO LIVE, with an honest verdict
- Benchmark harness: H.264 / HEVC / AV1 at 4K30 and 4K60, recording CPU, GPU, VRAM, encode and
  decode latency, dropped frames
- Diagnostic view exposing the full resolution chain in the running product

**Gate:** a genuine 4K session, verified stage by stage in the diagnostic view. Bandwidth is then
throttled and the ladder steps down without dropping the session.

---

## M7 — Fleet and operations

**Scope:** HEREweHOLO can run hundreds of devices from one screen.

**Deliverables**
- Dashboard: devices, live streams, sessions, users, analytics
- Health monitoring: CPU, GPU, RAM, storage, temperature, network, receiver version, uptime
- Alerts: offline, overheating, disk full, receiver crashed, display unavailable
- Remote actions: restart receiver, clear cache, download logs, run network test, reboot
- Per-session analytics and cost metrics (ingress, egress, media server time)
- Audit logging

**Gate:** an operator diagnoses and remotely fixes a simulated fault without touching the device.

---

## M8 — Shipping

**Scope:** something a HEREweHOLO installer can put on a customer PC.

**Deliverables**
- `HEREweHOLO Beam Receiver Setup.exe` — install, repair, update, uninstall
- Automatic configuration of autostart, firewall, runtime, services
- Signed automatic updates on STABLE / BETA / INTERNAL channels, with rollback on failure
- 24-hour soak test: continuous playback, repeated sessions, disconnect cycles, memory and GPU
  leak detection, thermal behaviour

**Gate:** the soak test passes on real hardware. Memory and VRAM flat over 24 hours.

---

## Explicitly out of scope until M8 has passed

Native mobile apps · SRT · RTMP ingest · recording · content library · playlists · scheduling ·
live override · transitions · AI background removal · framing assistant · multi-destination
fan-out · global edge optimisation · NDI · SSO · white label · billing · Holowall frame sync.

These are real requirements from the build spec. They are not MVP. Adding any of them before the
acceptance scenario is stable will slow the project down, not speed it up.
