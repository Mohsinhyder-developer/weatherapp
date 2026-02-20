/**
 * Premium Animated Lottie Weather Icons
 * 
 * Uses lottie-web for smooth, professional weather animations.
 * Maps OpenWeatherMap icon codes → Lottie animations.
 * 
 * Style: Thin stroke, clean, minimal, glassmorphism-compatible.
 * Palette: White, soft cyan (#a8e6f0), warm gold (#f0c878).
 */

import lottie from 'lottie-web';

// ─── COLORS (Lottie uses 0-1 range) ───
const WHITE = [1, 1, 1, 1];
const WHITE_70 = [1, 1, 1, 0.7];
const GOLD = [0.94, 0.78, 0.47, 1];
const GOLD_60 = [0.94, 0.78, 0.47, 0.6];
const CYAN = [0.66, 0.9, 0.94, 1];
const BLUE = [0.83, 0.9, 1, 1];
const ORANGE = [0.91, 0.58, 0.35, 1];
const YELLOW = [0.94, 0.85, 0.47, 1];

// ─── Active Lottie instances tracker ───
const _instances = new Map();
let _idCounter = 0;

// ─── LOTTIE JSON BUILDER HELPERS ───

function anim(name, layers, duration = 90) {
  return {
    v: "5.7.1", fr: 30, ip: 0, op: duration,
    w: 128, h: 128, nm: name, ddd: 0,
    assets: [], layers: layers, markers: []
  };
}

function layer(name, shapes, ks = {}, opts = {}) {
  return {
    ddd: 0, ty: 4, nm: name, sr: 1, ao: 0,
    ks: {
      o: ks.o || val(100),
      r: ks.r || val(0),
      p: ks.p || val([64, 64, 0]),
      a: ks.a || val([0, 0, 0]),
      s: ks.s || val([100, 100, 100])
    },
    shapes,
    ip: opts.ip ?? 0,
    op: opts.op ?? 90,
    st: opts.st ?? 0,
    bm: 0
  };
}

function grp(items, tr = {}) {
  return {
    ty: "gr", nm: "g",
    it: [
      ...items,
      {
        ty: "tr",
        p: tr.p || val([0, 0]),
        a: tr.a || val([0, 0]),
        s: tr.s || val([100, 100]),
        r: tr.r || val(0),
        o: tr.o || val(100),
        sk: val(0), sa: val(0)
      }
    ]
  };
}

function el(x, y, w, h) {
  return { ty: "el", d: 1, p: val([x, y]), s: val([w, h || w]), nm: "e" };
}

function rc(x, y, w, h, r = 0) {
  return { ty: "rc", d: 1, p: val([x, y]), s: val([w, h]), r: val(r), nm: "r" };
}

function sh(vertices, inTangents, outTangents, closed = true) {
  return {
    ty: "sh", d: 1, nm: "p",
    ks: val({
      c: closed,
      v: vertices,
      i: inTangents,
      o: outTangents
    })
  };
}

function st(color, width = 2.5) {
  return {
    ty: "st", nm: "s",
    c: val(color.slice(0, 4)),
    o: val(color.length > 4 ? color[4] : 100),
    w: val(width),
    lc: 2, lj: 2, ml: 4
  };
}

function fl(color) {
  return {
    ty: "fl", nm: "f",
    c: val(color.slice(0, 4)),
    o: val(color.length > 4 ? color[4] : 100),
    r: 1
  };
}

function noFill() { return { ty: "no", nm: "nf" }; }

// Static value
function val(v) { return { a: 0, k: v }; }

// Keyframed value
function kf(keyframes) { return { a: 1, k: keyframes }; }

// Smooth keyframe
function frame(t, s, easeType = 'smooth') {
  const f = { t, s: Array.isArray(s) ? s : [s] };
  if (easeType === 'smooth') {
    f.i = { x: [0.667], y: [1] };
    f.o = { x: [0.333], y: [0] };
  } else if (easeType === 'linear') {
    f.i = { x: [1], y: [1] };
    f.o = { x: [0], y: [0] };
  }
  return f;
}

