(() => {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('sim-nonce');
  const valDisplay = document.getElementById('sim-nonce-val');
  const seedDisplay = document.getElementById('sim-seed');
  const hashDisplay = document.getElementById('sim-hash');
  const meshDisplay = document.getElementById('sim-mesh');

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

  const nonceHash = (label, nonce) => mix32(Math.imul(nonce ^ 0x9e3779b9, 0x85ebca6b) ^ mix32(label.length * 2654435761));

  const hex32 = (v) => (v >>> 0).toString(16).padStart(8, '0');

  const createMesh = (seedVal) => {
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
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
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

    const ox = (nonceHash('ox', seedVal) % 3600) / 100;
    const oy = (nonceHash('oy', seedVal) % 3600) / 100;
    const oz = (nonceHash('oz', seedVal) % 3600) / 100;
    const freq = 2.6 + (nonceHash('fq', seedVal) % 180) / 100;
    const amp = 0.22 + (nonceHash('am', seedVal) % 20) / 100;

    const sm = (t) => t * t * (3 - 2 * t);
    const lattice = (ix, iy, iz, salt) => {
      const s = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + salt * 53.13) * 43758.5453;
      return s - Math.floor(s);
    };
    const noise = (x, y, z, salt) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
      const lerp = (a, b, t) => a + (b - a) * t;
      return lerp(
        lerp(lerp(lattice(xi, yi, zi, salt), lattice(xi + 1, yi, zi, salt), u),
             lerp(lattice(xi, yi + 1, zi, salt), lattice(xi + 1, yi + 1, zi, salt), u), v),
        lerp(lerp(lattice(xi, yi, zi + 1, salt), lattice(xi + 1, yi, zi + 1, salt), u),
             lerp(lattice(xi, yi + 1, zi + 1, salt), lattice(xi + 1, yi + 1, zi + 1, salt), u), v),
        w
      );
    };
    const fbm = (x, y, z, salt) => {
      let n = 0, a = 0.5, f = 1;
      for (let o = 0; o < 3; o++) {
        n += a * (noise(x * f, y * f, z * f, salt + o * 17) - 0.5);
        a *= 0.5;
        f *= 2.05;
      }
      return n;
    };

    verts = verts.map((v) => {
      const d = 1 + amp * fbm(
        v[0] * freq + ox,
        v[1] * freq + oy,
        v[2] * freq + oz,
        seedVal % 997
      );
      return [v[0] * d, v[1] * d, v[2] * d];
    });

    const eset = new Set();
    for (const [a, b, c] of faces) {
      for (const [p, q] of [[a, b], [b, c], [c, a]]) {
        eset.add(p < q ? `${p}_${q}` : `${q}_${p}`);
      }
    }
    const edges = [...eset].map((k) => k.split('_').map(Number));

    return { verts, edges };
  };

  let rotationAngle = 0;
  let running = false;
  let onScreen = true;
  let w = 0, h = 0;
  let currentMesh = null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || canvas.width;
    h = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const updateOutputs = (nonce) => {
    if (valDisplay) valDisplay.textContent = `Nonce: ${nonce}`;
    if (seedDisplay) seedDisplay.textContent = `0x${hex32(nonceHash('seed', nonce))}${hex32(nonceHash('sed2', nonce))}`;
    if (hashDisplay) hashDisplay.textContent = `0x0000${hex32(nonceHash('seal', nonce))}${hex32(nonceHash('sal2', nonce)).slice(0, 4)}`;
    if (meshDisplay && currentMesh) {
      meshDisplay.textContent = `${currentMesh.verts.length.toLocaleString('en-US')} Vertices / ${(currentMesh.edges.length).toLocaleString('en-US')} Edges`;
    }
  };

  const setNonce = (nonce) => {
    currentMesh = createMesh(nonce);
    updateOutputs(nonce);
    if (reducedMotion) drawFrame(true);
  };

  const renderFrame = () => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
    const m = /^#?([\da-f]{6})$/i.exec(accent);
    const ar = m ? parseInt(m[1].slice(0, 2), 16) : 34;
    const ag = m ? parseInt(m[1].slice(2, 4), 16) : 211;
    const ab = m ? parseInt(m[1].slice(4, 6), 16) : 238;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const scale = Math.min(w, h) * 0.30;
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

    const buckets = [[], [], [], [], []];
    for (const e of currentMesh.edges) {
      const zAvg = (pz[e[0]] + pz[e[1]]) / 2;
      const nd = Math.max(0, Math.min(1, (zAvg + 1.4) / 2.8));
      buckets[Math.min(4, Math.floor(nd * 5))].push(e);
    }
    ctx.lineWidth = 0.9;
    for (let b = 0; b < 5; b++) {
      if (!buckets[b].length) continue;
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${(0.18 + (b / 4) * 0.72).toFixed(3)})`;
      ctx.beginPath();
      for (const e of buckets[b]) {
        ctx.moveTo(px[e[0]], py[e[0]]);
        ctx.lineTo(px[e[1]], py[e[1]]);
      }
      ctx.stroke();
    }

    const sampleCount = 24;
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.95)`;
    for (let i = 0; i < sampleCount; i++) {
      const vi = Math.floor((i / sampleCount) * count);
      ctx.beginPath();
      ctx.arc(px[vi], py[vi], 1.6, 0, 6.283);
      ctx.fill();
    }
  };

  const drawFrame = () => {
    resize();
    if (currentMesh) renderFrame();
  };

  const loop = () => {
    if (!running) return;
    rotationAngle += 0.008;
    renderFrame();
    requestAnimationFrame(loop);
  };

  const syncRunning = () => {
    const shouldRun = onScreen && !document.hidden && !reducedMotion;
    if (shouldRun && !running) {
      running = true;
      requestAnimationFrame(loop);
    } else if (!shouldRun) {
      running = false;
    }
  };

  slider.addEventListener('input', (e) => {
    setNonce(parseInt(e.target.value, 10));
  });

  document.addEventListener('visibilitychange', syncRunning);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      syncRunning();
    }, { threshold: 0.05 }).observe(canvas);
  }
  window.addEventListener('resize', () => {
    if (reducedMotion || !running) drawFrame();
  });

  setNonce(parseInt(slider.value, 10));

  if (reducedMotion) {
    drawFrame();
    return;
  }

  if (!onScreen) return;
  running = true;
  requestAnimationFrame(loop);
})();
