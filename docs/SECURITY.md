# SECURITY — threat model, identity, tokens, RBAC

> M0 deliverable. Status: **draft for Desmond's review**. Non-negotiables from `CLAUDE.md` apply
> throughout: no hardcoded secrets, no API keys in frontend code, no plaintext credentials, ever.

## 1. Assets & threat model

Assets: live video/audio of real people · device fleet control (a compromised receiver is a screen in a
customer's reception) · tenant data isolation · invite links (they open a camera into someone's lobby).

| Threat | Vector | Mitigation |
|---|---|---|
| Stream interception | on-path attacker | TLS 1.3 everywhere; WebRTC = DTLS-SRTP end-to-SFU; no unencrypted fallback |
| Stolen invite link | forwarded email/chat | Short expiry, revocable, optional single-use + password; link grants *join*, never account access |
| Rogue device impersonation | copied config | Device identity = keypair, private key never leaves the device (DPAPI/TPM); tokens signed per device, not copyable secrets in a file |
| Pairing-code guessing | online brute force | Codes single-use, ~10 min expiry, rate-limited per IP and per device, constant-time compare |
| Tenant data leak | missing WHERE org_id | Isolation in the repository layer **plus** PostgreSQL RLS as defense in depth; the M3 gate includes a two-org isolation test |
| Credential stuffing | leaked passwords | Argon2id hashing, rate limiting, MFA-ready (TOTP) from day one, breach-list check on set |
| Compromised kiosk PC | physical access | Agent runs least-privilege; device token scoped to that device's own resources; remote revoke → device falls back to pairing screen |
| Malicious update | supply chain | Signed updates only, staged channels (STABLE/BETA/INTERNAL), rollback on failed health check (M8) |

Out of scope for MVP (recorded, not forgotten): end-to-end encryption past the SFU, SSO/SAML,
white-label tenancy — all post-M8 per the milestone plan.

## 2. Identities

| Identity | Credential | Notes |
|---|---|---|
| **User** | email + password (Argon2id), TOTP-ready | Belongs to ≥ 1 organization with a role |
| **Device (HoloSee)** | keypair generated on device at first boot | Public key bound to the device record during pairing; access tokens are short-lived JWTs signed for that key |
| **Guest** | invite token | Exchanged at join time for an ephemeral session-scoped identity: display name + one room token. No account, nothing stored beyond the session record |
| **Service** | server-to-server tokens on a private network | Control plane mints all tokens; media plane mints none |

## 3. Pairing (M3)

1. Unregistered HoloSee generates a keypair, requests a pairing code, displays code + QR.
2. Admin (role ≥ admin) scans/types the code in Cloud, picks organization + location, names the device.
3. Control plane binds the public key to the new device record; the code is dead from that moment.
4. Agent authenticates by signing a nonce; receives its first device token. Total time < 2 min (gate).

Codes: 6 chars from an unambiguous alphabet (no 0/O/1/I), single-use, ~10 min TTL, rate-limited.
Re-pairing requires explicit admin action (revoke → device returns to pairing screen).

## 4. Tokens (proposed lifetimes)

| Token | Lifetime | Renewal | Scope |
|---|---|---|---|
| User access JWT | 15 min | refresh token, 30 d rolling, revocable per device/session | org + role claims |
| Device access JWT | 15 min | auto-renew via key signature | that device only |
| Invite link | configurable, default 24 h, max 7 d | none — revocable at any time | join one destination (or set) |
| SFU room token | session duration, max 4 h | reissued live if a session legitimately runs longer | one room, one role (publish / subscribe) |
| Pairing code | 10 min | none | one pairing |

All JWTs carry `org_id`; the API rejects any resource access where row `org_id` ≠ token `org_id`
regardless of query correctness.

## 5. RBAC

Hierarchy: **organization → location → device**; users hold a role per organization
(optionally narrowed to locations):

| Role | Can |
|---|---|
| Owner | everything, incl. billing/members |
| Admin | devices (pair/revoke), users, invites, all sessions |
| Operator | dashboard, health, remote actions, end sessions |
| Presenter | start sessions to permitted devices, create invites for them |
| Viewer | read-only dashboard |

Guests are not members: an invite carries the presenter's grant, narrowed to specific destinations
and a time window.

## 6. Invite links (M4)

- Time-limited, revocable, single-use **or** reusable (explicit choice), optional password.
- URL contains a random 128-bit token — no IDs, no org names. Knowing the URL reveals nothing about
  the tenant until the token validates.
- The join page shows the destination *before* any camera permission — the guest always knows where
  they will appear (design principle 1).
- Every use is audit-logged (who created, when used, from where, session ID).

## 7. Operational rules

- Secrets live in the platform secret store; `.env` files never enter git (`.gitignore` enforced,
  CI secret-scans the tree).
- Structured audit log (append-only): auth events, pairing, revocations, invite create/use/revoke,
  remote commands, role changes — each with actor, org, timestamp, session/device ID.
- Logs never contain tokens, passwords, or raw invite URLs.
- Dependencies: lockfiles + automated vulnerability scanning in CI; the receiver updater verifies
  signatures before applying anything (M8).
