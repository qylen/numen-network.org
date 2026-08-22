/* Numen Network — hero scan instrument.
   Illustrates the Proof-of-Scan cycle: a deterministic object is acquired,
   swept by a scan plane, resolved into a spectral identity hash, and sealed.
   Values shown are illustrative; the geometry pipeline mirrors the real one
   (seeded icosphere + surface sampling). Honors prefers-reduced-motion,
   pauses offscreen and when the tab is hidden. */
(() => {
  "use strict";

  const view = document.querySelector(".scan-view");
  const canvas = document.getElementById("scan-canvas");
  if (!view || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const tagEl = document.getElementById("scan-tag");
  const hashEl = document.getElementById("scan-hash");
  const statusEl = document.getElementById("scan-status");

  const reducedMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- geometry */
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
  const rngFor = (seed) => () => {
    seed = mix32(seed + 0x6d2b79f5);
    return seed / 4294967296;
  };

  const lattice = (ix, iy, iz, salt) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + salt * 53.13) * 43758.5453;
    return s - Math.floor(s);
  };
  const smoo = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
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

  /* deterministic "asteroid" — same family as consensus/obj-asteroid */
  const buildMesh = (seedNum) => {
    const rand = rngFor(seedNum);
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
    const ox = rand() * 90, oy = rand() * 90, oz = rand() * 90;
    const freq = 2.2 + rand() * 1.4;
    const amp = 0.16 + rand() * 0.14;
    verts = verts.map((v) => {
      const d =
        noise(v[0] * freq + ox, v[1] * freq + oy, v[2] * freq + oz, seedNum % 997) -
        0.48;
      const r = 1 + d * amp;
      return [v[0] * r, v[1] * r, v[2] * r];
    });
    const eset = new Set();
    for (const [a, b, c] of faces) {
      for (const [p, q] of [[a, b], [b, c], [c, a]]) eset.add(p < q ? `${p}_${q}` : `${q}_${p}`);
    }
    const edges = [...eset].map((k) => k.split("_").map(Number));

    /* evenly strided sample points, as the scanner would take them */
    const SAMPLE_STRIDE = Math.max(1, Math.floor(verts.length / 64));
    const samples = [];
    for (let i = 0; i < verts.length; i += SAMPLE_STRIDE) samples.push(i);

    const hex32 = (v) => (v >>> 0).toString(16).padStart(8, "0");
    const mixAt = (label, k) => mix32(Math.imul(k ^ 0x9e3779b9, 0x85ebca6b) ^ mix32(label));
    let hash = "0x0000";
    for (const label of ["sx", "sy", "sz", "sq", "sp"]) {
      hash += hex32(mixAt(label.length * 2654435761 ^ seedNum, seedNum ^ (label.charCodeAt(0) << 8)));
    }
    hash = hash.slice(0, 42);

    return { verts, edges, samples, hash };
  };

  const MESH_SEEDS = [32026, 7741, 50302, 12883];
  let meshIndex = 0;
  let mesh = buildMesh(MESH_SEEDS[0]);

  /* ------------------------------------------------------------ render */
  let w = 300, h = 260;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const resize = () => {
    w = view.clientWidth || 300;
    h = view.clientHeight || 260;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", () => { resize(); drawFrame(state.t); }, { passive: true });
  resize();

  const root = document.documentElement;
  new MutationObserver(() => { drawFrame(state.t); }).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const state = {
    phase: 0,       // 0 acquire · 1 scan · 2 identify · 3 sealed
    t: 0,           // ms into full cycle
    typed: 0,       // chars of hash revealed
    sweepY: -1,     // projected sweep position (-1 = inactive)
    scannedCount: 0,
  };

  const PHASE_MS = reducedMotion ? 0 : [2100, 2700, 2300, 1900];
  const CYCLE = PHASE_MS.reduce((a, b) => a + b, 0);
  const TAGS = ["OBJECT DETECTED", "SURFACE SCAN · 4096 RAYS", "SPECTRAL IDENTITY", "SEALED · POSCAN-V1"];
  const STATUS = ["AWAITING TASK", "SAMPLES", "QUANTIZE · 23-D", "HASH ≤ TARGET"];

  const setTag = (txt) => { if (tagEl && tagEl.textContent !== txt) tagEl.textContent = txt; };
  const setStatus = (txt) => { if (statusEl && statusEl.textContent !== txt) statusEl.textContent = txt; };

  function project(t) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.315;
    const ry = t * 0.00042;
    const rx = 0.44 + Math.sin(t * 0.00021) * 0.05;
    const cosy = Math.cos(ry), siny = Math.sin(ry);
    const cosx = Math.cos(rx), sinx = Math.sin(rx);
    const d = 3.2;
    const px = new Float32Array(mesh.verts.length);
    const py = new Float32Array(mesh.verts.length);
    const pz = new Float32Array(mesh.verts.length);
    for (let i = 0; i < mesh.verts.length; i++) {
      const v = mesh.verts[i];
      const x1 = v[0] * cosy + v[2] * siny;
      const z1 = -v[0] * siny + v[2] * cosy;
      const y2 = v[1] * cosx - z1 * sinx;
      const z2 = v[1] * sinx + z1 * cosx;
      const s = d / (d - z2);
      px[i] = cx + x1 * s * R;
      py[i] = cy + y2 * s * R;
      pz[i] = z2;
    }
    return { px, py, pz };
  }

  function drawFrame(t, proj) {
    const light = root.dataset.theme === "light";
    ctx.clearRect(0, 0, w, h);

    const { px, py, pz } = proj || project(t);

    /* wireframe, back-to-front dimming via alpha buckets */
    const buckets = [[], [], [], []];
    for (const e of mesh.edges) {
      const nd = Math.max(0, Math.min(1, ((pz[e[0]] + pz[e[1]]) / 2 + 1.55) / 3.1));
      buckets[Math.min(3, Math.floor(nd * 4))].push(e);
    }
    ctx.lineWidth = 0.85;
    for (let b = 0; b < 4; b++) {
      if (!buckets[b].length) continue;
      const a = 0.06 + Math.pow((b + 0.5) / 4, 1.6) * (light ? 0.22 : 0.34);
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

    /* scan plane */
    const scanning = state.phase === 1;
    if (state.sweepY >= 0) {
      const sy = state.sweepY;
      const grad = ctx.createLinearGradient(0, sy - 46, 0, sy + 6);
      const bandA = light ? 0.10 : 0.16;
      grad.addColorStop(0, "rgba(41,216,240,0)");
      grad.addColorStop(1, `rgba(41,216,240,${bandA})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, sy - 46, w, 52);
      ctx.strokeStyle = light ? "rgba(6,121,168,0.75)" : "rgba(103,232,249,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
      /* side ticks on the scan line */
      ctx.fillStyle = light ? "rgba(6,121,168,0.8)" : "rgba(103,232,249,0.9)";
      for (let tx = 6; tx < w; tx += Math.max(28, w / 12)) {
        ctx.fillRect(tx, sy - 1.5, 7, 3);
      }
    }

    /* sample dots — lit once the sweep has passed them */
    const litColor = light ? "rgba(6,121,168," : "rgba(103,232,249,";
    const dimColor = light ? "rgba(20,40,70," : "rgba(120,140,170,";
    for (const vi of mesh.samples) {
      const passed = state.sweepY >= 0 && py[vi] <= state.sweepY;
      const isLit = state.phase > 1 || passed;
      ctx.beginPath();
      if (isLit) {
        ctx.fillStyle = `${litColor}${scanning ? 0.95 : 0.75})`;
        ctx.arc(px[vi], py[vi], 1.7, 0, 6.2832);
        ctx.fill();
        if (scanning && py[vi] > state.sweepY - 30) {
          ctx.fillStyle = "rgba(41,216,240,0.18)";
          ctx.beginPath();
          ctx.arc(px[vi], py[vi], 4.6, 0, 6.2832);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `${dimColor}0.35)`;
        ctx.arc(px[vi], py[vi], 1.2, 0, 6.2832);
        ctx.fill();
      }
    }

    /* spectral bar readout during identify/seal */
    if (state.phase >= 2) {
      const bars = 23;
      const bw = 3.2, gap = 3.4;
      const totalW = bars * (bw + gap) - gap;
      const bx = w - totalW - 16;
      const byBase = h - 16;
      for (let i = 0; i < bars; i++) {
        const n = lattice(i * 7.13, 3.7, 11.2, 5) * 26 + 5;
        const reveal = state.typed / mesh.hash.length;
        const show = i / bars <= reveal * 1.25;
        ctx.fillStyle = show ? "rgba(41,216,240,0.65)" : "rgba(110,130,160,0.18)";
        ctx.fillRect(bx + i * (bw + gap), byBase - n, bw, n);
      }
      ctx.fillStyle = light ? "rgba(20,40,70,0.6)" : "rgba(120,140,170,0.5)";
      ctx.font = "8px 'IBM Plex Mono', monospace";
      ctx.fillText("23-D SPECTRUM", bx, byBase + 8);
    }
  }

  /* ------------------------------------------------------------- phases */
  let hashTimer = null;

  function applyPhase() {
    setTag(TAGS[state.phase]);
    if (state.phase === 0) {
      setStatus(STATUS[0]);
    } else if (state.phase === 1) {
      const pct = Math.min(100, Math.round((state.scannedCount / mesh.samples.length) * 100));
      setStatus(`${STATUS[1]} ${Math.round((pct / 100) * 4096)}/4096`);
    } else if (state.phase === 2) {
      setStatus(STATUS[2]);
    } else {
      setStatus(STATUS[3]);
    }
  }

  function startCycle() {
    state.phase = 0;
    state.t = 0;
    state.typed = 0;
    state.sweepY = -1;
    state.scannedCount = 0;
    if (hashEl) hashEl.textContent = "";
    meshIndex = (meshIndex + 1) % MESH_SEEDS.length;
    mesh = buildMesh(MESH_SEEDS[meshIndex]);
    applyPhase();

    const t0 = performance.now();
    let lastPhase = -1;
    let lastSamplePct = -1;

    const tick = (now) => {
      if (!running) return;
      state.t = now - t0;

      /* phase boundaries */
      const p0 = PHASE_MS[0];
      const p1 = p0 + PHASE_MS[1];
      const p2 = p1 + PHASE_MS[2];
      const proj = project(state.t);

      if (state.t < p0) {
        state.phase = 0;
        state.sweepY = -1;
      } else if (state.t < p1) {
        if (lastPhase !== 1) { state.phase = 1; applyPhase(); lastPhase = 1; }
        const k = (state.t - p0) / PHASE_MS[1];
        state.sweepY = 14 + k * (h - 28);
        let lit = 0;
        for (const vi of mesh.samples) {
          if (proj.py[vi] <= state.sweepY) lit += 1;
        }
        state.scannedCount = lit;
        if (lit !== lastSamplePct) {
          lastSamplePct = lit;
          applyPhase();
        }
      } else if (state.t < p2) {
        if (lastPhase !== 2) {
          state.phase = 2;
          state.sweepY = -1;
          applyPhase();
          lastPhase = 2;
          /* type out the identity hash */
          if (hashEl) {
            const full = mesh.hash;
            const per = PHASE_MS[2] / full.length;
            let i = 0;
            window.clearInterval(hashTimer);
            hashTimer = window.setInterval(() => {
              i += 1;
              hashEl.textContent = full.slice(0, i);
              if (i >= full.length) window.clearInterval(hashTimer);
            }, per);
          }
        }
      } else {
        if (lastPhase !== 3) {
          state.phase = 3;
          applyPhase();
          lastPhase = 3;
        }
      }

      drawFrame(state.t, proj);
      if (state.t >= CYCLE) {
        window.clearInterval(hashTimer);
        running = false;
        window.setTimeout(() => {
          if (onScreen && !document.hidden) startCycle();
        }, 900);
        return;
      }
      requestAnimationFrame(tick);
    };

    running = true;
    requestAnimationFrame(tick);
  }

  /* --------------------------------------------------------- lifecycle */
  let running = false;
  let onScreen = true;

  if (reducedMotion) {
    /* static final state */
    state.phase = 3;
    state.typed = mesh.hash.length;
    state.sweepY = -1;
    if (tagEl) tagEl.textContent = TAGS[2];
    if (statusEl) statusEl.textContent = STATUS[3];
    if (hashEl) hashEl.textContent = mesh.hash;
    drawFrame(40000);
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.05 }).observe(view);
  }
  document.addEventListener("visibilitychange", sync);

  function sync() {
    const shouldRun = onScreen && !document.hidden;
    if (shouldRun && !running) startCycle();
    else if (!shouldRun && running) {
      running = false;
      window.clearInterval(hashTimer);
    }
  }

  sync();
})();
