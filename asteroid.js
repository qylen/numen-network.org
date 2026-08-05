/* Magic numbers throughout are design tuned. Change them and the look drifts. */
(() => {
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };

  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };

  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const sm = (t) => t * t * (3 - 2 * t);
    const u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
    const lerp = (a, b, t) => a + (b - a) * t;
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

  const t0 = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, t0, 0], [1, t0, 0], [-1, -t0, 0], [1, -t0, 0],
    [0, -1, t0], [0, 1, t0], [0, -1, -t0], [0, 1, -t0],
    [t0, 0, -1], [t0, 0, 1], [-t0, 0, -1], [-t0, 0, 1]
  ].map(norm);
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  for (let s = 0; s < 3; s++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? a + '_' + b : b + '_' + a;
      if (cache.has(key)) return cache.get(key);
      verts.push(norm([
        (verts[a][0] + verts[b][0]) / 2,
        (verts[a][1] + verts[b][1]) / 2,
        (verts[a][2] + verts[b][2]) / 2
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
  verts = verts.map((v) => {
    const r = 1 + fbm(v[0] * 1.8 + 3.7, v[1] * 1.8 + 1.3, v[2] * 1.8 + 2.9) * 0.55;
    return [v[0] * r, v[1] * r, v[2] * r];
  });
  const eset = new Set();
  for (const [a, b, c] of faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      eset.add(p < q ? p + '_' + q : q + '_' + p);
    }
  }
  const edges = [...eset].map((k) => k.split('_').map(Number));
  const n = verts.length;

  const makeView = (canvas, opts) => {
    const ctx = canvas.getContext('2d');
    const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
    let w = 0, h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = opts.fixed ? window.innerWidth : canvas.clientWidth;
      h = opts.fixed ? window.innerHeight : canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();

    const stars = opts.stars
      ? Array.from({ length: 150 }, () => ({
          x: Math.random(), y: Math.random(),
          r: 0.4 + Math.random() * 1.1, p: Math.random() * 6.283
        }))
      : [];

    return (t) => {
      const ac = accent();
      const ar = parseInt(ac.slice(1, 3), 16);
      const ag = parseInt(ac.slice(3, 5), 16);
      const ab = parseInt(ac.slice(5, 7), 16);

      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const a = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.6 + s.p));
        ctx.fillStyle = `rgba(205,214,228,${a.toFixed(3)})`;
        ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
      }

      const cx = w * (opts.cx || 0.5), cy = h * opts.cy, R = Math.min(w, h) * opts.R;
      const ry = t * opts.speed, rx = 0.5 + Math.sin(t * 0.07) * 0.08;
      const cosy = Math.cos(ry), siny = Math.sin(ry);
      const cosx = Math.cos(rx), sinx = Math.sin(rx);
      const d = 3.4;
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

      /* Alpha buckets batch strokes, one path per bucket beats one per edge. */
      const buckets = [[], [], [], [], [], []];
      for (const e of edges) {
        const zAvg = (pz[e[0]] + pz[e[1]]) / 2;
        const nd = Math.max(0, Math.min(1, (zAvg + 1.6) / 3.2));
        buckets[Math.min(5, Math.floor(nd * 6))].push(e);
      }
      ctx.lineWidth = 1;
      for (let b = 0; b < 6; b++) {
        if (!buckets[b].length) continue;
        const a = opts.base + Math.pow((b + 0.5) / 6, 1.6) * opts.gain;
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${a.toFixed(3)})`;
        ctx.beginPath();
        for (const e of buckets[b]) {
          ctx.moveTo(px[e[0]], py[e[0]]);
          ctx.lineTo(px[e[1]], py[e[1]]);
        }
        ctx.stroke();
      }
    };
  };

  const drawSky = makeView(document.getElementById('sky'),
    { fixed: true, stars: true, cy: 0.52, R: 0.46, speed: 0.12, base: 0.04, gain: 0.30 });

  const rockCanvas = document.getElementById('rock');
  if (rockCanvas) {
    const drawRock = makeView(rockCanvas,
      { fixed: false, stars: false, cx: 0.42, cy: 0.5, R: 0.32, speed: 0.07, base: 0.10, gain: 0.55 });
    const rockStill = () => drawRock(2.2);
    window.__rockStill = rockStill;
    window.addEventListener('resize', rockStill);
    rockStill();
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawSky(0);
    return;
  }
  const loop = (ms) => {
    drawSky(ms * 0.001);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
