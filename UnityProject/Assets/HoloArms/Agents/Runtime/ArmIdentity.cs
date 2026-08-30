using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace HoloArms.Agents
{
    public enum GenderPresentation { Masculine, Feminine, Androgynous }
    public enum WatchStyle { None, Classic, Sport, Smartwatch }
    public enum RingStyle { Gold, Silver, Minimal }
    public enum NailStyle { Natural, Manicured, Painted }
    public enum TattooStyle { None, FineLine, Band, Floral, Tribal }

    /// <summary>
    /// Who an arm is (Docs/10). Generated uniquely per wall — no two arms
    /// share the same signature of gender presentation, skin tone,
    /// accessories and tattoo.
    /// </summary>
    public sealed class ArmIdentityProfile
    {
        public GenderPresentation Gender;
        public int SkinToneIndex;          // index into SkinPalette
        public WatchStyle Watch;
        public bool LeatherBracelet;
        public bool MetalBracelet;
        public bool BeadBracelet;
        public int RingCount;              // 0..3
        public RingStyle Rings;
        public NailStyle Nails;
        public Color NailColor;
        public TattooStyle Tattoo;
        public float TattooIntensity;      // 0..1
        public float ArmScale = 1f;        // overall
        public float RadiusScale = 1f;     // thickness (gender + variance)
        public float LengthScale = 1f;

        public Color SkinTone => SkinPalette[Mathf.Clamp(SkinToneIndex, 0, SkinPalette.Length - 1)];

        /// <summary>Realistic light→deep skin palette (8 steps).</summary>
        public static readonly Color[] SkinPalette =
        {
            new Color(0.965f, 0.827f, 0.745f), new Color(0.941f, 0.769f, 0.659f),
            new Color(0.878f, 0.675f, 0.549f), new Color(0.776f, 0.533f, 0.388f),
            new Color(0.663f, 0.420f, 0.294f), new Color(0.553f, 0.333f, 0.196f),
            new Color(0.420f, 0.247f, 0.149f), new Color(0.290f, 0.173f, 0.102f)
        };

        /// <summary>Signature used for the uniqueness guarantee.</summary>
        public string Signature =>
            $"{Gender}|s{SkinToneIndex}|w{Watch}|b{(LeatherBracelet ? 1 : 0)}{(MetalBracelet ? 1 : 0)}{(BeadBracelet ? 1 : 0)}" +
            $"|r{RingCount}{Rings}|n{Nails}|t{Tattoo}";

        public string Describe()
        {
            var sb = new StringBuilder();
            sb.Append(Gender switch
            {
                GenderPresentation.Masculine => "masc",
                GenderPresentation.Feminine => "fem",
                _ => "andro"
            });
            sb.Append($" · skin {SkinToneIndex + 1}/8");
            if (Watch != WatchStyle.None) sb.Append($" · {Watch.ToString().ToLower()} watch");
            if (LeatherBracelet) sb.Append(" · leather band");
            if (MetalBracelet) sb.Append(" · metal band");
            if (BeadBracelet) sb.Append(" · beads");
            if (RingCount > 0) sb.Append($" · {RingCount} {Rings.ToString().ToLower()} ring{(RingCount > 1 ? "s" : "")}");
            if (Nails == NailStyle.Painted) sb.Append(" · painted nails");
            if (Tattoo != TattooStyle.None) sb.Append($" · {Tattoo} tattoo");
            return sb.ToString();
        }
    }

    /// <summary>
    /// Deterministic unique identity generator: same seed → same cast of
    /// arms after a restart; the registry guarantees no duplicate signature
    /// on one wall. Weighting follows the product direction (watch +
    /// leather band lean masculine, rings/beads/painted nails lean
    /// feminine) while every combination stays possible.
    /// Campaign dress-code locks (Docs/10 §1) filter here later.
    /// </summary>
    public sealed class ArmIdentityGenerator
    {
        private readonly System.Random _rng;
        private readonly HashSet<string> _used = new HashSet<string>();

        public ArmIdentityGenerator(int seed) { _rng = new System.Random(seed); }

        private float Next() => (float)_rng.NextDouble();
        private int Range(int minIncl, int maxExcl) => _rng.Next(minIncl, maxExcl);

        public ArmIdentityProfile Generate()
        {
            for (int attempt = 0; attempt < 200; attempt++)
            {
                var p = Roll();
                if (_used.Add(p.Signature)) return p;
            }
            // 200 collisions means the wall is saturated with variants;
            // accept a duplicate rather than fail the show.
            var fallback = Roll();
            Debug.LogWarning("[HoloArms.Identity] Identity space saturated — allowing a near-duplicate.");
            return fallback;
        }

        private ArmIdentityProfile Roll()
        {
            var gRoll = Next();
            var gender = gRoll < 0.42f ? GenderPresentation.Masculine
                       : gRoll < 0.84f ? GenderPresentation.Feminine
                       : GenderPresentation.Androgynous;
            bool masc = gender == GenderPresentation.Masculine;
            bool fem = gender == GenderPresentation.Feminine;

            var p = new ArmIdentityProfile
            {
                Gender = gender,
                SkinToneIndex = Range(0, ArmIdentityProfile.SkinPalette.Length),
                Watch = Next() < (masc ? 0.75f : 0.25f)
                    ? (WatchStyle)Range(1, 4) : WatchStyle.None,
                LeatherBracelet = Next() < (masc ? 0.45f : 0.12f),
                MetalBracelet = Next() < (fem ? 0.40f : 0.15f),
                BeadBracelet = Next() < (fem ? 0.35f : 0.10f),
                RingCount = Next() < (fem ? 0.75f : 0.35f) ? Range(1, 4) : 0,
                Rings = (RingStyle)Range(0, 3),
                Nails = fem
                    ? (Next() < 0.5f ? NailStyle.Painted : NailStyle.Manicured)
                    : (Next() < 0.15f ? NailStyle.Manicured : NailStyle.Natural),
                Tattoo = Next() < 0.35f ? (TattooStyle)Range(1, 5) : TattooStyle.None,
                TattooIntensity = 0.4f + Next() * 0.6f,
                ArmScale = 0.96f + Next() * 0.10f,
                RadiusScale = (masc ? 1.10f : fem ? 0.86f : 0.98f) * (0.96f + Next() * 0.08f),
                LengthScale = (masc ? 1.03f : fem ? 0.98f : 1.0f) * (0.98f + Next() * 0.04f)
            };
            p.NailColor = new[]
            {
                new Color(0.75f, 0.10f, 0.15f), new Color(0.10f, 0.10f, 0.12f),
                new Color(0.85f, 0.55f, 0.65f), new Color(0.15f, 0.35f, 0.55f)
            }[Range(0, 4)];
            return p;
        }
    }
}
