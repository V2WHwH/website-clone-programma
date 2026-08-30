# HOLO ARMS / WALL HANDS ENGINE
## Master product, UX and technical specification for Claude Code

### 0. Primary instruction to Claude Code
Build this as a production-grade, modular Windows application for HEREweHOLO/Holowall/Holobox installations. The application is both an art/public-engagement experience and a commercial advertising platform.

**Do not start with implementation of the main Unity runtime. First complete the product architecture and the Figma UX/UI design using the available Figma connector. Use the supplied reference images as visual inspiration. After the Figma flows, component system and settings architecture are coherent, use that design as the UI source of truth for the application.**

Do not treat this as a collection of pre-rendered arm videos. The core must be a real-time 3D engine in which realistic arms/hands, objects, shadows, cameras, behaviour, multiple displays and campaigns are modular components.

The final experience must look convincing enough for public locations such as railway stations, airports, shopping centres, museums, brand activations and events. Visual realism, stability, recoverability and operator simplicity are more important than quickly producing a technical demo.

---

# 1. Visual premise — non-negotiable

The basic illusion is:

- Arms emerge from the **back wall / rear plane** of the display.
- Left and right arms are distributed at configurable positions across that wall.
- The arm root/shoulder exists virtually behind the wall.
- Only the section of the arm that crosses the wall plane becomes visible.
- Hands and held objects can extend forward toward the viewer.
- Real-time shadows, contact shadows, ambient occlusion, perspective and lighting must make the arm feel attached to the wall rather than floating in front of a screen.
- Multiple arms can interact with each other and pass physical-looking 3D objects or photo cards from hand to hand.

Reference files included in this package:

- `references/01_wall_hands_reference.png` — inspiration for multiple arms physically emerging from walls, occlusion and dramatic shadowing.
- `references/02_single_hand_reference.png` — inspiration for a clean single hand/arm, realistic skin and controlled lighting.
- `references/03_wall_emergence_reference.png` — inspiration for the physical illusion of anatomy emerging through a flat architectural wall.

Use these only as **visual/interaction inspiration**, not as assets to reproduce literally.

---

# 2. Target platforms and display topology

Primary runtime:

- Windows 11
- Unity 6 LTS or current stable Unity 6 release
- HDRP
- C#
- DirectX 12
- NVIDIA GPU preferred, but architecture should allow AMD/Intel where practical
- 60 FPS target
- 4K portrait and 4K landscape are first-class configurations

The application must **not require AMD Catalyst/Eyefinity, NVIDIA Mosaic or any other GPU-level display spanning**.

Support three display topology modes from the Settings menu:

## 2.1 Independent Node Overlay mode
Each Holobox/Holowall section can run its own local application instance and GPU render.

Each node has:

- Node ID
- Screen ID
- Physical position in the global wall
- Physical width/height
- Resolution
- Orientation
- Network address
- Assigned arms/objects/zones

Nodes synchronize events and world state over LAN but render locally.

This is the default modular deployment mode.

## 2.2 Existing Combined Canvas mode
If the operating system or hardware is already configured so several displays appear as one large desktop/image, the software may render one logical canvas.

Settings must allow:

- total logical resolution
- screen regions/viewports
- bezel/gap compensation
- physical screen positions
- orientation per panel

The application must detect but never require this configuration.

## 2.3 Multi-node Global Wall mode
Several independent displays behave as one conceptual wall without being combined at GPU/OS level.

Create a `GlobalWallCoordinateSystem` in physical metres and normalized wall coordinates.

Example:

```text
Global wall: 8.0 m wide x 2.2 m high

Display A: x=0.0–1.35 m
Display B: x=1.45–2.80 m
Display C: x=2.90–4.25 m
...
```

Every ArmAgent, interaction zone and object exists in global wall coordinates. Each rendering node only renders entities assigned to or intersecting its viewport.

Objects passing between displays are transferred through synchronized world ownership/events; they must not depend on a physically continuous framebuffer.

---

# 3. Overlay/compositing architecture

The application is fundamentally an overlay-capable illusion layer. Build a `RenderCompositionMode` abstraction with at least:

### A. Self-contained scene
The app renders wall/background + arms + objects + shadows itself. Highest visual consistency.

### B. Transparent Overlay
The app renders only:

- arms/hands
- 3D objects
- portal/edge effects if enabled
- shadow matte
- optional brand graphics

over another local background/signage application.

Implement a borderless top-most window strategy where technically viable. The background should be transparent and the shadow layer should use alpha/multiply-like compositing rather than requiring the underlying application to be part of the 3D scene.

