/* Interactive Proof-of-Scan Pipeline Simulator */
(() => {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('sim-nonce');
  const valDisplay = document.getElementById('sim-nonce-val');
  const seedDisplay = document.getElementById('sim-seed');
  const hashDisplay = document.getElementById('sim-hash');

  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };

  const pseudoHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // Icosphere geometry generator
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

    // Subdivide 2 passes for interactive performance
    for (let s = 0; s < 2; s++) {
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

    // Apply seed-based surface displacement noise
    const seedOffset = (seedVal % 1000) * 0.01;
    verts = verts.map((v) => {
      const displacement = 0.8 + 0.35 * Math.sin(v[0] * 3.5 + seedOffset) * Math.cos(v[1] * 3.5 + seedOffset);
      return [v[0] * displacement, v[1] * displacement, v[2] * displacement];
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
  let currentMesh = createMesh(parseInt(slider.value, 10));

  const updateOutputs = (nonce) => {
    if (valDisplay) valDisplay.textContent = `Nonce: ${nonce}`;
    const hexSeed = '0x' + pseudoHash(`seed_${nonce}`).toString(16).padStart(8, '0') + '...f420';
    const hexHash = '0x0000' + pseudoHash(`seal_${nonce}`).toString(16).padStart(12, '0') + '...';
    if (seedDisplay) seedDisplay.textContent = hexSeed;
    if (hashDisplay) hashDisplay.textContent = hexHash;
  };

  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    currentMesh = createMesh(val);
    updateOutputs(val);
  });

  const render = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    rotationAngle += 0.008;

    const cx = w * 0.5;
    const cy = h * 0.5;
    const scale = Math.min(w, h) * 0.32;
    const cosy = Math.cos(rotationAngle);
    const siny = Math.sin(rotationAngle);
    const cosx = Math.cos(0.4);
    const sinx = Math.sin(0.4);

    const px = new Float32Array(currentMesh.verts.length);
    const py = new Float32Array(currentMesh.verts.length);

    for (let i = 0; i < currentMesh.verts.length; i++) {
      const v = currentMesh.verts[i];
      const x1 = v[0] * cosy + v[2] * siny;
      const z1 = -v[0] * siny + v[2] * cosy;
      const y2 = v[1] * cosx - z1 * sinx;
      const z2 = v[1] * sinx + z1 * cosx;

      const perspective = 3.2 / (3.2 - z2);
      px[i] = cx + x1 * perspective * scale;
      py[i] = cy + y2 * perspective * scale;
    }

    // Render mesh edges
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const [a, b] of currentMesh.edges) {
      ctx.moveTo(px[a], py[a]);
      ctx.lineTo(px[b], py[b]);
    }
    ctx.stroke();

    requestAnimationFrame(render);
  };

  updateOutputs(parseInt(slider.value, 10));
  requestAnimationFrame(render);
})();
