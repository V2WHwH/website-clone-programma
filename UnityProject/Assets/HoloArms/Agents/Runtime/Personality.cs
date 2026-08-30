using System.Collections.Generic;
using UnityEngine;

namespace HoloArms.Agents
{
    public enum Temperament
    {
        Expectant,   // afwachtend — holds back, then commits
        Bored,       // verveeld — slow, drooping, minimal effort
        Assertive,   // direct, raised posture, near-instant reactions
        Energetic,   // actief — lively sway, quick gestures
        Shy, Curious, Playful, Calm, Impatient, Proud, Dreamy, Grumpy,
        Friendly, Nervous
    }

    public enum EmotionState
    {
        Neutral, Curious, Friendly, Playful, Happy, Excited, Confused,
        Impatient, Annoyed, Angry, Sad, Shy, Surprised,
        Bored, Proud, Tired, Alert, Affectionate, Mischievous, Determined
    }

    /// <summary>Motion parameters the animation layer consumes each frame.</summary>
    public struct MotionStyle
    {
        public float SwayAmplitude;    // metres, idle drift
        public float SwaySpeed;        // Hz-ish
        public float MicroMotion;      // finger/hand jitter amplitude
        public float PostureLift;      // metres, rest height offset (+confident / -drooping)
        public float PostureForward;   // metres, toward viewer at rest
        public float ReactionDelay;    // seconds before joining a group task
        public float MoveSpeed;        // m/s toward task targets
        public float Hesitation;       // 0..1 approach wobble (inverse confidence)
    }

    /// <summary>
    /// Stable temperament + dynamic emotion → MotionStyle (Docs/10 §2).
    /// Temperament sets the base; the current emotion multiplies it.
    /// Style differences stay inside bounded ranges so mandatory group
    /// tasks remain legible (cooperation contract, Docs/10 §3).
    /// </summary>
    public sealed class PersonalityProfile
    {
        public Temperament Temperament { get; }
        public EmotionState Emotion { get; private set; }

        // Traits 0..1
        public float Energy, Assertiveness, Patience, Sociability, Expressiveness, Confidence;

        public PersonalityProfile(Temperament t)
        {
            Temperament = t;
            (Energy, Assertiveness, Patience, Sociability, Expressiveness, Confidence) = t switch
            {
                Temperament.Expectant  => (0.35f, 0.30f, 0.90f, 0.50f, 0.40f, 0.55f),
                Temperament.Bored      => (0.15f, 0.25f, 0.60f, 0.25f, 0.25f, 0.50f),
                Temperament.Assertive  => (0.70f, 0.95f, 0.35f, 0.60f, 0.70f, 0.95f),
                Temperament.Energetic  => (0.95f, 0.70f, 0.25f, 0.75f, 0.90f, 0.75f),
                Temperament.Shy        => (0.30f, 0.15f, 0.75f, 0.30f, 0.35f, 0.20f),
                Temperament.Curious    => (0.60f, 0.50f, 0.45f, 0.70f, 0.65f, 0.55f),
                Temperament.Playful    => (0.85f, 0.55f, 0.20f, 0.85f, 0.95f, 0.70f),
                Temperament.Calm       => (0.35f, 0.45f, 0.90f, 0.55f, 0.35f, 0.80f),
                Temperament.Impatient  => (0.80f, 0.75f, 0.05f, 0.45f, 0.70f, 0.65f),
                Temperament.Proud      => (0.50f, 0.80f, 0.55f, 0.40f, 0.60f, 0.95f),
                Temperament.Dreamy     => (0.30f, 0.20f, 0.80f, 0.40f, 0.50f, 0.45f),
                Temperament.Grumpy     => (0.35f, 0.60f, 0.30f, 0.15f, 0.45f, 0.60f),
                Temperament.Friendly   => (0.60f, 0.50f, 0.60f, 0.95f, 0.75f, 0.65f),
                Temperament.Nervous    => (0.55f, 0.25f, 0.35f, 0.40f, 0.60f, 0.15f),
                _                      => (0.5f, 0.5f, 0.5f, 0.5f, 0.5f, 0.5f)
            };
            Emotion = DefaultEmotion(t);
        }

        public void SetEmotion(EmotionState e) => Emotion = e;