### C. Shared GPU Surface / signage integration
Provide an adapter layer for zero-copy local GPU texture exchange when available, for example Spout2 or a comparable Windows texture-sharing mechanism.

This enables integration with external media/signage software without forcing the external software into the HOLO ARMS codebase.

NDI may be an optional input/output integration for remote/video workflows, but do not use compressed video transport for latency-critical local 3D interaction when a local GPU texture path is available.

---

# 4. Core scene architecture

Use modular components and interfaces. Do not create a monolithic manager.

Recommended top-level modules:

```text
HoloArms.Runtime
HoloArms.Rendering
HoloArms.DisplayTopology
HoloArms.Agents
HoloArms.Objects
HoloArms.Animation
HoloArms.IK
HoloArms.Behaviour
HoloArms.Tracking
HoloArms.Cameras
HoloArms.Campaigns
HoloArms.Timeline
HoloArms.Networking
HoloArms.Audio
HoloArms.Analytics
HoloArms.Calibration
HoloArms.EditorUI
HoloArms.Persistence
HoloArms.Diagnostics
HoloArms.Privacy
```

Main runtime services should be accessed through explicit interfaces / dependency injection or a lightweight service container, not global singletons everywhere.

---

# 5. ArmAgent system

Every arm is an independent `ArmAgent`.

Each `ArmAgent` contains or references:

```text
ArmIdentity
ArmModelProfile
ArmSide (Left / Right)
ArmRoot
WallAnchor
SkeletonController
AnimatorController
AnimationLayerController
FullBodyOrArmIKController
FingerPoseController
GripController
ReachVolume
InteractionController
EmotionController
SocialBehaviourController
Look/PointTargetController
ShadowProfile
LightingResponseProfile
ArmAppearanceProfile
PerformanceLODProfile
NetworkReplicationComponent
```

Every arm knows:

- its global wall position
- whether it is left/right
- maximum reach envelope
- neighbour arms
- objects within reach
- active behaviour
- current emotion
- current object ownership
- target person/track ID if interacting with a passerby
- display/node it currently belongs to

Arms must be dynamically addable/removable without rebuilding the application.

---

# 6. Realism and arm visual quality

Visual quality is a primary product requirement, not polish for later.

Final production arm assets must support:

- physically correct human proportions
- high-quality rigging and deformation at wrist/elbow
- realistic finger articulation
- separate nail geometry/material where useful
- PBR materials
- 4K texture sets as a normal production baseline
- optional 8K source textures for high-end systems
- albedo/base color
- normal maps
- roughness/smoothness
- ambient occlusion
- subsurface scattering / skin diffusion
- micro-normal skin detail
- correct specular response
- sleeve/clothing materials when used

Claude must not claim that low-detail placeholder hands are production quality. During engineering, placeholders are acceptable, but the architecture and asset validation pipeline must explicitly support scan-quality/licensed final assets.

Appearance profiles should include understandable options such as:

- realistic bare arm
- business sleeve
- casual sleeve
- luxury/fashion sleeve
- futuristic/robotic
- sculpture/stone
- chrome/metal
- translucent/surreal
- branded sleeve/material

Optional appearance settings:

- arm scale
- hand scale
- sleeve length
- sleeve material/color
- skin/material variant
- nail appearance
- jewelry/accessory sockets
- smartwatch/watch socket
- rings/bracelets
- surface wetness/gloss
- dirt/dust artistic amount

Do not expose dozens of raw shader parameters in Basic mode. Advanced mode may expose them.

---

# 7. WallPortalSystem — the key illusion

Build a `WallPortalSystem` representing the rear plane.

The arm starts behind the wall and crosses through it.

Required techniques:

- depth/stencil or clip-plane based arm occlusion
- correct near-wall clipping
- contact shadow at arm/wall intersection
- projected/real-time shadows onto the wall receiver
- ambient occlusion around the emergence point
- optional soft darkening around the arm opening
- optional light spill from behind the wall
- physically plausible shadow direction based on configured light

Support visual portal styles:

1. Invisible/clean wall — arm simply emerges, preferred default.
2. Soft shadow opening.
3. Dark void opening.
4. Brand-color glow edge.
5. Digital/pixel portal.
6. Crack/breakthrough artistic effect.
7. Fabric/membrane style.
8. Metallic hatch/architectural opening.

Portal style must be optional; the cleanest illusion is often no visible portal.

---

# 8. Depth Illusion Calibration

Create a dedicated operator-friendly calibration page.