// End keyframe (no easing needed)
function endFrame(t, s) {
  return { t, s: Array.isArray(s) ? s : [s] };
}

// Position keyframe (3D)
function pFrame(t, s, easeType = 'smooth') {
  const f = { t, s };
  if (easeType === 'smooth') {
    f.i = { x: 0.667, y: 1 };
    f.o = { x: 0.333, y: 0 };
  } else if (easeType === 'linear') {
    f.i = { x: 1, y: 1 };
    f.o = { x: 0, y: 0 };
  }
  return f;
}

function pEnd(t, s) { return { t, s }; }


// ═══════════════════════════════════════════════
// ANIMATION DATA FACTORIES
// ═══════════════════════════════════════════════

// ─── SUN (CLEAR DAY) ───
function sunData() {
  // 8 rays at 45° intervals
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * 45) * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    const r1 = 20, r2 = 28;
    rays.push(
      sh(
        [[sin * r1, -cos * r1], [sin * r2, -cos * r2]],
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]],
        false
      )
    );
  }

  return anim("clear-day", [
    // Layer: Rotating rays
    layer("rays", [
      grp([...rays, st(GOLD, 2), noFill()])
    ], {
      r: kf([frame(0, 0, 'linear'), endFrame(90, 360)]) // full slow rotation
    }),
    // Layer: Sun body circle (pulsing)
    layer("body", [
      grp([el(0, 0, 28, 28), st(GOLD, 2.5), noFill()])
    ], {
      s: kf([frame(0, [97, 97, 100]), frame(45, [103, 103, 100]), endFrame(90, [97, 97, 100])])
    })
  ]);
}

// ─── MOON (CLEAR NIGHT) ───
function moonData() {
  // Crescent: two arcs creating the moon shape
  const crescent = sh(
    [[0, -18], [16, -4], [0, 18], [-6, 0]],
    [[-8, 0], [0, 8], [8, 0], [0, -6]],
    [[8, -2], [2, 8], [-8, -2], [0, -6]],
    true
  );

  return anim("clear-night", [
    // Layer: Crescent moon (floating)
    layer("moon", [
      grp([crescent, st(BLUE, 2), noFill()])
    ], {
      p: kf([pFrame(0, [64, 64, 0]), pFrame(45, [64, 61, 0]), pEnd(90, [64, 64, 0])])
    }),
    // Layer: Twinkling stars
    layer("stars", [
      grp([el(-22, -16, 3, 3), fl(BLUE)], {
        o: kf([frame(0, 40), frame(30, 100), frame(60, 40), endFrame(90, 40)])
      }),
      grp([el(-28, 6, 2.5, 2.5), fl(BLUE)], {
        o: kf([frame(0, 60), frame(40, 30), frame(70, 90), endFrame(90, 60)])
      }),
      grp([el(24, -20, 2, 2), fl(BLUE)], {
        o: kf([frame(0, 30), frame(25, 80), frame(55, 20), endFrame(90, 30)])
      }),
      grp([el(20, 14, 1.8, 1.8), fl(BLUE)], {
        o: kf([frame(0, 50), frame(35, 20), frame(65, 80), endFrame(90, 50)])
      })
    ])
  ]);
}

// ─── CLOUD (Shared shape) ───
function cloudShape() {
  return sh(
    [[-32, 12], [-34, -4], [-18, -18], [2, -14], [16, -22], [32, -10], [36, 4], [34, 12]],
    [[0, 0], [-2, 6], [-8, -2], [-6, -4], [-6, 0], [-6, -6], [0, -6], [2, -4]],
    [[-2, -6], [4, -8], [8, 4], [6, -2], [6, 4], [6, 4], [0, 4], [0, 0]],
    true
  );
}

// ─── CLOUDY ───
function cloudyData() {
  return anim("cloudy", [
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2.2), noFill()])
    ], {
      p: kf([pFrame(0, [64, 64, 0]), pFrame(45, [67, 64, 0]), pEnd(90, [64, 64, 0])])
    })
  ]);
}