        public static EmotionState DefaultEmotion(Temperament t) => t switch
        {
            Temperament.Bored => EmotionState.Bored,
            Temperament.Energetic => EmotionState.Excited,
            Temperament.Shy => EmotionState.Shy,
            Temperament.Curious => EmotionState.Curious,
            Temperament.Playful => EmotionState.Playful,
            Temperament.Impatient => EmotionState.Impatient,
            Temperament.Proud => EmotionState.Proud,
            Temperament.Grumpy => EmotionState.Annoyed,
            Temperament.Friendly => EmotionState.Friendly,
            Temperament.Nervous => EmotionState.Alert,
            _ => EmotionState.Neutral
        };

        public MotionStyle CurrentStyle()
        {
            var s = new MotionStyle
            {
                SwayAmplitude = Mathf.Lerp(0.03f, 0.16f, Energy * 0.6f + Expressiveness * 0.4f),
                SwaySpeed = Mathf.Lerp(0.15f, 0.65f, Energy),
                MicroMotion = Mathf.Lerp(0.004f, 0.022f, 1f - (Confidence + Patience) * 0.5f),
                PostureLift = Mathf.Lerp(-0.09f, 0.07f, Confidence * 0.6f + Energy * 0.4f),
                PostureForward = Mathf.Lerp(-0.06f, 0.06f, Assertiveness),
                ReactionDelay = Mathf.Lerp(1.6f, 0.08f, Assertiveness * 0.7f + Energy * 0.3f)
                                + Patience * 0.5f,
                MoveSpeed = Mathf.Lerp(0.35f, 1.5f, Energy * 0.5f + Assertiveness * 0.5f),
                Hesitation = Mathf.Clamp01(1f - Confidence)
            };

            // Emotion layer: multiplicative modulation, never a one-shot clip.
            var (amp, spd, micro, lift, delay) = Emotion switch
            {
                EmotionState.Excited     => (1.5f, 1.6f, 1.3f, 0.04f, 0.6f),
                EmotionState.Happy       => (1.25f, 1.2f, 1.0f, 0.03f, 0.8f),
                EmotionState.Playful     => (1.4f, 1.4f, 1.2f, 0.02f, 0.7f),
                EmotionState.Bored       => (0.55f, 0.55f, 0.6f, -0.05f, 1.6f),
                EmotionState.Tired       => (0.45f, 0.45f, 0.5f, -0.07f, 1.8f),
                EmotionState.Sad         => (0.5f, 0.6f, 0.6f, -0.08f, 1.5f),
                EmotionState.Shy         => (0.6f, 0.8f, 1.2f, -0.04f, 1.5f),
                EmotionState.Angry       => (1.2f, 1.5f, 1.4f, 0.02f, 0.5f),
                EmotionState.Annoyed     => (0.9f, 1.2f, 1.2f, 0.0f, 1.2f),
                EmotionState.Impatient   => (1.2f, 1.5f, 1.4f, 0.01f, 0.4f),
                EmotionState.Alert       => (0.8f, 1.3f, 1.3f, 0.03f, 0.4f),
                EmotionState.Curious     => (1.1f, 1.0f, 1.1f, 0.02f, 0.7f),
                EmotionState.Proud       => (0.8f, 0.7f, 0.7f, 0.06f, 0.9f),
                EmotionState.Determined  => (0.9f, 1.1f, 0.8f, 0.03f, 0.4f),
                EmotionState.Surprised   => (1.3f, 1.7f, 1.5f, 0.02f, 0.3f),
                EmotionState.Confused    => (1.0f, 0.8f, 1.3f, -0.02f, 1.4f),
                EmotionState.Affectionate=> (1.1f, 0.8f, 0.9f, 0.02f, 0.8f),
                EmotionState.Mischievous => (1.3f, 1.3f, 1.2f, 0.01f, 0.6f),
                _                        => (1f, 1f, 1f, 0f, 1f)
            };
            s.SwayAmplitude *= amp;
            s.SwaySpeed *= spd;
            s.MicroMotion *= micro;
            s.PostureLift += lift;
            s.ReactionDelay *= delay;
            return s;
        }
    }

    /// <summary>Assigns temperaments so a wall's cast feels varied: unique until the catalog is exhausted.</summary>
    public sealed class TemperamentDealer
    {
        private readonly System.Random _rng;
        private readonly List<Temperament> _deck = new List<Temperament>();

        public TemperamentDealer(int seed) { _rng = new System.Random(seed); Refill(); }

        private void Refill()
        {
            _deck.Clear();
            _deck.AddRange((Temperament[])System.Enum.GetValues(typeof(Temperament)));
        }

        public Temperament Deal()
        {
            if (_deck.Count == 0) Refill();
            var i = _rng.Next(_deck.Count);
            var t = _deck[i];
            _deck.RemoveAt(i);
            return t;
        }
    }
}