Basic controls:

- **Depth Strength**: 0–100
- **Shadow Strength**: 0–100
- **Shadow Softness**: 0–100
- **Arm Extension**: Near / Normal / Deep
- **Perspective**: Auto / Manual
- **Room Light Match**: Dark / Indoor / Bright / Custom

Advanced controls:

- camera FOV
- camera X/Y/Z
- viewer distance
- viewer eye height
- vanishing point
- wall plane depth
- arm root depth
- max extension depth
- shadow bias
- normal bias
- contact shadow length
- contact shadow opacity
- AO radius/intensity
- key light azimuth/elevation
- key light softness
- fill amount
- rim amount
- exposure
- white balance / temperature

Add `Auto Optimize Depth`:

Input:

- physical display size
- screen resolution
- typical viewer distance
- typical viewer eye height
- selected arm profile
- ambient brightness preset

Output initial values for:

- FOV
- arm scale
- max Z extension
- contact shadow intensity
- projected shadow angle/length
- AO
- perspective offset

This is an initial calibration, not a promise of physically perfect automatic calibration.

---

# 9. Rendering quality and adaptive performance

Quality is key, but public installations must remain stable. Implement a proper quality manager with easy presets plus a Custom page.

## Basic quality selector

- Auto
- Ultra
- High
- Balanced
- Performance
- Custom

## Resolution / upscaling selector

- Native 100%
- Supersample 110–150% if GPU headroom permits
- Dynamic Resolution Auto
- Render Scale 50–150%
- DLSS Quality / Balanced / Performance when supported
- DLAA when supported
- FSR Quality / Balanced / Performance when supported by chosen integration
- XeSS where supported and stable
- TAA fallback

Do capability detection. Do not show unavailable methods as if they work.

## Advanced rendering controls

- target FPS: 30 / 50 / 60 / 90 / 120 where useful
- min/max dynamic resolution
- texture quality
- texture streaming budget
- anisotropic filtering
- shadow resolution
- shadow cascades
- contact shadows
- SSAO/RTAO if available
- reflection quality
- skin SSS quality
- anti-aliasing
- motion vectors
- motion blur amount (default conservative/off for interactive clarity)
- LOD bias
- maximum active arm LOD
- maximum high-quality lights
- transparent effects quality

## Auto Quality Controller

When enabled:

1. maintain target FPS,
2. reduce non-critical effects first,
3. then reduce shadow resolution,
4. then lower AO/secondary lighting,
5. then lower render scale/upscaling mode,
6. preserve arm skin/finger quality as long as possible.

Use hysteresis and averaged GPU frame time; do not switch quality every few frames.

Log all automatic quality changes.

---

# 10. ObjectAgent and commercial object system

Advertisers must be able to add products, 3D assets, logos, photos and campaign media without editing Unity scenes.

Create an `ObjectAgent` architecture.

Initial import formats:

- GLB
- glTF
- PNG with alpha
- JPG/JPEG
- WEBP

Optional later import/conversion pipeline:

- FBX
- OBJ
- USD/USDZ through offline conversion

Object types:

- 3D Product
- Flat Image
- Photo Card
- Logo Cutout
- Gift Box
- Coupon Card
- QR Card
- Camera Prop
- Phone/Tablet Prop
- Generic Primitive/Test Object

For PNG/photo imports support:

- auto aspect ratio
- configurable physical size
- thickness
- edge bevel
- matte/gloss material
- front/back material
- drop shadow
- transparent cutout
- optional branded frame

Every object can define:

- `GripPoints[]`
- preferred orientation
- left/right hand compatibility
- two-hand grip option
- mass class (light/medium/heavy for animation feel)
- fragile flag
- throw allowed flag
- pass allowed flag
- campaign ID
- destination
- CTA metadata

Grip handoff should use IK and ownership transfer; the object must not teleport.

---

# 11. Multi-arm routing and generic cooperation

Implement generic passing across arms.

High-level example:

```text
Campaign wants Object X to travel from GlobalWall X=0.5 m to X=6.5 m.

Arm A can reach Object X.
Arm D can reach destination.
A cannot reach D.

Routing graph:
A -> B -> C -> D
```

Build a graph from arm reach overlaps and handoff compatibility.

`HandoffPlanner` determines a route.

During handoff:

1. sender requests transfer,
2. receiver reserves interaction slot,
3. planner calculates a shared handoff point,
4. receiver approaches using IK,
5. receiver grip confirms,
6. both hold for a configurable overlap time,
7. object ownership transfers,
8. sender releases,
9. receiver continues.

