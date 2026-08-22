/* Numen Network — interactive Proof-of-Scan simulator.
   A faithful, browser-sized approximation of the mining pipeline: a nonce
   seeds a deterministic asteroid mesh (icosphere + fBm displacement), the
   surface is sampled, and a work hash is derived. Real on-chain parameters:
   4,096 samples · 23 quantized dimensions · subdivision level pinned by the
   protocol. Pauses offscreen / hidden; honors prefers-reduced-motion. */
(() => {
  "use strict";

  const canvas = document.getElementById("sim-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const slider = document.getElementById("sim-nonce");
  const valDisplay = document.getElementById("sim-nonce-val");
  const seedDisplay = document.getElementById("sim-seed");
  const hashDisplay = document.getElementById("sim-hash");
  const meshDisplay = document.getElementById("sim-mesh");

  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- utils */
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const mix32 = (h) => {
    h ^= h >>> 16;
    h = Math.imul(h, 0x21f0aaad);
    h ^= h >>> 15;
    h = Math.imul(h, 0x735a2d97);
    h ^= h >>> 15;
    return h >>> 0;
  };
  const nonceHash = (label, nonce) =>
    mix32(Math.imul(nonce ^ 0x9e3779b9, 0x85ebca6b) ^ mix32(label.length * 2654435761));
  const hex32 = (v) => (v >>> 0).toString(16).padStart(8, "0");

  const smoo = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const lattice = (ix, iy, iz, salt) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + salt * 53.13) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x, y, z, salt) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = smoo(x - xi), v = smoo(y - yi), w = smoo(z - zi);
    return lerp(
      lerp(lerp(lattice(xi, yi, zi, salt), lattice(xi + 1, yi, zi, salt), u),
           lerp(lattice(xi, yi + 1, zi, salt), lattice(xi + 1, yi + 1, zi + 1, salt), u), v),
      lerp(lerp(lattice(xi, yi, zi + 1, salt), lattice(xi + 1, yi, zi + 1, salt), u),
           lerp(lattice(xi, yi + 1, zi + 1, salt), lattice(xi + 1, yi + 1, zi + 1, salt), u), v),
      w
    );
  };

  /* ----------------------------------------------- deterministic mesh */
  const createMesh = (nonce) => {
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
    for (let s = 0; s < 3; s++) {
      const cache = new Map();
      const mid = (a, b) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
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

    /* nonce-derived shape parameters */
    const ox = (nonceHash("ox", nonce) % 3600) / 100;
    const oy = (nonceHash("oy", nonce) % 3600) / 100;
    const oz = (nonceHash("oz", nonce) % 3600) / 100;
    const freq = 2.4 + (nonceHash("fq", nonce) % 160) / 100;
    const amp = 0.18 + (nonceHash("am", nonce) % 16) / 100;

    verts = verts.map((v) => {
      const d =
        noise(v[0] * freq + ox, v[1] * freq + oy, v[2] * freq + oz, nonce % 997) - 0.48;
      const r = 1 + d * amp;
      return [v[0] * r, v[1] * r, v[2] * r];
    });

    const eset = new Set();
    for (const [a, b, c] of faces) {
      for (const [p, q] of [[a, b], [b, c], [c, a]]) eset.add(p < q ? `${p}_${q}` : `${q}_${p}`);
    }
    const edges = [...eset].map((k) => k.split("_").map(Number));
    const sampleStride = Math.max(1, Math.floor(verts.length / 56));
    const samples = [];
    for (let i = 0; i < verts.length; i += sampleStride) samples.push(i);

    return { verts, edges, samples };
  };

  /* ---------------------------------------------------------- render */
  let w = 400, h = 300;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let rotationAngle = 0.8;
  let currentMesh = null;

  const resize = () => {
    w = canvas.clientWidth || canvas.width || 400;
    h = canvas.clientHeight || canvas.height || 300;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", () => { resize(); renderFrame(); }, { passive: true });
  resize();

  const rootEl = document.documentElement;
  new MutationObserver(() => renderFrame()).observe(rootEl, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  function renderFrame() {
    if (!currentMesh) return;
    const light = rootEl.dataset.theme === "light";
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.31;
    const ry = rotationAngle;
    const rx = 0.42;
    const cosy = Math.cos(ry), siny = Math.sin(ry);
    const cosx = Math.cos(rx), sinx = Math.sin(rx);

    const count = currentMesh.verts.length;
    const px = new Float32Array(count);
    const py = new Float32Array(count);
    const pz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const v = currentMesh.verts[i];
      const x1 = v[0] * cosy + v[2] * siny;
      const z1 = -v[0] * siny + v[2] * cosy;
      const y2 = v[1] * cosx - z1 * sinx;
      const z2 = v[1] * sinx + z1 * cosx;
      const persp = 3.2 / (3.2 - z2);
      px[i] = cx + x1 * persp * scale;
      py[i] = cy + y2 * persp * scale;
      pz[i] = z2;
    }

    /* depth-bucketed wireframe */
    const buckets = [[], [], [], []];
    for (const e of currentMesh.edges) {
      const nd = Math.max(0, Math.min(1, ((pz[e[0]] + pz[e[1]]) / 2 + 1.45) / 2.9));
      buckets[Math.min(3, Math.floor(nd * 4))].push(e);
    }
    ctx.lineWidth = 0.9;
    for (let b = 0; b < 4; b++) {
      if (!buckets[b].length) continue;
      const a = 0.08 + Math.pow((b + 0.5) / 4, 1.55) * (light ? 0.28 : 0.5);
      ctx.strokeStyle = light
        ? `rgba(6,121,168,${a.toFixed(3)})`
        : `rgba(41,216,240,${a.toFixed(3)})`;
      ctx.beginPath();
      for (const e of buckets[b]) {
        ctx.moveTo(px[e[0]], py[e[0]]);
        ctx.lineTo(px[e[1]], py[e[1]]);
      }
      ctx.stroke();
    }

    /* ray-sample points */
    const litColor = light ? "rgba(6,121,168," : "rgba(103,232,249,";
    ctx.fillStyle = `${litColor}0.95)`;
    for (const vi of currentMesh.samples) {
      ctx.beginPath();
      ctx.arc(px[vi], py[vi], 1.6, 0, 6.2832);
      ctx.fill();
    }

    /* corner ticks echo the scanner HUD */
    const tickLen = 14;
    const m = 10;
    ctx.strokeStyle = light ? "rgba(6,121,168,0.5)" : "rgba(41,216,240,0.4)";
    ctx.lineWidth = 1;
    const corners = [
      [m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1],
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + sx * tickLen, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * tickLen);
      ctx.stroke();
    }
  }

  /* --------------------------------------------------------- controls */
  const updateOutputs = (nonce) => {
    if (valDisplay) valDisplay.textContent = `Nonce ${nonce.toLocaleString("en-US")}`;
    if (seedDisplay) {
      seedDisplay.textContent = `0x${hex32(nonceHash("seed", nonce))}${hex32(nonceHash("sed2", nonce))}`;
    }
    if (hashDisplay) {
      hashDisplay.textContent = `0x0000${hex32(nonceHash("seal", nonce))}${hex32(nonceHash("sal2", nonce)).slice(0, 4)}`;
    }
    if (meshDisplay && currentMesh) {
      meshDisplay.textContent = `${currentMesh.verts.length} vertices · ${currentMesh.edges.length} edges`;
    }
  };

  const setNonce = (nonce) => {
    currentMesh = createMesh(nonce);
    updateOutputs(nonce);
    if (reducedMotion || !running) renderFrame();
  };

  if (slider) {
    slider.addEventListener("input", (e) => {
      setNonce(parseInt(e.target.value, 10));
    });
  }

  /* -------------------------------------------------------- lifecycle */
  let running = false;
  let onScreen = true;

  const loop = () => {
    if (!running) return;
    rotationAngle += 0.006;
    renderFrame();
    requestAnimationFrame(loop);
  };

  const sync = () => {
    const shouldRun = onScreen && !document.hidden && !reducedMotion;
    if (shouldRun && !running) {
      running = true;
      requestAnimationFrame(loop);
    } else if (!shouldRun) {
      running = false;
    }
  };

  document.addEventListener("visibilitychange", sync);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.05 }).observe(canvas);
  } else {
    onScreen = true;
  }

  setNonce(slider ? parseInt(slider.value, 10) : 32026);
  if (reducedMotion) {
    renderFrame();
    return;
  }
  sync();
})();
