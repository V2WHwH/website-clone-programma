/* ============================================================================
   HWH MOTION — het bewegingssysteem van de Holobox Experience Manager
   ----------------------------------------------------------------------------
   Eén wet: ALLES HEEFT MASSA.
   Niets verschijnt — alles arriveert. Niets verdwijnt — alles vertrekt.

   Dit bestand is de bron van waarheid voor beweging in zowel de touch-app
   als de tutorialvideo. Geen frameworks, geen build-stap.

   Twee afspeelmodi:
     • live      — normaal afspelen (app)
     • timeline  — frame-exact seeken (video-opname); dezelfde animaties,
                   maar gepauzeerd en bestuurd via één klok. Frame N is
                   daardoor altijd identiek, ook over meerdere opnames heen.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- CURVES
     Vier arriveer-/vertrekcurves plus twee gereedschapscurves.
     BEWUST GEEN veer- of bounce-curve: overshoot maken we met keyframes,
     niet met een doorschietende bezier. Een bezier schiet op álle
     eigenschappen tegelijk door en is niet per elementgrootte te doseren;
     keyframes wel. Zie OVERSHOOT hieronder. */
  var EASE = {
    enter:   'cubic-bezier(0.16, 1, 0.30, 1)',   // outExpo — de werkpaard-curve
    settle:  'cubic-bezier(0.33, 1, 0.68, 1)',   // outCubic — de laatste 22%
    exit:    'cubic-bezier(0.55, 0, 1, 0.45)',   // inCubic — versnelt weg
    move:    'cubic-bezier(0.65, 0, 0.35, 1)',   // inOutCubic — A→B in beeld
    precise: 'cubic-bezier(0.40, 0, 0.20, 1)',   // chrome, panelen, schakelaars
    lux:     'cubic-bezier(0.22, 0.80, 0.20, 1)' // trage, dure onthulling
  };

  /* ------------------------------------------------------------- DURATIONS
     Een ladder, geen losse getallen. Elke trede ±1,6×.
     Regel: grotere reisafstand = een trede hoger (zie durationFor). */
  var DUR = {
    feedback: 120,   // druk, schakelaar — moet binnen 1 frame voelbaar zijn
    micro:    200,   // klein element aan/uit
    element:  320,   // standaard elementarrivatie  ← default
    surface:  520,   // paneel, kaart, groot vlak
    scene:    820,   // scènewissel
    hero:    1750    // held-choreografie (Galaxy Tiles)
  };

  var STAGGER = { tight: 40, base: 80, loose: 120, dramatic: 180 };

  /* -------------------------------------------------------------- OVERSHOOT
     De belangrijkste regel van het systeem.

     1. ÉÉN overshoot, nooit twee. Eén keer voorbij het doel en dan tot rust.
        Een tweede stuiter leest als speelgoed; één doorschot leest als massa.
     2. De doorschot schaalt OMGEKEERD met de elementgrootte. Grote dingen
        schieten nauwelijks door — dat is hoe zwaarte eruitziet.
     3. Rotatie-overshoot ≤ 2°, en alleen als het element ook draaiend aankwam.

     De landings-tijdlijn (identiek aan Galaxy Tiles in het product):
        0%   startpose, buiten doel
       55%   voorbij het doel — de overshoot        (curve: enter)
       78%   net terug ónder doel, 25% tegenslag
      100%   exact op doel                          (curve: settle)

     Die tegenslag op 78% is wat "tot rust komen" verkoopt in plaats van
     "terugklappen". Zonder die stap voelt de landing hard. */
  var OVERSHOOT = {
    small:      { scale: 0.030, translate: 8, rotate: 2.0 },   // < 200px
    medium:     { scale: 0.020, translate: 6, rotate: 1.5 },   // 200–600px
    large:      { scale: 0.012, translate: 4, rotate: 1.0 },   // > 600px
    fullscreen: { scale: 0.006, translate: 0, rotate: 0 },     // schermvullend
    none:       { scale: 0,     translate: 0, rotate: 0 }      // tekst, data
  };

  var PHASE = { overshoot: 0.55, counter: 0.78, counterAmount: 0.25 };

  /* Vaste momenten binnen een landing (fracties van de duur).
     FILTERS lossen op bij de overshoot — een blur die tijdens het settelen
     nog hangt maakt het beeld modderig. GEOMETRIE settelt door tot 100%.
     OPACITY is klaar op 22%: zichtbaarheid is geen entree-effect; je wilt
     het ding zien reizen, niet zien opdoemen terwijl het al stilstaat. */
  var RESOLVE = { opacity: 0.22, filter: 0.55, geometry: 1 };

  /* Intensiteit — één globale knop over het hele systeem. */
  var INTENSITY = { subtle: 0.78, immersive: 1, showcase: 1.28 };

  /* ------------------------------------------------------------------ UTIL */
  function sizeClassOf(el) {
    if (!el || !el.getBoundingClientRect) return 'medium';
    var r = el.getBoundingClientRect();
    var m = Math.max(r.width, r.height);
    if (!m) return 'medium';
    if (m >= Math.min(innerWidth, innerHeight) * 0.9) return 'fullscreen';
    if (m > 600) return 'large';
    if (m < 200) return 'small';
    return 'medium';
  }

  /* Afstandswet: hoe verder iets reist, hoe langer het onderweg is.
     Zonder deze wet voelen lange slides gehaast en korte slides traag. */
  function durationFor(base, travelPx) {
    var t = Math.abs(travelPx || 0);
    return Math.round(base * (1 + Math.min(t, 1400) / 1200));
  }

  /* Deterministische ruis: dezelfde seed = dezelfde choreografie, altijd.
     Onmisbaar voor video: elke opname van scène 4 is identiek. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tf(p) {
    var s = '';
    if (p.x || p.y || p.z) s += 'translate3d(' + (p.x || 0) + 'px,' + (p.y || 0) + 'px,' + (p.z || 0) + 'px) ';
    if (p.rotX) s += 'rotateX(' + p.rotX + 'deg) ';
    if (p.rotY) s += 'rotateY(' + p.rotY + 'deg) ';
    if (p.rotZ) s += 'rotateZ(' + p.rotZ + 'deg) ';
    if (p.scale != null && p.scale !== 1) s += 'scale(' + p.scale + ') ';
    return s.trim() || 'none';
  }

  var sign = function (v) { return v > 0 ? 1 : v < 0 ? -1 : 0; };

  /* ============================================================== 1. LANDEN
     land(el, opts) — de kernbeweging: aankomen, doorschieten, tot rust komen.

     opts.from      startpose {x,y,z,rotX,rotY,rotZ,scale,blur}
     opts.size      'small'|'medium'|'large'|'fullscreen'|'none' (auto)
     opts.duration  ms of naam uit DUR ('element' default)
     opts.delay     ms
     opts.intensity 'subtle'|'immersive'|'showcase'
     opts.overshoot expliciete factor (0 = uit)                                */
  function landKeyframes(opts) {
    var from = opts.from || {};
    var os = OVERSHOOT[opts.size || 'medium'] || OVERSHOOT.medium;
    var k = opts.overshoot != null ? opts.overshoot : 1;
    var mul = INTENSITY[opts.intensity] || 1;

    // De doorschot gaat door in de reisrichting: kwam het van onder, dan
    // schiet het bóven het doel door.
    var osY = -sign(from.y || 0) * os.translate * k * mul;
    var osX = -sign(from.x || 0) * os.translate * k * mul;
    var osS = os.scale * k * mul;
    var osR = -sign(from.rotZ || 0) * Math.min(os.rotate * k, 2);

    var startScale = from.scale != null ? from.scale : (osS ? 1 - osS * 3 : 1);

    return [
      { offset: 0, opacity: from.opacity != null ? from.opacity : 0,
        filter: from.blur ? 'blur(' + from.blur + 'px)' : 'none',
        transform: tf({ x: from.x, y: from.y, z: from.z, rotX: from.rotX,
                        rotY: from.rotY, rotZ: from.rotZ, scale: startScale }),
        easing: EASE.enter },

      { offset: RESOLVE.opacity, opacity: 1, easing: EASE.enter },

      // 55% — voorbij het doel. Filters zijn hier klaar.
      { offset: PHASE.overshoot, opacity: 1, filter: 'none',
        transform: tf({ x: osX, y: osY, rotX: (from.rotX || 0) * 0.06,
                        rotY: (from.rotY || 0) * 0.06, rotZ: osR,
                        scale: 1 + osS }),
        easing: EASE.settle },

      // 78% — tegenslag op 25%: dít is het "tot rust komen".
      { offset: PHASE.counter,
        transform: tf({ x: -osX * PHASE.counterAmount, y: -osY * PHASE.counterAmount,
                        rotZ: -osR * PHASE.counterAmount,
                        scale: 1 - osS * PHASE.counterAmount }),
        easing: EASE.settle },

      { offset: 1, opacity: 1, filter: 'none', transform: 'none' }
    ];
  }

  function land(el, opts) {
    opts = opts || {};
    var size = opts.size || sizeClassOf(el);
    var base = typeof opts.duration === 'number' ? opts.duration
             : DUR[opts.duration || 'element'];
    var travel = Math.max(Math.abs((opts.from || {}).y || 0), Math.abs((opts.from || {}).x || 0));
    var dur = opts.duration === 'auto' || opts.autoDuration !== false
            ? durationFor(base, travel) : base;
    return el.animate(landKeyframes({ from: opts.from, size: size,
        overshoot: opts.overshoot, intensity: opts.intensity }), {
      duration: Math.round(dur * (opts.timeScale || 1)),
      delay: opts.delay || 0,
      easing: 'linear',              // de curves zitten per keyframe
      fill: 'both',
      composite: opts.composite || 'replace'
    });
  }

  /* Vertrekken — spiegelbeeld, maar korter en zonder overshoot.
     Wat weggaat hoeft niet te settelen; het moet uit de weg. */
  function leave(el, opts) {
    opts = opts || {};
    var to = opts.to || { y: 40, scale: 0.94 };
    var base = typeof opts.duration === 'number' ? opts.duration : DUR[opts.duration || 'micro'];
    return el.animate([
      { opacity: 1, transform: 'none', filter: 'none', easing: EASE.exit },
      { opacity: 0, transform: tf(to), filter: to.blur ? 'blur(' + to.blur + 'px)' : 'none' }
    ], { duration: base, delay: opts.delay || 0, fill: 'both',
         composite: opts.composite || 'replace' });
  }

  /* ============================================================== 2. TEKST
     Lezen kost tijd, dus tekst heeft eigen wetten:

     • Tekst arriveert NA zijn drager — op 60% van diens landing.
     • Tekst STIJGT in beeld, valt nooit. Vallende tekst leest als een fout.
     • Tekst heeft GEEN overshoot. Nooit. Doorschietende letters zijn
       onleesbaar en goedkoop; tekst gaat rechtstreeks op 'settle' naar doel.
     • De maskerrand loopt 20% door onder de regel, anders knipt hij staarten
       van de p, g en j af.                                                    */
  var TEXT_ROLE = {
    display: { unit: 'word', stagger: 60, rise: 0.32, dur: 460, mask: true },
    heading: { unit: 'line', stagger: 45, rise: 0.28, dur: 420, mask: true },
    body:    { unit: 'line', stagger: 40, rise: 0.20, dur: 380, mask: false },
    label:   { unit: 'block', stagger: 0, rise: 0.14, dur: 260, mask: false },
    number:  { unit: 'char', stagger: 28, rise: 0.30, dur: 380, mask: true }
  };

  function splitText(el, unit) {
    if (el.__hwhSplit) return el.__hwhSplit;
    el.__hwhOriginal = el.innerHTML;
    var parts = [];
    if (unit === 'block') {
      parts = [el];
    } else {
      // Per kindknoop werken in plaats van textContent pakken: anders
      // sneuvelt opmaak in de tekst — een <br> in een titel verdwijnt en
      // de woorden eromheen plakken aan elkaar.
      var source = Array.prototype.slice.call(el.childNodes);
      el.textContent = '';
      source.forEach(function (node) {
        if (node.nodeType !== 3) { el.appendChild(node); return; }  // <br>, <b>, …
        var tokens = unit === 'char' ? node.nodeValue.split('') : node.nodeValue.split(/(\s+)/);
        tokens.forEach(function (tok) {
          if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
          if (!tok) return;
          var span = document.createElement('span');
          span.className = 'hwh-t';
          span.textContent = tok;
          el.appendChild(span);
          parts.push(span);
        });
      });
      if (unit === 'line') {
        // Regels afleiden uit de werkelijke layout: woorden met dezelfde
        // bovenkant horen bij dezelfde regel.
        var lines = [], cur = null, top = null;
        parts.forEach(function (w) {
          var t = w.offsetTop;
          if (top === null || Math.abs(t - top) > 2) { cur = []; lines.push(cur); top = t; }
          cur.push(w);
        });
        parts = lines;
      }
    }
    el.__hwhSplit = parts;
    return parts;
  }

  function textOn(el, opts) {
    opts = opts || {};
    var role = TEXT_ROLE[opts.role || 'heading'];
    var unit = opts.unit || role.unit;
    var groups = splitText(el, unit);
    var em = parseFloat(getComputedStyle(el).fontSize) || 16;
    var rise = (opts.rise != null ? opts.rise : role.rise) * em;
    var stagger = opts.stagger != null ? opts.stagger : role.stagger;
    var dur = opts.duration || role.dur;
    var mask = opts.mask != null ? opts.mask : role.mask;
    var anims = [];

    groups.forEach(function (g, i) {
      var els = Array.isArray(g) ? g : [g];
      els.forEach(function (node) {
        var frames = mask
          ? [{ opacity: 0, transform: 'translateY(' + rise + 'px)',
               clipPath: 'inset(0 0 100% 0)' },
             { opacity: 1, transform: 'translateY(0)',
               clipPath: 'inset(0 0 -20% 0)' }]                 // -20%: staarten heel
          : [{ opacity: 0, transform: 'translateY(' + rise + 'px)' },
             { opacity: 1, transform: 'translateY(0)' }];
        anims.push(node.animate(frames, {
          duration: dur,
          delay: (opts.delay || 0) + i * stagger,
          easing: EASE.settle,          // géén overshoot op tekst
          fill: 'both'
        }));
      });
    });
    return anims;
  }

  /* Tekst vertrekt als één blok — je leest hem toch niet meer weg. */
  function textOff(el, opts) {
    opts = opts || {};
    var em = parseFloat(getComputedStyle(el).fontSize) || 16;
    return el.animate([
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(' + 0.12 * em + 'px)' }
    ], { duration: opts.duration || 220, delay: opts.delay || 0,
         easing: EASE.exit, fill: 'both' });
  }

  /* ============================================================== 3. VORM
     Drie klassen vormverandering. Regels die voor alle drie gelden:
       • minimaal 420ms — het oog volgt de vorm en heeft tijd nodig
       • een morph is een solo-gebeurtenis, nooit onderdeel van een stagger
       • de eindtoestand moet statisch bereikbaar zijn (geen animatie-only)   */

  /* 3a. Container-morph: hetzelfde element groeit van tegel naar vlak.
     De inhoud kruisvervaagt pas in de laatste 40%, zodat er geen zwart
     frame tussen zit. Dit is de tegel→video-overgang uit het product. */
  function morphContainer(fromRect, toRect, opts) {
    opts = opts || {};
    var node = opts.node;
    var dur = opts.duration || DUR.surface;
    var a = node.animate([
      { left: fromRect.left + 'px', top: fromRect.top + 'px',
        width: fromRect.width + 'px', height: fromRect.height + 'px',
        borderRadius: (opts.fromRadius || 16) + 'px' },
      { left: toRect.left + 'px', top: toRect.top + 'px',
        width: toRect.width + 'px', height: toRect.height + 'px',
        borderRadius: (opts.toRadius || 0) + 'px' }
    ], { duration: dur, easing: EASE.enter, fill: 'both' });
    if (opts.incoming) {
      opts.incoming.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.6 },
                             { opacity: 1, offset: 1 }],
        { duration: dur, easing: EASE.settle, fill: 'both' });
    }
    return a;
  }

  /* 3b. Silhouet-morph: rond ↔ pil ↔ rechthoek.
     Maat en straal lopen op VERSCHILLENDE curves, met 60ms verschil: de
     vorm "beslist" zich net ná de landing. Dat leest als opzet in plaats
     van rubber. */
  function morphSilhouette(el, to, opts) {
    opts = opts || {};
    var dur = Math.max(420, opts.duration || DUR.surface);
    var from = opts.from || {};
    var size = el.animate([
      { width: from.width, height: from.height },
      { width: to.width, height: to.height }
    ], { duration: dur, easing: EASE.enter, fill: 'both' });
    el.animate([
      { borderRadius: from.radius },
      { borderRadius: to.radius }
    ], { duration: dur - 60, delay: 60, easing: EASE.precise, fill: 'both' });
    return size;
  }

  /* 3c. Symbool-morph: SVG-pad naar SVG-pad (gelijk aantal punten). */
  function morphPath(pathEl, d2, opts) {
    opts = opts || {};
    return pathEl.animate([{ d: 'path("' + pathEl.getAttribute('d') + '")' },
                           { d: 'path("' + d2 + '")' }],
      { duration: opts.duration || 260, easing: EASE.move, fill: 'both' });
  }

  /* ======================================================= 4. CHOREOGRAFIE
     • Eén held: één element krijgt de volle landing, de rest 70% overshoot
       en 85% duur. Twee helden in één beeld = geen held.
     • Maximaal 5 stagger-groepen; daarboven wordt volgorde ruis → gebruik
       'wave' of 'random'.
     • Richting draagt betekenis: menu van onderen, detail uit de aangeraakte
       tegel, terug = omkering van heen.                                      */
  var SEQUENCE = {
    stagger:   function (els) { return els.map(function (_, i) { return i; }); },
    bottomUp:  function (els) { return rank(els, function (r) { return -r.top; }); },
    topDown:   function (els) { return rank(els, function (r) { return r.top; }); },
    leftRight: function (els) { return rank(els, function (r) { return r.left; }); },
    centerOut: function (els) { return rank(els, function (r) {
      return Math.hypot(r.left + r.width / 2 - innerWidth / 2,
                        r.top + r.height / 2 - innerHeight / 2); }); },
    wave:      function (els) { return rank(els, function (r) { return r.top * 0.7 + r.left * 0.3; }); },
    random:    function (els, seed) {
      var rand = rng(seed || 7), idx = els.map(function (_, i) { return i; });
      for (var i = idx.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
      }
      return idx;
    }
  };
  function rank(els, key) {
    var keyed = els.map(function (e, i) { return { i: i, k: key(e.getBoundingClientRect()) }; });
    keyed.sort(function (a, b) { return a.k - b.k; });
    var out = [];
    keyed.forEach(function (e, r) { out[e.i] = r; });
    return out;
  }

  function choreograph(els, opts) {
    opts = opts || {};
    els = Array.prototype.slice.call(els);
    var order = (SEQUENCE[opts.sequence] || SEQUENCE.stagger)(els, opts.seed);
    var step = typeof opts.stagger === 'number' ? opts.stagger : STAGGER[opts.stagger || 'base'];
    var hero = opts.hero;
    var anims = [];
    els.forEach(function (el, i) {
      var isHero = hero === el || (opts.heroIndex === i);
      anims.push(land(el, {
        from: opts.from || { y: 220, rotZ: -6, scale: 0.92 },
        size: opts.size,
        intensity: opts.intensity,
        duration: opts.duration,
        overshoot: isHero ? 1 : 0.7,                       // volgers doseren
        timeScale: isHero ? 1 : 0.85,
        delay: (opts.delay || 0) + (isHero ? 0 : order[i] * step + (hero ? 120 : 0))
      }));
    });
    return anims;
  }

  /* ========================================================== 5. TIJDLIJN
     Voor video: verzamel animaties met hun starttijd en stuur ze met één
     klok aan. seek(t) rendert exact frame t — reproduceerbaar tussen
     opnames door, wat een montage überhaupt mogelijk maakt.                  */
  function timeline(opts) {
    opts = opts || {};
    var items = [];      // { at, make, anims }
    var built = false;
    var duration = 0;

    var api = {
      add: function (at, make) { items.push({ at: at, make: make, anims: null }); return api; },
      build: function () {
        items.forEach(function (it) {
          var res = it.make();
          it.anims = (Array.isArray(res) ? res : [res]).filter(Boolean);
          it.anims.forEach(function (a) {
            a.pause();
            var t = a.effect.getTiming();
            var end = it.at + (t.delay || 0) + (t.duration || 0);
            if (end > duration) duration = end;
          });
        });
        built = true;
        return api;
      },
      seek: function (t) {
        if (!built) api.build();
        items.forEach(function (it) {
          it.anims.forEach(function (a) {
            var local = t - it.at;
            var tt = a.effect.getTiming();
            var total = (tt.delay || 0) + (tt.duration || 0);
            a.currentTime = Math.max(0, Math.min(total, local));
          });
        });
        return api;
      },
      play: function () {
        if (!built) api.build();
        var t0 = performance.now();
        (function tick() {
          var t = performance.now() - t0;
          api.seek(t);
          if (t < duration) requestAnimationFrame(tick);
        })();
        return api;
      },
      get duration() { return built ? duration : (api.build(), duration); },
      get items() { return items; }
    };
    return api;
  }

  /* ================================================ 6. TUTORIAL-LAAG (video)
     De video moet dezelfde hand hebben als het product. Daarom leent de
     tutorial dezelfde curves en dezelfde landingswet. Extra wetten:
       • nooit een harde cut in een UI-tutorial — dip of veeg
       • de cursor VERTRAAGT het doel in en PAUZEERT 200ms vóór de druk;
         die pauze is wat de kijker de handeling laat lezen
       • zoom op UI maximaal 1,4× over 1200ms — sneller wordt misselijk     */
  var TUTORIAL = {
    cut:        { duration: 320, easing: EASE.move },
    callout:    { duration: 420, from: 1.6, breathe: 0.04, breatheMs: 2600 },
    lowerThird: { bar: 240, textAt: 0.6, stagger: 45 },
    cursor:     { travel: 620, pauseBeforePress: 200, press: 120 },
    zoom:       { max: 1.4, duration: 1200 }
  };

  /* Aandachtsring om een UI-element: landt met één doorschot en ademt
     daarna rustig door zolang hij in beeld is. */
  function callout(el, opts) {
    opts = opts || {};
    var c = TUTORIAL.callout;
    var a = el.animate([
      { opacity: 0, transform: 'scale(' + c.from + ')', easing: EASE.enter },
      { opacity: 1, offset: 0.3 },
      { opacity: 1, transform: 'scale(' + (1 + OVERSHOOT.small.scale) + ')', offset: PHASE.overshoot, easing: EASE.settle },
      { transform: 'scale(' + (1 - OVERSHOOT.small.scale * PHASE.counterAmount) + ')', offset: PHASE.counter },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: opts.duration || c.duration, delay: opts.delay || 0, fill: 'both' });
    if (opts.breathe !== false) {
      a.finished.then(function () {
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + (1 + c.breathe) + ')' },
                    { transform: 'scale(1)' }],
          { duration: c.breatheMs, iterations: Infinity, easing: EASE.move });
      }).catch(function () {});
    }
    return a;
  }

  /* Cursor/hand naar een doel: vertragen, pauzeren, dan pas drukken. */
  function cursorTo(cursorEl, targetEl, opts) {
    opts = opts || {};
    var t = TUTORIAL.cursor;
    var from = cursorEl.getBoundingClientRect();
    var to = targetEl.getBoundingClientRect();
    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    var dur = durationFor(t.travel, Math.hypot(dx, dy));
    var move = cursorEl.animate(
      [{ transform: 'translate(0,0)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' }],
      { duration: dur, delay: opts.delay || 0, easing: EASE.move, fill: 'both' });
    if (opts.press !== false) {
      cursorEl.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)' },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.88)', offset: 0.5 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)' }
      ], { duration: t.press * 2, delay: (opts.delay || 0) + dur + t.pauseBeforePress,
           easing: EASE.precise, fill: 'both' });
    }
    return { move: move, totalMs: dur + t.pauseBeforePress + t.press * 2 };
  }

  global.HWHMotion = {
    EASE: EASE, DUR: DUR, STAGGER: STAGGER, OVERSHOOT: OVERSHOOT,
    PHASE: PHASE, RESOLVE: RESOLVE, INTENSITY: INTENSITY,
    TEXT_ROLE: TEXT_ROLE, SEQUENCE: SEQUENCE, TUTORIAL: TUTORIAL,
    land: land, landKeyframes: landKeyframes, leave: leave,
    textOn: textOn, textOff: textOff, splitText: splitText,
    morphContainer: morphContainer, morphSilhouette: morphSilhouette, morphPath: morphPath,
    choreograph: choreograph, timeline: timeline,
    callout: callout, cursorTo: cursorTo,
    durationFor: durationFor, sizeClassOf: sizeClassOf, rng: rng
  };
})(this);