For transfer between independent display nodes:

- synchronize handoff event and object state through the network coordinator,
- use a deterministic transfer timestamp/network tick,
- avoid visible duplication or disappearance,
- if there is a physical gap, use a suitable transition: edge handoff, throw, slide, disappear/reappear effect, or a hand entering from the next display.

---

# 12. Social/emotional arm behaviour

Provide a behaviour library:

- wave
- point
- beckon/come here
- stop
- thumbs up/down
- high five
- fist bump
- handshake
- touch other hand
- stroke/pat another hand
- push away
- reject object
- offer object
- steal object
- protect object
- tease with object
- pass
- catch
- throw
- drop
- applaud/clap where two hands exist
- frustrated gesture
- celebratory gesture
- confused gesture
- curious reach

Emotional states:

- Neutral
- Curious
- Friendly
- Playful
- Happy
- Excited
- Confused
- Impatient
- Annoyed
- Angry
- Sad
- Shy
- Surprised

Emotion modifies motion style, timing, finger micro-movement, hesitation and gesture choice. Do not model emotion as a single one-shot animation.

Use layered animation:

```text
Base Pose
+ Motion Style / Emotion
+ Gesture
+ Object Carry Pose
+ Arm IK
+ Hand IK
+ Finger Grip Pose
+ Micro Motion
```

---

# 13. Public tracking with webcam(s)

The application supports one or more webcams/cameras.

Create a pluggable `ITrackingProvider` abstraction. Do not hardcode the complete product to one computer-vision library.

Required tracking outputs per detected person:

```text
TrackID (temporary session ID)
Screen/Camera source
2D bounding box
Estimated floor position or normalized wall-relative position
Walking direction
Velocity
Dwell time
Confidence
Optional pose keypoints if provider supports them
LastSeen timestamp
```

No facial recognition or persistent identity is required for the core product.

Use local processing by default.

Camera system must support:

- multiple camera devices
- camera naming
- per-camera crop
- mirror setting
- orientation
- lens/FOV metadata
- frame-rate selection
- exposure controls where API supports it
- privacy mask areas
- detection zones
- ignore zones
- wall-to-camera calibration
- multiple cameras covering one long wall

## Camera-to-wall calibration

Provide a visual wizard:

1. operator selects camera,
2. identifies 4+ known points / display corners / floor reference points,
3. compute homography/projective mapping where applicable,
4. test by showing a marker on the wall for the current tracked person,
5. save calibration per camera.

For more complex geometry, allow a calibrated camera model with physical camera pose.

---

# 14. Passerby engagement behaviours

Create generic behaviours triggered by tracked people.

Examples:

### Point at passerby
Nearest suitable hand points at the person's mapped wall/floor position and follows within smoothing limits.

### Multiple hands notice someone
One hand points; another waves; another offers a product/gift object.

### Direction-following product pass
If a person walks left-to-right:

1. determine stable movement direction,
2. select a campaign object,
3. choose arms ahead of the person,
4. quickly pass the object from hand to hand in the same movement direction,
5. keep the object visually close to or slightly ahead of the person's projected wall position,
6. final hand can stop and present it.

If person reverses direction, behaviour should either gracefully finish or re-plan according to campaign settings; do not make arms rapidly oscillate.

### Offer gift
A hand presents a branded 3D gift box/product/card toward the tracked person.

### Ignore/playful variation
Not every detected passerby needs an interaction. Use cooldowns, probability and frequency caps so the installation does not look mechanically repetitive.

---

# 15. Dwell-triggered photo experience

Support this commercial/public interaction as a reusable `PhotoExperienceSequence`.

Example sequence:

1. Person remains in configured Engagement Zone longer than `DwellTriggerSeconds`.
2. A hand notices the person.
3. Hand retrieves or is assigned a 3D camera prop.
4. The hand aims the camera toward the tracked person.
5. Display shows a clear photo prompt/countdown.
6. Use an explicit opt-in interaction before storing/displaying an identifiable photo. Possible opt-in mechanisms: touch target, clear gesture, physical button, QR/web consent, or other deployment-specific interaction.
7. Camera shutter animation + sound.
8. Capture selected camera frame.
9. Apply optional campaign frame/logo/template locally.
10. Generate a `PhotoCardObject` as a thin 3D card.
11. Photo card enters from the top of the global wall through a `PhotoDropEmitter`.
12. A top-positioned hand catches it.
13. Hands pass the photo card down/across the wall.
14. Final hand presents the photo to the participant.
15. Optional: show a QR code for user-initiated retrieval.
16. Delete the captured image automatically after configured TTL unless the deployment has a separate, explicitly configured retention workflow.