// ─── FEW CLOUDS DAY ───
function fewCloudsDayData() {
  // Small sun rays behind
  const miniRays = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * 60) * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    miniRays.push(sh(
      [[sin * 13, -cos * 13], [sin * 19, -cos * 19]],
      [[0, 0], [0, 0]], [[0, 0], [0, 0]], false
    ));
  }

  return anim("few-clouds-day", [
    // Sun behind (top-left, smaller)
    layer("sun-body", [
      grp([el(0, 0, 18, 18), st(GOLD, 1.8), noFill()])
    ], {
      p: val([40, 38, 0]),
      o: kf([frame(0, 75), frame(45, 95), endFrame(90, 75)])
    }),
    layer("sun-rays", [
      grp([...miniRays, st(GOLD_60, 1.5), noFill()])
    ], {
      p: val([40, 38, 0]),
      r: kf([frame(0, 0, 'linear'), endFrame(90, 360)]),
      o: val(60)
    }),
    // Cloud in front
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2.2), noFill()])
    ], {
      p: kf([pFrame(0, [70, 70, 0]), pFrame(45, [73, 70, 0]), pEnd(90, [70, 70, 0])])
    })
  ]);
}

// ─── FEW CLOUDS NIGHT ───
function fewCloudsNightData() {
  const crescent = sh(
    [[0, -12], [10, -3], [0, 12], [-4, 0]],
    [[-5, 0], [0, 5], [5, 0], [0, -4]],
    [[5, -1], [1, 5], [-5, -1], [0, -4]],
    true
  );

  return anim("few-clouds-night", [
    // Moon behind
    layer("moon", [
      grp([crescent, st(BLUE, 1.6), noFill()])
    ], {
      p: val([38, 36, 0]),
      o: val(70)
    }),
    // Small stars
    layer("stars", [
      grp([el(-16, -10, 2, 2), fl(BLUE)], {
        o: kf([frame(0, 30), frame(30, 80), endFrame(90, 30)])
      }),
      grp([el(6, -18, 1.5, 1.5), fl(BLUE)], {
        o: kf([frame(0, 60), frame(50, 20), endFrame(90, 60)])
      })
    ], { p: val([38, 36, 0]) }),
    // Cloud in front
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2.2), noFill()])
    ], {
      p: kf([pFrame(0, [70, 70, 0]), pFrame(45, [73, 70, 0]), pEnd(90, [70, 70, 0])])
    })
  ]);
}

// ─── BROKEN CLOUDS (heavier overcast) ───
function brokenCloudsData() {
  const smallCloud = sh(
    [[-24, 8], [-26, -2], [-14, -12], [2, -10], [12, -16], [24, -6], [26, 2], [24, 8]],
    [[0, 0], [-1, 4], [-6, -1], [-4, -3], [-4, 0], [-4, -4], [0, -4], [1, -3]],
    [[-1, -4], [3, -6], [6, 3], [4, -1], [4, 3], [4, 3], [0, 3], [0, 0]],
    true
  );

  return anim("broken-clouds", [
    // Back cloud (lighter, higher)
    layer("cloud-back", [
      grp([smallCloud, st(WHITE_70, 1.6), noFill()])
    ], {
      p: kf([pFrame(0, [52, 52, 0]), pFrame(45, [55, 52, 0]), pEnd(90, [52, 52, 0])]),
      s: val([85, 85, 100]),
      o: val(60)
    }),
    // Front cloud
    layer("cloud-front", [
      grp([cloudShape(), st(WHITE, 2.2), noFill()])
    ], {
      p: kf([pFrame(0, [68, 68, 0]), pFrame(45, [71, 68, 0]), pEnd(90, [68, 68, 0])])
    })
  ]);
}

// ─── RAIN DROP LAYER FACTORY ───
function rainDropLayer(name, x, startY, endY, stOffset, dropW = 2, dropH = 7) {
  return layer(name, [
    grp([rc(0, 0, dropW, dropH, dropW / 2), st(CYAN, 1.8), noFill()])
  ], {
    p: kf([
      pFrame(0, [64 + x, startY, 0], 'linear'),
      pEnd(26, [64 + x - 2, endY, 0])
    ]),
    o: kf([
      frame(0, 0, 'linear'),
      frame(3, 85, 'linear'),
      frame(20, 70, 'linear'),
      endFrame(26, 0)
    ])
  }, { ip: 0, op: 90, st: stOffset });
}

