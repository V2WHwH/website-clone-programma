# Risk List & Mitigations

> Milestone 0 deliverable 9. Ordered by (impact × likelihood).

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **Illusion quality misses** — arms read as "screen content", not wall emergence (bad shadows/perspective/light mismatch) | Product fails its core premise | Milestone 1 is a single-arm visual proof with hard acceptance criteria; Look & Depth calibration + Auto Optimize Depth from day one; contact shadows protected in quality fallback; on-site light matching presets |
| 2 | **Cross-node object continuity** — teleport/duplicate/vanish at screen boundaries under jitter | Breaks second core premise | Coordinator-arbitrated ownership with deterministic transfer tick + interpolation window (04); boundary handoff is an explicit M4 test (packet delay/jitter harness); configured gap transitions |
| 3 | **Transparent overlay on Windows is fragile** — top-most borderless windows vs. fullscreen-optimization, DWM, other signage apps stealing z-order | Mode B unreliable at venues | Treat Mode A as default; Mode B behind a compatibility checklist; Mode C (Spout2 shared texture) as the robust integration path; venue validation step in Displays setup |
| 4 | **24/7 stability** — GC spikes, VRAM growth, driver resets over days | Public failure, unattended sites | Allocation budget enforced in CI/playmode tests; 8 h/24 h+ soak tests with memory/frame-time drift tracking (M9); watchdog + safe fallback scene + auto-restart |
| 5 | **Scan-quality arm assets** — licensing/production of realistic rigged arms is a content risk, not a code risk | Realism ceiling | Asset validation pipeline specified early (M1); placeholders clearly labeled non-production; appearance-profile abstraction so assets swap without code changes |
| 6 | **Tracking robustness in public space** — crowds, occlusion, lighting changes, reflective floors | Behaviours misfire or look broken | Pluggable `ITrackingProvider` (swap backends); confidence-gated behaviours; hysteresis on direction; graceful degradation to attract mode; multi-camera fusion tests (M5) |
| 7 | **Privacy/compliance in public deployment** (GDPR — photos of identifiable people, camera use) | Legal/reputational | Privacy-by-design defaults (§29): local processing, opt-in photo, TTL deletion, masks, no biometrics; Privacy Mode page showing exactly what is retained; audit log |
| 8 | **Upscaler/vendor matrix** — DLSS/FSR/XeSS availability differs per GPU/driver/HDRP version | Quality menu promises features that fail | Startup capability detection; unavailable options hidden/greyed with reason; TAA always available as floor |
| 9 | **Clock/sync drift across heterogeneous nodes** | Passes look mistimed across the wall | Monotonic clocks + slewed offset correction; events scheduled at tick+delay not on-arrival; optional PTP/NTP for tight venues; jitter test harness (M4) |
| 10 | **Scope explosion before the illusion is proven** — building campaigns/analytics on an unproven core | Wasted effort, late discovery | Mandated milestone order: M1 visual proof gates everything; Figma-first prevents UI rework; "no fake production claim" rule |
| 11 | **Operator complexity** — venue staff can't run it | Product unusable commercially | Basic/Advanced split enforced in the design system; Figma prototypes user-tested with non-technical flows A–D; plain-language health status |
| 12 | **Handoff animation quality** — IK grip alignment looks robotic or intersects geometry | Uncanny, undermines realism | GripPoints authored per object; overlap-hold choreography (both hands hold N ms); mass-class animation feel; M2 two-hand interaction milestone dedicated to this |
| 13 | **Photo pipeline consent edge cases** — timeout/rejection mid-sequence, capture failure | Awkward public moments | Explicit consent state machine with rejected/timeout/failure paths tested (M7); sequence always has a graceful abort animation |
| 14 | **Coordinator single point of failure** | Whole-wall outage | Nodes run safe standalone idle without coordinator; auto-reconnect + reconcile; standby coordinator on roadmap (post-M9) |

**Non-risks by design**: GPU display spanning (never required), AI director
(optional module, never required for stable operation), NDI latency (never
used for the latency-critical local path).