Timeline must be able to express the trigger:

```text
IF trackedPerson.dwellTime >= 12s
AND PhotoExperienceCooldown == ready
THEN Start PhotoExperienceSequence(trackID)
```

Do not make automatic hidden photo capture the default for public deployments.

---

# 16. Timeline and conditional show control

Build a visual sequencer/timeline in the operator application.

Track types:

- Arm track
- Object track
- Emotion track
- Interaction track
- Light track
- Camera/Tracking trigger track
- Audio track
- Campaign track
- Display/node track
- Global event track

Clips/events can include:

- SpawnObject
- RemoveObject
- Grab
- Release
- Pass
- Throw
- Catch
- PointAtTrack
- WaveAtTrack
- OfferToTrack
- SetEmotion
- SetLightPreset
- ShowPhotoPrompt
- CapturePhoto
- CreatePhotoCard
- PlaySound
- TriggerExternalWebhook

Support both:

### Deterministic timeline
Exact authored show.

### Conditional blocks
Examples:

```text
IF crowdCount >= 5 -> CelebrationSequence
IF direction == LeftToRight -> ProductPassLTR
IF direction == RightToLeft -> ProductPassRTL
IF dwell > 12 s -> PhotoSequence
IF no people for 60 s -> AttractMode
```

### Autonomous Director
A rule-based director chooses actions from goals rather than a fixed timeline.

Architecture:

```text
IBehaviourDirector
  -> RuleBasedBehaviourDirector (v1)
  -> AIBehaviourDirector (future optional module)
```

AI must not be required for stable normal operation.

---

# 17. Advertising / Campaign Manager

The application must be commercially usable by advertisers.

Create a Campaign Manager with:

- campaign name
- advertiser/brand
- campaign ID
- start/end date/time
- active days/hours
- assigned displays/nodes
- assigned object assets
- brand logo
- brand colors
- CTA text
- optional QR destination
- interaction sequences
- trigger rules
- frequency caps
- cooldowns
- max interactions per minute
- target zones
- asset fallback
- content approval status

Campaign templates:

1. Product Relay
2. Gift Offer
3. Product Reveal
4. Photo Moment
5. Point + CTA
6. Product Toss/Catch
7. Multi-hand Reveal
8. Brand Celebration
9. Interactive Quiz/Choice (future)
10. Wayfinding/Service hand-off (future)

Commercial object controls should be understandable:

- Product size
- Product orientation
- Hold style
- Show duration
- Pass speed
- Brand logo on/off
- CTA on/off
- QR on/off
- Photo frame on/off
- Interaction intensity: Calm / Normal / Energetic

---

# 18. Analytics without requiring personal identification

Provide an analytics subsystem for commercial reporting.

Core metrics:

- estimated passersby count
- tracked sessions
- engagements started
- engagement completion rate
- average engagement dwell
- object offers
- object relay completions
- photo opt-ins
- QR views/click handoff events when measurable
- campaign plays
- campaign interaction frequency
- FPS / rendering health during campaign

Use temporary TrackIDs and aggregate metrics by default.

Do not require storing faces or biometric identities for analytics.

Export:

- CSV
- JSON
- local dashboard
- optional webhook/API adapter

---

# 19. User interface — must be understandable

The operator UI needs two levels:

## Basic mode
For event technicians, venue staff and advertisers.

Navigation proposal:

```text
Dashboard
Scene
Arms
Objects
Interactions
Cameras
Campaigns
Timeline
Look & Depth
Displays
Quality
Analytics
System
```

Basic pages should use human-readable controls and presets.

Example `Look & Depth`:

```text
Depth Strength       [====----] 65
Shadow Strength      [=====---] 72
Shadow Softness      [====----] 60
Room Light           Indoor
Wall Style           Clean
Arm Realism          Ultra
Perspective          Auto
[ Auto Optimize Depth ]
```

## Advanced mode
For integrators/developers.

Expose:

- precise physical screen geometry
- FOV
- projection offsets
- render scale
- shadow biases
- network topology
- clock sync
- tracking confidence
- camera calibration matrices
- detailed quality settings
- logs and diagnostics

Do not mix all advanced controls into the main interface.

---

# 20. Appearance / experience design options

Create an `ExperienceStyleProfile` so installations can look distinct without modifying code.

Suggested presets:

### Museum / Art
- slow expressive motion
- clean background
- subtle shadows
- sculptural arm materials possible

