using UnityEngine;

namespace HoloArms.Rendering
{
    /// <summary>
    /// The rear wall plane of the illusion (spec §7). Milestone 1 technique:
    /// the wall is REAL opaque geometry at z=0 and the arm root lives at
    /// z&lt;0, so ordinary depth testing occludes every arm fragment behind
    /// the wall — no custom clip shader needed, and "no visible arm geometry
    /// behind wall" holds by construction. The wall receives the projected
    /// key-light shadow and screen-space AO darkens the emergence point.
    ///
    /// The clip-plane/stencil variant becomes necessary only for
    /// Transparent Overlay mode (composition mode B) where there is no
    /// opaque wall to occlude against — that lands with that mode, not M1.
    /// Portal styles (glow edge, dark void, ...) attach here later.
    /// </summary>
    public sealed class WallPortalSystem : MonoBehaviour
    {
        public Transform WallRoot { get; private set; }
        public float WidthM { get; private set; }
        public float HeightM { get; private set; }

        private Material _wallMaterial;

        /// <summary>Builds the wall box. Front face sits exactly at world z = 0.</summary>
        public void Build(float widthM, float heightM, Color wallColor)
        {
            WidthM = widthM;
            HeightM = heightM;

            var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wall.name = "Wall (portal plane z=0)";
            wall.transform.SetParent(transform, false);
            const float thickness = 0.12f;
            wall.transform.localScale = new Vector3(widthM, heightM, thickness);
            // Cube is centred: shift back so the front face is at z = 0.
            wall.transform.localPosition = new Vector3(0f, heightM * 0.5f, thickness * 0.5f);
            Object.Destroy(wall.GetComponent<Collider>());

            _wallMaterial = HdrpMaterials.Lit(wallColor, smoothness: 0.25f);
            wall.GetComponent<MeshRenderer>().sharedMaterial = _wallMaterial;
            WallRoot = wall.transform;

            // Floor catcher below the wall so long shadows have somewhere to land.
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Floor (shadow catcher)";
            floor.transform.SetParent(transform, false);
            floor.transform.localScale = new Vector3(widthM * 2f, 0.05f, 3f);
            floor.transform.localPosition = new Vector3(0f, -0.025f, -1.4f);
            Object.Destroy(floor.GetComponent<Collider>());
            floor.GetComponent<MeshRenderer>().sharedMaterial =
                HdrpMaterials.Lit(wallColor * 0.85f, smoothness: 0.15f);
        }

        public void SetWallColor(Color c)
        {
            if (_wallMaterial != null) _wallMaterial.SetColor(HdrpMaterials.BaseColorId, c);
        }

        /// <summary>World position on the wall plane for a wall-space anchor (metres).</summary>
        public Vector3 AnchorToWorld(float anchorX, float anchorY)
        {
            return transform.TransformPoint(new Vector3(anchorX, anchorY, 0f));
        }
    }

    /// <summary>Shared helpers for creating HDRP materials from code.</summary>
    public static class HdrpMaterials
    {
        public static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        private static readonly int SmoothnessId = Shader.PropertyToID("_Smoothness");

        public static Material Lit(Color baseColor, float smoothness = 0.5f)
        {
            var shader = Shader.Find("HDRP/Lit");
            if (shader == null)
            {
                Debug.LogError("[HoloArms] HDRP/Lit shader not found — is the HD Render Pipeline active?");
                shader = Shader.Find("Standard");
            }
            var m = new Material(shader);
            m.SetColor(BaseColorId, baseColor);
            m.SetFloat(SmoothnessId, smoothness);
            return m;
        }
    }
}
