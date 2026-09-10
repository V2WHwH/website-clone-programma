/* ============================================================================
   HWH AUDIO — geluid als de hoorbare kant van beweging
   ----------------------------------------------------------------------------
   Wet: ELK GELUID IS EEN BEWEGING DIE JE HOORT.
   Geen geluid zonder beweging, geen beweging zonder geluid.

   Drie regels die dit systeem koppelen aan hwh-motion.js:

   1. DE KLAP VALT OP 55%. Het transiënt van een geluid valt exact op het
      moment van de visuele doorschot. Dáár raakt het ding "aan", niet bij
      het begin en niet bij het eind. Dit is wat beeld en geluid één
      gebeurtenis maakt in plaats van twee.

   2. TOONHOOGTE SCHAALT OMGEKEERD MET MASSA — net als de overshoot.
      Klein = hoog en kort. Schermvullend = laag en lang. Je hóórt hoe
      zwaar iets is voordat je het ziet landen.

   3. ALLES STAAT IN ÉÉN TOONLADDER (A-mineur pentatonisch). Daardoor
      klinkt elke combinatie samen goed, en wordt een stagger van vier
      tegels vanzelf een akkoord in plaats van vier losse tikken.

   Alles wordt gesynthetiseerd met Web Audio — geen geluidsbestanden.
   De app blijft één bestand, blijft offline werken, en de klankparameters
   komen uit dezelfde tokens als de beweging.
   ========================================================================== */