### Airport / Station
- high legibility
- energetic but not chaotic
- stronger pointing/attention gestures
- safe interaction cooldowns

### Premium Brand
- smooth motion
- premium sleeve/materials
- subtle branded light accents
- product-centred behaviour

### Playful
- faster handoffs
- teasing/rejecting
- surprise catches
- more emotion

### Futuristic
- robotic/chrome arms
- digital portal accents
- emissive brand lighting

### Minimal Realism
- bare wall
- realistic skin
- no portal graphic
- physically plausible shadows only

Appearance settings:

- wall background or transparent overlay
- wall brightness/color/texture
- arm material profile
- sleeve profile
- portal style
- shadow style
- light rig preset
- product highlight light
- brand accent light
- motion intensity
- animation speed range
- idle movement amount
- micro finger movement
- interaction randomness
- sound theme

---

# 21. Audio

Optional but recommended for engagement:

- camera shutter
- object whoosh
- catch impact
- subtle wall/arm movement
- brand sting
- notification/attention sound

Each node can output local audio, or one audio master node can be selected.

Network-trigger audio with timestamped events to keep sync acceptable.

Add volume presets and a venue-safe maximum output limiter option.

---

# 22. Networking and multi-display synchronization

Design a `WallCoordinator` and `WallNode` architecture.

Roles:

### Coordinator
- authoritative scene state
- campaign scheduler
- global track mapping
- object ownership
- inter-node events
- timeline timebase
- health monitoring

### Node
- local rendering
- assigned cameras if any
- local arm simulation/animation under synchronized commands
- local asset cache
- health/telemetry reporting

Recommended transport split:

- Reliable WebSocket/TCP channel for configuration, asset state, commands and acknowledgements.
- Lightweight UDP/multicast or timestamped event channel for low-latency synchronization where appropriate.
- Periodic time synchronization/drift correction.

Use monotonic clocks and shared `NetworkTick`/timestamp. Design for network jitter.

For installations requiring very tight sync, support use of PTP/NTP-synchronized hosts if available, but normal product operation should not require specialist timing hardware.

If coordinator disappears temporarily:

- nodes should continue safe idle/current deterministic sequence where possible,
- do not freeze on a broken frame,
- reconnect automatically,
- reconcile state safely.

---

# 23. Asset distribution across nodes

Create a `ContentPackage` format containing:

- campaign definition
- object models/textures
- photo frame templates
- arm appearance references
- audio
- timeline definitions
- configuration version
- content hash

Coordinator distributes packages or verifies they are cached before activating a campaign.

Never begin a synchronized show on a node that is missing required assets unless a configured fallback is available.

Show `Ready / Missing Assets / Syncing / Error` per node.

---

# 24. Persistence and configuration

Use versioned scene/campaign configuration, ideally JSON or a schema-driven equivalent for interoperability.

Example conceptual configuration:

```json
{
  "wallId": "AMS_STATION_WALL_01",
  "topologyMode": "MultiNodeGlobalWall",
  "physicalWidthM": 7.8,
  "physicalHeightM": 2.2,
  "nodes": [
    {"nodeId":"A","xM":0.0,"widthM":1.35,"resolution":[2160,3840]},
    {"nodeId":"B","xM":1.45,"widthM":1.35,"resolution":[2160,3840]}
  ],
  "quality": {
    "preset":"Auto",
    "targetFps":60,
    "renderScaleMin":0.65,
    "renderScaleMax":1.0
  }
}
```

Use schema versioning and migration. Never silently discard unknown/new settings.

---

# 25. Figma-first workflow — mandatory first stage

Claude must use the available Figma connector before implementing the final operator UI.

## Phase F1 — UX information architecture
Create sitemap/navigation for:

- Dashboard
- Scene
- Arms
- Objects
- Interactions
- Cameras
- Campaigns
- Timeline
- Look & Depth
- Displays
- Quality
- Analytics
- System

Define Basic vs Advanced mode.

## Phase F2 — design system
In Figma create:

- desktop 16:9 control UI
- dark professional control-room theme
- typography scale
- spacing system
- buttons
- toggles
- sliders
- cards
- node status chips
- dropdowns
- timeline clips
- canvas panels
- warning/error states
- tooltips
- empty states

Prioritize clear operation over decorative UI.

## Phase F3 — key screens
Create high-fidelity Figma screens for at least:

