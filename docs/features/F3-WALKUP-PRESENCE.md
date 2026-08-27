# F3 — Walk-up: presence detection & instant call

**Status:** Proposed (phase 2+) · **UX:** mockups §07 / Figma *07 Concepts* · **Informs:** ADR-004, `DATA-MODEL.md`, M7

## Why

A Holobox is idle ~95% of the time — a beautiful screen playing a loop. Walk-up turns it into a
two-way concierge: a visitor approaches, the box greets them and calls an available colleague, who
appears full-body within seconds. This changes what the product *is* (passive display → staffed
presence) and what it is worth per box.

## What the visitor sees (HoloSee)

A fourth receiver state — still never an error:

1. Idle loop → person lingers → **"Good afternoon — one moment, we're connecting you with a
   colleague."** with the connecting rings and, once accepted, the presenter appears.
2. Nobody available (roster empty / after hours): a friendly card with alternatives (QR to leave a
   message or book), then back to idle. Silence is never the failure mode.
3. Small permanent line at the base: *"Presence detection runs on this device. No video leaves it
   until a colleague accepts."*

## What the employee sees (HoloMe)

An incoming **walk-up call** screen: location ("Amsterdam HQ · reception"), waiting time counting,
Accept (primary) / Decline. An info dot states the privacy contract sharply:

> *You see no camera image until you accept. The visitor sees nothing until your stream starts.
> Declining passes the call to the next person on duty.*

Accept drops the employee into the normal preview → GO LIVE fast path (destination pre-selected).

## Technical approach

- **Detection is local.** Person detection runs on the HoloSee PC (the receiver hardware is already
  GPU-capable), on-device only: no frames leave the machine pre-consent, only events
  (`walkup_detected`, dwell seconds, count). GDPR-by-design; signage line in the UI.
- Event → existing device WSS channel (ADR-004) → Cloud routing: **on-duty roster** per location
  (who, hours, order), push/ring to HoloMe, escalation to next on no-answer (15 s), all audit-logged.
- Session that follows is a completely normal session — walk-up is an *initiation path*, not a new
  media pipeline. `sessions` gains `initiated_by: presenter | walkup`.
- Cloud additions: roster model + routing rules + walk-up analytics (walk-ups, answered %,
  time-to-answer, missed-by-hour) on the M7 dashboard.

## Impact on the platform

- First server→sender push flow (ring an employee) → needs web push/notifications in HoloMe;
  designed once, reused later for "your session is scheduled" (phase 3 scheduling).
- Receiver gets a local inference runtime — shared groundwork with any future on-box features.
- Hardware note: works with the box's existing camera where present; optional discrete presence
  sensor (mmWave) for boxes without one — detection interface abstracts over both.

## Open questions

Detection trigger tuning (dwell threshold vs. false positives in busy lobbies) · roster UX for small
teams (default: all admins on duty during office hours) · legal review per country on presence
sensing signage.
