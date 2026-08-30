# Arm Identity, Personality & Cooperation Contract

> Product requirement added 2026-08-30 (extends spec §6 appearance and §12
> behaviour). Source: product owner — masculine and feminine arms that
> visibly express their identity; optional configurable jewelry, watches,
> tattoos; every arm unique in dressing and skin tone; unique per-arm
> temperament (expectant, bored, assertive, active, …) realistically
> expressed in motion; yet all arms ALWAYS cooperate on mandatory shared
> tasks (pointing at / offering an object, pointing at a passerby).

## 1. ArmIdentityProfile — who the arm is

Every `ArmAgent` owns an `ArmIdentityProfile`, generated from a seed or
authored by the operator. **Uniqueness is enforced**: no two arms on one
wall may share the same identity signature (gender presentation + skin
tone + accessory combination + tattoo). The generator retries until the
signature is unique.

| Dimension | Options | Notes |
|---|---|---|
| Gender presentation | Masculine · Feminine · Androgynous | Expressed through proportions (hand/arm thickness, finger slenderness), motion styling and default accessory weighting — never a caricature |
| Skin tone | 8-step realistic palette (light → deep) | Every arm can differ; production assets carry matching albedo/SSS sets per tone |
| Watch | none · classic · sport · smartwatch | Default weighting: masculine arms often wear one (per product direction); any arm MAY |
| Bracelets | none · leather · metal · beads (stackable) | Leather weighted masculine; beads/metal weighted feminine; crossover allowed |
| Rings | 0–3 · gold / silver / minimal | Placed on ring/index/pinky fingers |
| Nails | natural · manicured · painted (color) | Painted weighted feminine |
| Tattoo | none · fine-line · band · floral · tribal, intensity 0–1 | Optional & operator-configurable per arm and per campaign (brand-safe toggle) |
| Sleeve | spec §6 list (bare, business, casual, luxury, …) | Combines with all of the above |
| Scale | arm scale, hand scale, slenderness | Small variance even within a gender presentation |

Operator control (Figma **Arms → Add/Edit Arm**): Basic mode exposes
human-readable pickers (Gender presentation, Skin tone swatch, Jewelry
toggles, Tattoo on/off + style); Advanced mode exposes scales and exact
placement. "Randomize (unique)" button = the generator. Campaign settings
may lock a dress code (e.g. no tattoos for brand X) — locks filter the
generator, uniqueness still holds.

## 2. PersonalityProfile — how the arm behaves

Personality = **stable temperament** + **dynamic emotion** (spec §12).
Temperament is assigned per arm (unique-per-wall preferred, duplicates
allowed above 14 arms) and never changes during a show; emotions change on
top of it.

### Temperament catalog (v1)

Expectant (afwachtend) · Bored (verveeld) · Assertive · Energetic ·
Shy · Curious · Playful · Calm · Impatient · Proud · Dreamy · Grumpy ·
Friendly · Nervous

Each temperament is defined as trait weights — Energy, Assertiveness,
Patience, Sociability, Expressiveness, Confidence (0–1) — and maps to a
`MotionStyle`:

| Motion parameter | Driven by | Example |
|---|---|---|
| Idle sway amplitude/speed | Energy, Expressiveness | Bored: slow, drooping; Energetic: lively |
| Rest posture offset | Confidence, Energy | Assertive: raised, forward; Shy: pulled back toward the wall |
| Reaction delay to tasks | Assertiveness, Patience | Assertive: near-instant; Expectant: waits, then commits |
| Extend/gesture speed | Energy, Assertiveness | Impatient: quick, slightly overshooting |
| Micro finger motion | Nervousness (inverse Calm) | Nervous: fidgeting fingers |
| Hesitation wobble | inverse Confidence | Shy/Nervous: small approach corrections |

### Emotion catalog (dynamic layer, v1)

Spec §12 set plus additions: Neutral, Curious, Friendly, Playful, Happy,
Excited, Confused, Impatient, Annoyed, Angry, Sad, Shy, Surprised,
**Bored, Proud, Tired, Alert, Affectionate, Mischievous, Determined**.
Emotions multiply the temperament's MotionStyle (never a one-shot clip)
and bias gesture choice.

## 3. Cooperation contract — mandatory shared tasks

Individuality NEVER breaks the show. The `IBehaviourDirector` issues
**group tasks** that are mandatory for every assigned arm:

- Point at a tracked passerby (or campaign target position)
- Offer / present a campaign object
- Participate in an object relay (M2+: grip/handoff chain)
- Group gestures (celebration, applause) per campaign

Rules:

1. **Participation is unconditional** — a bored arm still points; its
   boredom shows in *style* (slower, sagging, minimal), never in refusal.
2. Personality shapes reaction delay, vigor and posture within bounded
   ranges so the group action stays legible from a distance.
3. The director owns task start/stop and targets; arms own execution
   style. On task end, arms return to temperament-driven idling.
4. Frequency caps/cooldowns (spec §14) apply to the director, not to
   individual arms.

## 4. Engineering mapping (implemented in M1.5, on the M1 scaffold)

| Concept | Code |
|---|---|
| Identity model + unique generator | `Agents/Runtime/ArmIdentity.cs` (`ArmIdentityProfile`, `ArmIdentityGenerator`, skin palette) |
| Temperament/emotion → motion | `Agents/Runtime/Personality.cs` (`PersonalityProfile`, `EmotionState`, `MotionStyle`) |
| Visible identity on the placeholder arm | `ProceduralArmBuilder` — skin tone material, gendered proportions, watch/bracelet/ring bands, nail tips, tattoo bands (placeholder geometry; production = asset variants + texture layers) |
| Mandatory group tasks | `Behaviour/Runtime/RuleBasedBehaviourDirector.cs` — simulated passerby until real tracking (M5); tasks: PointAt, Offer |
| Per-arm execution style | `ArmAgent` — task API with personality-based delay/speed/posture |
| Persistence | `ArmConfig.armCount` + `identitySeed` (same seed → same cast of arms after restart) |

Production note: the procedural accessories are engineering placeholders;
the production asset pipeline delivers per-identity mesh/texture variants
(watch/ring/bracelet sockets per spec §6 "jewelry/accessory sockets").