1. Dashboard / system health
2. Scene editor with live wall preview
3. Add/Edit Arm
4. Objects/Asset Library
5. Camera Tracking & Calibration
6. Campaign Manager
7. Timeline/Conditional Trigger Editor
8. Look & Depth calibration
9. Display Topology setup
10. Quality & Performance
11. Analytics
12. System / Node diagnostics

## Phase F4 — interactive prototype flows
Prototype:

### Flow A: create a new installation
New Project -> Display Topology -> Physical Dimensions -> Add Nodes -> Quality -> Depth Calibration -> Save.

### Flow B: create a product campaign
Campaign -> Add GLB/PNG -> configure grip -> assign arms -> select Product Relay -> preview -> schedule.

### Flow C: camera engagement
Camera -> calibrate -> define engagement zone -> add Point/Offer behaviour -> test tracking.

### Flow D: photo experience
Campaign -> Photo Moment -> dwell trigger -> consent step -> camera prop -> capture -> photo card -> handoff -> display -> TTL.

## Phase F5 — implementation handoff
Extract from Figma:

- component names
- component states
- spacing tokens
- typography
- icons
- screen hierarchy
- interaction descriptions

Then implement UI consistently in the application. Do not abandon the Figma system and invent a different UI during coding.

---

# 26. Engineering implementation roadmap

Do not build everything at once. Use staged milestones with testable acceptance criteria.

## Milestone 0 — Architecture + Figma
Deliver:

- architecture document
- module diagram
- runtime/editor separation
- data model
- display topology model
- event model
- Figma design system and core flows

No fake production claim.

## Milestone 1 — Single arm visual proof
Deliver:

- one realistic rigged arm
- wall clipping
- arm extension/retraction
- IK target movement
- contact shadow
- wall shadow
- light calibration
- 2160x3840 portrait profile
- quality menu

Acceptance:

- stable 60 FPS on target reference GPU profile
- no visible arm geometry behind wall
- shadow reacts in real time to light direction
- settings persist

## Milestone 2 — Multi-arm local scene
Deliver:

- dynamic left/right arms
- reach volumes
- neighbour graph
- two-hand interactions
- handshake/high-five
- object grip/handoff

## Milestone 3 — Object/content workflow
Deliver:

- GLB/glTF runtime import
- PNG/JPG/WEBP card creation
- grip editing
- Product Relay template
- asset library

## Milestone 4 — Multi-display independent nodes
Deliver:

- coordinator + nodes
- GlobalWallCoordinateSystem
- display topology settings
- synchronized timeline
- object transfer between nodes
- health panel

No GPU spanning required.

## Milestone 5 — Camera tracking
Deliver:

- camera manager
- person detection/tracking provider
- temporary track IDs
- direction/velocity/dwell
- calibration wizard
- point/wave/follow behaviours

## Milestone 6 — Conditional interactions
Deliver:

- direction-following product relay
- dwell triggers
- crowd triggers
- cooldowns/frequency caps
- attract mode

## Milestone 7 — Photo experience
Deliver:

- camera prop
- consent/countdown state
- local photo capture
- PhotoCardObject
- PhotoDropEmitter
- hand catch/pass/present
- configurable TTL/deletion
- optional QR retrieval integration interface

## Milestone 8 — Campaign/analytics production layer
Deliver:

- campaign scheduling
- campaign templates
- advertiser asset packaging
- analytics dashboard/export
- content validation

## Milestone 9 — Production hardening
Deliver:

- crash recovery
- watchdog option
- auto-start
- safe mode
- offline mode
- network reconnect
- logs
- diagnostics bundle
- asset checksums
- update strategy
- operator role/profile
- kiosk lock mode
- long-duration soak tests

---

# 27. Testing requirements

Add automated and manual tests for:

### Rendering
- 4K portrait
- 4K landscape
- multiple render scales
- shadow settings
- transparent overlay
- wall occlusion

### Multi-node
- node disconnect/reconnect
- coordinator restart
- packet delay/jitter
- object handoff at screen boundary
- missing asset fallback

### Tracking
- one person
- several people crossing
- person stopping
- reversal of walking direction
- temporary occlusion
- camera disconnect

### Photo
- consent accepted
- consent rejected/time-out
- capture failure
- frame processing failure
- automatic TTL deletion

### Performance
- 1 arm
- 4 arms
- 8+ arms at appropriate LOD
- multiple animated objects
- camera tracking active
- campaign transition

### Soak
Run production-like scenes for 8 h, 24 h and longer. Track memory usage, GC allocations, GPU memory and frame-time drift.

---

# 28. Public-space reliability

This application may run unattended on stations/airports.

Required operational functions:

- auto-start on boot
- optional Windows kiosk/shell mode documentation
- crash watchdog
- automatic reconnect cameras
- automatic reconnect nodes
- no modal system dialogs during show mode
- safe fallback scene
- health heartbeat
- remote status interface
- structured logs
- one-click diagnostics export
- disk-space monitoring
- camera status
- GPU temperature/load where available
- VRAM usage
- FPS/GPU frame time
- network latency
- last successful campaign sync

Show status in plain language:

```text
SYSTEM: Healthy
Displays: 6/6 online
Cameras: 3/3 online
Campaign: Brand X / Active
FPS: 60
GPU load: 72%
Quality: Auto / High
Tracking: Active
```

---

# 29. Privacy-by-design for public deployment

Because webcams and photo features may operate in public locations, implement privacy controls as product features, not an afterthought.

Defaults:

- person detection/tracking processed locally where practical
- TrackIDs are temporary and session-scoped
- no facial recognition required
- no identity database
- no raw camera recording by default
- configurable privacy masks
- photo capture requires a deployment-defined explicit opt-in interaction before an identifiable photo is stored/displayed
- configurable automatic deletion TTL for captured photos
- visible photo countdown/prompt
- audit log of configuration changes, not biometric data

Provide a `Privacy Mode` page showing exactly what camera data is being retained.

---

# 30. Editor/runtime separation

Architect two operational layers:

## Configure/Edit mode
Full UI, asset import, topology, calibration, campaign authoring.

## Show/Kiosk mode
Minimal or hidden UI, deterministic runtime, remote control optional.

Show mode must not pay unnecessary performance cost for heavy editor panels.

---

# 31. File/repository structure

Propose and create a clean repository before broad implementation.

Example:

```text
/Docs
/FigmaHandoff
/UnityProject
  /Assets/HoloArms/Core
  /Assets/HoloArms/Rendering
  /Assets/HoloArms/Agents
  /Assets/HoloArms/Objects
  /Assets/HoloArms/Tracking
  /Assets/HoloArms/Networking
  /Assets/HoloArms/Campaigns
  /Assets/HoloArms/UI
  /Assets/HoloArms/Diagnostics
/Tools
/ContentSamples
/Tests
/BuildScripts
```

Use assembly definitions to keep modules isolated where beneficial.

---

# 32. Definition of production quality

Do not call the application production-ready unless all of the following are true:

- stable on target Windows hardware
- tested at target 4K output
- no repeated allocation spikes during show playback
- no obvious arm-wall clipping errors
- handoff does not teleport objects
- camera loss recovers safely
- node loss recovers safely
- configuration is versioned and persistent
- campaigns can be created without editing source code
- operator can understand main controls without reading shader terminology
- advanced controls remain available to integrators
- quality can scale automatically to maintain FPS
- diagnostic data is available
- display spanning is optional, never mandatory
- independent nodes can participate in one global wall experience

---

# 33. Required first response/work product from Claude

Before writing the full application, Claude must produce:

1. A concise restatement of the product goal.
2. A component/module architecture diagram.
3. A display topology diagram for:
   - independent nodes,
   - combined canvas,
   - multi-node global wall.
4. A data-flow diagram for camera -> tracker -> behaviour -> arm -> renderer.
5. A network synchronization design.
6. A rendering quality strategy with fallback order.
7. A Figma execution plan using the connector.
8. The proposed Figma page/component structure.
9. A risk list with mitigations.
10. A milestone backlog matching this specification.
11. Questions only where a genuinely blocking decision cannot be made safely from this specification.

After completing the Figma stage, Claude should use the approved/design-source output as the basis for implementation and proceed milestone by milestone.

---

# 34. Final product principle

The product should feel like a **real-time spatial illusion engine**, not a signage player with hand animations.

The technical foundation is:

```text
GLOBAL WALL
   +
INDEPENDENT DISPLAY NODES
   +
REAL-TIME 3D ARM AGENTS
   +
WALL OCCLUSION / DEPTH ILLUSION
   +
PHYSICALLY PLAUSIBLE LIGHT & SHADOW
   +
OBJECT / PHOTO AGENTS
   +
GENERIC HANDOFF ROUTING
   +
PASSERBY TRACKING
   +
TIMELINE + CONDITIONAL BEHAVIOURS
   +
CAMPAIGN MANAGEMENT
   +
ADAPTIVE 4K QUALITY
   +
PUBLIC-SPACE RELIABILITY
```

If a shortcut harms the wall illusion, hand realism, object continuity, display modularity or 24/7 stability, prefer the more robust architecture.
