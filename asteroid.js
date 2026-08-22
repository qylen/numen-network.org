/* Numen Network — ambient background.
   A slow wireframe icosphere-derived body drifting behind page content,
   drawn once per frame with depth-bucketed strokes. Pauses when the tab is
   hidden; honors prefers-reduced-motion with a single static frame. */
(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };

  /* value noise + fbm, same family as the on-chain obj-asteroid generator */
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const smoo = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = smoo(x - xi), v = smoo(y - yi), w = smoo(z - zi);
    return lerp(
      lerp(lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u),
           lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
      lerp(lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u),
           lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v),
      w
    );
  };
  const fbm = (x, y, z) => {
    let n = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 4; o++) {
      n += amp * (vnoise(x * f, y * f, z * f) - 0.5);
      amp *= 0.5;
      f *= 2.1;
    }
    return n;
  };

  /* icosphere subdivision level 2 — light enough for an ambient backdrop */
  const T = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
    [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
    [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1],
  ].map(norm);
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let s = 0; s < 2; s++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? a + "_" + b : b + "_" + a;
      if (cache.has(key)) return cache.get(key);
      verts.push(norm([
        (verts[a][0] + verts[b][0]) / 2,
        (verts[a][1] + verts[b][1]) / 2,
        (verts[a][2] + verts[b][2]) / 2,
      ]));
      cache.set(key, verts.length - 1);
      return verts.length - 1;
    };
    const next = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }

  /* gentle displacement so it reads as terrain, not a sphere */
  verts = verts.map((v) => {
    const r = 1 + fbm(v[0] * 1.7 + 3.7, v[1] * 1.7 + 1.3, v[2] * 1.7 + 2.9) * 0.42;
    return [v[0] * r, v[1] * r, v[2] * r];
  });

  const eset = new Set();
  for (const [a, b, c] of faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) eset.add(p < q ? p + "_" + q : q + "_" + p);
  }
  const edges = [...eset].map((k) => k.split("_").map(Number));
  const n = verts.length;

  let w = 0, h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", () => { resize(); draw(lastT); }, { passive: true });
  resize();

  const stars = Array.from({ length: 130 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.4 + Math.random() * 1.05,
    p: Math.random() * 6.283,
  }));

  const root = document.documentElement;
  const accentRGB = () => (root.dataset.theme === "light" ? [6, 121, 168] : [41, 216, 240]);

  let lastT = 12;
  const draw = (t) => {
    lastT = t;
    ctx.clearRect(0, 0, w, h);

    const light = root.dataset.theme === "light";
    for (const s of stars) {
      const a = light
        ? 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.55 + s.p))
        : 0.07 + 0.15 * (0.5 + 0.5 * Math.sin(t * 0.6 + s.p));
      ctx.fillStyle = light
        ? `rgba(30,64,110,${a.toFixed(3)})`
        : `rgba(205,214,228,${a.toFixed(3)})`;
      ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
    }

    const cx = w * 0.74;
    const cy = h * 0.34;
    const R = Math.min(w, h) * (light ? 0.36 : 0.44);
    const ry = t * 0.05;
    const rx = 0.52 + Math.sin(t * 0.06) * 0.07;
    const cosy = Math.cos(ry), siny = Math.sin(ry);
    const cosx = Math.cos(rx), sinx = Math.sin(rx);
    const d = 3.4;

    const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = verts[i];
      const x1 = v[0] * cosy + v[2] * siny;
      const z1 = -v[0] * siny + v[2] * cosy;
      const y2 = v[1] * cosx - z1 * sinx;
      const z2 = v[1] * sinx + z1 * cosx;
      const s = d / (d - z2);
      px[i] = cx + x1 * s * R;
      py[i] = cy + y2 * s * R;
      pz[i] = z2;
    }

    const [ar, ag, ab] = accentRGB();
    /* six alpha buckets batched into six stroke paths */
    const buckets = [[], [], [], [], [], []];
    for (const e of edges) {
      const nd = Math.max(0, Math.min(1, ((pz[e[0]] + pz[e[1]]) / 2 + 1.6) / 3.2));
      buckets[Math.min(5, Math.floor(nd * 6))].push(e);
    }
    ctx.lineWidth = 1;
    for (let b = 0; b < 6; b++) {
      if (!buckets[b].length) continue;
      const a = (light ? 0.03 : 0.03) + Math.pow((b + 0.5) / 6, 1.7) * (light ? 0.13 : 0.22);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${a.toFixed(3)})`;
      ctx.beginPath();
      for (const e of buckets[b]) {
        ctx.moveTo(px[e[0]], py[e[0]]);
        ctx.lineTo(px[e[1]], py[e[1]]);
      }
      ctx.stroke();
    }
  };

  window.__numenRepaint = () => draw(lastT);

  new MutationObserver(() => draw(lastT)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  if (reducedMotion) {
    draw(12);
    return;
  }

  let running = false;
  const loop = (ms) => {
    if (!running) return;
    draw(ms * 0.001);
    requestAnimationFrame(loop);
  };
  const sync = () => {
    const should = !document.hidden;
    if (should && !running) {
      running = true;
      requestAnimationFrame(loop);
    } else if (!should) {
      running = false;
    }
  };
  document.addEventListener("visibilitychange", sync);

  sync();
})();
