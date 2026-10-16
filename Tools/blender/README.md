# Blender arm pipeline

Two headless scripts turn arm geometry into Unity-ready rigged FBX files
(bone contract shared with `UnityProject/.../Agents/Runtime/RiggedArmBuilder.cs`):

```
Shoulder > Elbow > Wrist > {Thumb_1..3, Index_1..3, Middle_1..3, Ring_1..3, Pinky_1..3, PalmMarker}
```

`PalmMarker` is a non-deforming bone on the palm side; Unity derives the
finger-curl direction and the IK bone offsets from it, so the FBX axis
convention does not matter.

| Script | Input | Output |
|---|---|---|
| `generate_arms.py` | nothing (procedural anatomy) | `Arm_Masculine_{R,L}.fbx`, `Arm_Feminine_{R,L}.fbx` — one organic skinned surface, five 3-joint fingers |
| `rig_scanned_arm.py` | a GLB (scan / image-to-3D) + a landmark JSON | `Arm_<Name>_{R,L}.fbx` with the original texture embedded |

```bash
blender --background --python Tools/blender/generate_arms.py -- \
    --out UnityProject/Assets/HoloArms/Art/Resources/Arms --preview preview.png --pose-test

blender --background --python Tools/blender/rig_scanned_arm.py -- \
    --glb ContentSamples/models/arm_textured_rigged.glb \
    --landmarks Tools/blender/landmarks/higgsfield_arm_01.json \
    --name Scan01 --out UnityProject/Assets/HoloArms/Art/Resources/Arms --preview scan.png
```

Both run in Blender 4.2+ / 5.x (tested headless with Blender 5.2.2).

## Why analytic skin weights

Blender's automatic (bone-heat) weights produced torn geometry on these fused
organic meshes. Both scripts compute weights from known anatomy instead —
smooth blends across elbow/wrist/knuckles — and the procedural generator
transfers them onto the remeshed surface. Every vertex is weighted (the
scripts print the unweighted count; it must be 0).

## Rigging a new scanned arm

1. Import the GLB in Blender and note, along the arm axis: shoulder, elbow,
   wrist (narrowest section) and knuckle positions, the Z band of each finger,
   and where the thumb starts and ends.
2. Copy `landmarks/higgsfield_arm_01.json`, adjust the values, run
   `rig_scanned_arm.py --preview` and check the posed render.
3. Scanned arms usually have **fused fingers**: Unity couples neighbouring
   finger curls (max 12° apart) for these assets, so pointing is subtler than
   on assets with separated fingers. Production arms should have separated
   fingers (spec §6).

## Quality status

- `Scan01` (Higgsfield image-to-3D, 2K texture): realistic skin detail, veins
  and nails; fused fingers; no subsurface-scattering setup yet.
- `Masculine`/`Feminine` (procedural): clean anatomy and deformation, no skin
  texture — engineering assets, not production quality.