// ─── RAIN ───
function rainData() {
  return anim("rain", [
    // Cloud
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2), noFill()])
    ], { p: val([64, 54, 0]) }),
    // Rain drops (staggered with layer time offsets)
    rainDropLayer("d1", -10, 68, 100, 0),
    rainDropLayer("d2", 2, 70, 104, -10),
    rainDropLayer("d3", 14, 68, 100, -20),
  ]);
}

// ─── SHOWER / HEAVY RAIN ───
function showerRainData() {
  return anim("shower", [
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2), noFill()])
    ], { p: val([64, 52, 0]) }),
    rainDropLayer("d1", -14, 66, 100, 0, 2, 8),
    rainDropLayer("d2", -4, 68, 104, -7, 2, 8),
    rainDropLayer("d3", 6, 66, 100, -14, 2, 8),
    rainDropLayer("d4", 16, 68, 104, -21, 2, 8),
  ]);
}

// ─── THUNDERSTORM ───
function thunderstormData() {
  // Lightning bolt path
  const bolt = sh(
    [[0, -8], [-5, 2], [2, 2], [-3, 14]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
    false
  );

  return anim("thunderstorm", [
    // Cloud
    layer("cloud", [
      grp([cloudShape(), st(WHITE_70, 2), noFill()])
    ], { p: val([64, 50, 0]) }),
    // Lightning bolt
    layer("bolt", [
      grp([bolt, st(YELLOW, 2.5), noFill()])
    ], {
      p: val([64, 68, 0]),
      o: kf([
        frame(0, 20), frame(6, 100), frame(10, 15),
        frame(14, 95), frame(20, 10), frame(60, 15),
        frame(65, 100), frame(70, 10),
        endFrame(90, 20)
      ]),
      s: kf([
        frame(0, [95, 95, 100]), frame(6, [105, 105, 100]),
        frame(14, [100, 100, 100]), frame(65, [105, 105, 100]),
        endFrame(90, [95, 95, 100])
      ])
    }),
    // Rain drops
    rainDropLayer("d1", -16, 64, 98, 0),
    rainDropLayer("d2", 18, 66, 100, -12),
  ]);
}

// ─── SNOW ───
function snowData() {
  // Snowflake: 3 crossed lines forming a star
  function snowflake(size) {
    const shapes = [];
    for (let i = 0; i < 3; i++) {
      const a = (i * 60) * Math.PI / 180;
      const cos = Math.cos(a), sin = Math.sin(a);
      shapes.push(sh(
        [[sin * size, -cos * size], [-sin * size, cos * size]],
        [[0, 0], [0, 0]], [[0, 0], [0, 0]], false
      ));
    }
    return shapes;
  }

  return anim("snow", [
    // Cloud
    layer("cloud", [
      grp([cloudShape(), st(WHITE, 2), noFill()])
    ], { p: val([64, 52, 0]) }),
    // Snowflake 1
    layer("sf1", [
      grp([...snowflake(4), st(BLUE, 1.3), noFill()])
    ], {
      p: kf([pFrame(0, [50, 68, 0]), pEnd(88, [48, 100, 0])]),
      r: kf([frame(0, 0, 'linear'), endFrame(88, 120)]),
      o: kf([frame(0, 0), frame(6, 90), frame(70, 80), endFrame(88, 0)])
    }),
    // Snowflake 2
    layer("sf2", [
      grp([...snowflake(3.5), st(BLUE, 1.2), noFill()])
    ], {
      p: kf([pFrame(0, [66, 70, 0]), pEnd(88, [64, 104, 0])]),
      r: kf([frame(0, 30, 'linear'), endFrame(88, -90)]),
      o: kf([frame(0, 0), frame(6, 85), frame(70, 75), endFrame(88, 0)])
    }, { st: -28 }),
    // Snowflake 3
    layer("sf3", [
      grp([...snowflake(3), st(BLUE, 1), noFill()])
    ], {
      p: kf([pFrame(0, [78, 66, 0]), pEnd(88, [76, 98, 0])]),
      r: kf([frame(0, -20, 'linear'), endFrame(88, 100)]),
      o: kf([frame(0, 0), frame(6, 80), frame(70, 70), endFrame(88, 0)])
    }, { st: -56 })
  ]);
}

// ─── MIST / FOG ───
function mistData() {
  function mistLine(y, w) {
    return sh([[-w / 2, y], [w / 2, y]], [[0, 0], [0, 0]], [[0, 0], [0, 0]], false);
  }

  return anim("mist", [
    layer("lines", [
      grp([mistLine(-18, 42), st(WHITE_70, 2), noFill()], {
        p: kf([frame(0, [0, 0]), frame(45, [4, 0]), endFrame(90, [0, 0])]),
        o: kf([frame(0, 55), frame(45, 85), endFrame(90, 55)])
      }),
      grp([mistLine(-6, 50), st(WHITE_70, 2), noFill()], {
        p: kf([frame(0, [0, 0]), frame(45, [-3, 0]), endFrame(90, [0, 0])]),
        o: kf([frame(0, 65), frame(50, 90), endFrame(90, 65)])
      }),
      grp([mistLine(6, 46), st(WHITE_70, 1.8), noFill()], {
        p: kf([frame(0, [0, 0]), frame(45, [5, 0]), endFrame(90, [0, 0])]),
        o: kf([frame(0, 45), frame(40, 75), endFrame(90, 45)])
      }),
      grp([mistLine(18, 36), st(WHITE_70, 1.5), noFill()], {
        p: kf([frame(0, [0, 0]), frame(45, [-4, 0]), endFrame(90, [0, 0])]),
        o: kf([frame(0, 35), frame(55, 65), endFrame(90, 35)])
      })
    ])
  ]);
}


// ═══════════════════════════════════════════
// OWM CODE → ANIMATION DATA MAPPING
// ═══════════════════════════════════════════

const ANIM_MAP = {
  '01d': sunData,
  '01n': moonData,
  '02d': fewCloudsDayData,
  '02n': fewCloudsNightData,
  '03d': cloudyData,
  '03n': cloudyData,
  '04d': brokenCloudsData,
  '04n': brokenCloudsData,
  '09d': showerRainData,
  '09n': showerRainData,
  '10d': rainData,
  '10n': rainData,
  '11d': thunderstormData,
  '11n': thunderstormData,
  '13d': snowData,
  '13n': snowData,
  '50d': mistData,
  '50n': mistData,
};

// Cache generated data
const _dataCache = {};

function getAnimData(code) {
  if (_dataCache[code]) return _dataCache[code];
  const factory = ANIM_MAP[code];
  if (!factory) return _dataCache['03d'] || (_dataCache['03d'] = cloudyData());
  const data = factory();
  _dataCache[code] = data;
  return data;
}


// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Returns placeholder HTML for a Lottie weather icon.
 * Call initLottieIcons() after inserting into DOM.
 */
export function getWeatherLottieHTML(iconCode, size = 48) {
  const id = `lw-${++_idCounter}`;
  return `<div class="lottie-weather" id="${id}" data-icon="${iconCode}" style="width:${size}px;height:${size}px"></div>`;
}

/**
 * Initializes all uninitialized .lottie-weather elements in the DOM.
 * Call after inserting HTML with getWeatherLottieHTML().
 */
export function initLottieIcons() {
  document.querySelectorAll('.lottie-weather:not(.lottie-init)').forEach(container => {
    const code = container.dataset.icon;
    if (!code) return;

    container.classList.add('lottie-init');

    try {
      const animData = getAnimData(code);
      const instance = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: JSON.parse(JSON.stringify(animData)) // deep clone to avoid mutation
      });
      _instances.set(container.id, instance);
    } catch (e) {
      console.warn('Lottie init error for', code, e);
    }
  });
}

/**
 * Destroys all active Lottie instances (call before re-rendering).
 */
export function destroyLottieIcons() {
  _instances.forEach((inst) => {
    try { inst.destroy(); } catch (e) { /* ignore */ }
  });
  _instances.clear();
}

export default { getWeatherLottieHTML, initLottieIcons, destroyLottieIcons };