(function (global) {
  'use strict';

  var ctx = null, master = null, bus = {}, muted = false, ready = false;

  /* A-mineur pentatonisch — elke combinatie klinkt samen goed. */
  var SCALE = [220.00, 261.63, 293.66, 329.63, 392.00,
               440.00, 523.25, 587.33, 659.25, 783.99];

  /* Klank per massa. Spiegelt OVERSHOOT uit hwh-motion.js:
     hoe zwaarder, hoe lager en hoe langer de staart. */
  var VOICE = {
    small:      { root: 5, tail: 0.09, body: 0.18, air: 0.30, gain: 0.16 },
    medium:     { root: 3, tail: 0.16, body: 0.34, air: 0.24, gain: 0.20 },
    large:      { root: 1, tail: 0.26, body: 0.52, air: 0.18, gain: 0.24 },
    fullscreen: { root: 0, tail: 0.42, body: 0.70, air: 0.12, gain: 0.28 },
    none:       { root: 3, tail: 0.10, body: 0.10, air: 0.20, gain: 0.10 }
  };

  function init() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;

    // Lichte ruimte: de holobox is glas en licht, geen droge doos.
    var conv = ctx.createConvolver();
    conv.buffer = impulse(1.7, 2.6);
    var wet = ctx.createGain(); wet.gain.value = 0.16;
    var dry = ctx.createGain(); dry.gain.value = 0.92;
    master.connect(dry); dry.connect(ctx.destination);
    master.connect(conv); conv.connect(wet); wet.connect(ctx.destination);

    bus.fx = master;
    ready = true;
    return ctx;
  }

  /* Korte, heldere impulsrespons — glasachtig, geen kerkgalm. */
  function impulse(sec, decay) {
    var len = Math.floor(ctx.sampleRate * sec);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  /* Eén toon: sinus-kern + driehoek-body + geruis-lucht.
     De lucht is het "aanraken", de kern is de massa. */
  function tone(freq, t0, v, gainScale) {
    if (!ctx || muted) return;
    var g = ctx.createGain();
    g.connect(master);
    var peak = v.gain * (gainScale == null ? 1 : gainScale);

    // Aanslag: 6 ms. Korter klikt, langer voelt sloom.
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + v.tail + v.body);

    var o1 = ctx.createOscillator();
    o1.type = 'sine'; o1.frequency.setValueAtTime(freq, t0);
    // Minieme toonhoogtedaling: dat leest het oor als "neerkomen".
    o1.frequency.exponentialRampToValueAtTime(freq * 0.985, t0 + v.body);
    o1.connect(g); o1.start(t0); o1.stop(t0 + v.tail + v.body + 0.05);

    var o2 = ctx.createOscillator();
    var g2 = ctx.createGain(); g2.gain.value = 0.22;
    o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 2, t0);
    o2.connect(g2); g2.connect(g); o2.start(t0); o2.stop(t0 + v.tail + 0.05);

    // Lucht: gefilterde ruis op het transiënt.
    var n = ctx.createBufferSource();
    var nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    var nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    n.buffer = nb;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq * 3.2; bp.Q.value = 0.9;
    var ng = ctx.createGain(); ng.gain.value = v.air * peak;
    n.connect(bp); bp.connect(ng); ng.connect(master);
    n.start(t0);
  }

  /* --------------------------------------------------------------- LANDEN
     delayMs = de duur van de bijbehorende beweging; de klap wordt
     automatisch op 55% daarvan gezet. */
  function land(size, opts) {
    if (!init() || muted) return;
    opts = opts || {};
    var v = VOICE[size || 'medium'] || VOICE.medium;
    var dur = (opts.duration || 320) / 1000;
    var at = now() + (opts.at || 0) / 1000 + dur * 0.55;   // ← regel 1
    var degree = opts.degree != null ? opts.degree : 0;
    tone(SCALE[Math.min(SCALE.length - 1, v.root + degree)], at, v, opts.gain);
  }

  /* ------------------------------------------------------------ SEQUENTIE
     Een stagger wordt een arpeggio: elke volgende tegel een trede hoger.
     Vier tegels die landen klinken daardoor als één akkoord, niet als
     vier tikken. Dit is het moment waarop choreografie muziek wordt. */
  function sequence(count, opts) {
    if (!init() || muted) return;
    opts = opts || {};
    var size = opts.size || 'medium';
    var stagger = opts.stagger != null ? opts.stagger : 80;
    var dur = opts.duration || 320;
    var down = opts.direction === 'down';
    for (var i = 0; i < count; i++) {
      land(size, {
        at: i * stagger,
        duration: dur,
        degree: down ? (count - 1 - i) : i,
        gain: 1 - i * 0.06                       // volgers iets zachter
      });
    }
  }

  /* ---------------------------------------------------------------- TEKST
     Tekst heeft geen doorschot, dus ook geen klap: alleen lucht.
     Zacht, hoog, kort — het geluid van papier, niet van glas. */
  function text(role, opts) {
    if (!init() || muted) return;
    opts = opts || {};
    var n = opts.count || 3;
    var stagger = (opts.stagger || 50) / 1000;
    var base = now() + (opts.at || 0) / 1000;
    for (var i = 0; i < n; i++) {
      var t0 = base + i * stagger;
      var src = ctx.createBufferSource();
      var len = Math.floor(ctx.sampleRate * 0.05);
      var b = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = b.getChannelData(0);
      for (var j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 2.5);
      src.buffer = b;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2400 + i * 120;
      f.Q.value = 1.4;
      var g = ctx.createGain();
      g.gain.value = (role === 'display' ? 0.055 : 0.032);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0);
    }
  }

  /* ---------------------------------------------------------------- VORM
     Een morph is één doorlopende beweging, dus één doorlopend geluid:
     een filterveeg die met de vorm meeloopt in plaats van een tik. */
  function morph(opts) {
    if (!init() || muted) return;
    opts = opts || {};
    var dur = (opts.duration || 520) / 1000;
    var t0 = now() + (opts.at || 0) / 1000;

    var src = ctx.createBufferSource();
    var len = Math.floor(ctx.sampleRate * (dur + 0.1));
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    src.buffer = b;

    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 3.2;
    f.frequency.setValueAtTime(300, t0);
    f.frequency.exponentialRampToValueAtTime(2600, t0 + dur * 0.62);
    f.frequency.exponentialRampToValueAtTime(700, t0 + dur);

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.075, t0 + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);

    // Aankomsttoon als de nieuwe vorm vaststaat.
    tone(SCALE[2], t0 + dur * 0.94, VOICE.large, 0.7);
  }

  /* ----------------------------------------------------------------- DRUK
     Het enige geluid dat NIET op 55% valt maar op 0 ms: een aanraking
     moet binnen één frame hoorbaar zijn, anders voelt het scherm traag. */
  function press(opts) {
    if (!init() || muted) return;
    opts = opts || {};
    var t0 = now() + (opts.at || 0) / 1000;
    tone(SCALE[6], t0, { root: 6, tail: 0.05, body: 0.07, air: 0.45, gain: 0.13 });
  }

  /* --------------------------------------------------------------- TERUG */
  function back(opts) {
    opts = opts || {};
    sequence(opts.count || 3, { direction: 'down', size: 'medium',
      stagger: 55, duration: 260, at: opts.at });
  }

  /* -------------------------------------------------------------- AMBIENT
     Ruimtetoon van de holobox: een lage drone met langzame zweving.
     Zo laag en zacht dat je hem pas mist als hij wegvalt. */
  var amb = null;
  function ambient(on) {
    if (!init()) return;
    if (on && !amb) {
      amb = { osc: [], gain: ctx.createGain() };
      amb.gain.gain.value = 0.0001;
      amb.gain.connect(master);
      amb.gain.gain.exponentialRampToValueAtTime(0.045, now() + 2.5);
      [55, 82.5, 110.02].forEach(function (f, i) {
        var o = ctx.createOscillator();
        o.type = i === 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        var g = ctx.createGain(); g.gain.value = i === 2 ? 0.18 : 0.5;
        o.connect(g); g.connect(amb.gain); o.start();
        amb.osc.push(o);
      });
    } else if (!on && amb) {
      var a = amb; amb = null;
      a.gain.gain.exponentialRampToValueAtTime(0.0001, now() + 1.2);
      setTimeout(function () { a.osc.forEach(function (o) { o.stop(); }); }, 1400);
    }
  }

  function mute(v) {
    muted = !!v;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05);
  }

  /* --------------------------------------------------- KOPPELING MET MOTION
     Verpakt de motion-primitieven zodat één aanroep beeld én geluid geeft.
     Gebruik deze in de app en in de video; dan kan het nooit uit sync raken. */
  function bind(M) {
    if (!M) return;
    var _land = M.land, _choreograph = M.choreograph, _textOn = M.textOn;

    M.land = function (el, opts) {
      opts = opts || {};
      var size = opts.size || M.sizeClassOf(el);
      var a = _land(el, opts);
      if (opts.silent !== true) {
        var t = a.effect.getTiming();
        land(size, { at: opts.delay || 0, duration: t.duration, degree: opts.degree || 0 });
      }
      return a;
    };

    M.choreograph = function (els, opts) {
      opts = opts || {};
      var anims = _choreograph(els, Object.assign({}, opts, { __silent: true }));
      if (opts.silent !== true) {
        sequence(els.length, {
          size: opts.size || 'medium',
          stagger: typeof opts.stagger === 'number' ? opts.stagger : M.STAGGER[opts.stagger || 'base'],
          duration: M.DUR[opts.duration || 'element'] || 320,
          direction: opts.direction
        });
      }
      return anims;
    };

    M.textOn = function (el, opts) {
      opts = opts || {};
      var anims = _textOn(el, opts);
      if (opts.silent !== true) {
        text(opts.role || 'heading', { at: opts.delay || 0, count: Math.min(5, anims.length) });
      }
      return anims;
    };
  }

  global.HWHAudio = {
    init: init, land: land, sequence: sequence, text: text, morph: morph,
    press: press, back: back, ambient: ambient, mute: mute, bind: bind,
    SCALE: SCALE, VOICE: VOICE,
    get ready() { return ready; },
    get muted() { return muted; },
    get context() { return ctx; }
  };
})(this);
