/* ================================================
   PARABOLA INTERATTIVA — Fosforo Scienza
   app.js
   ================================================ */

/* ------------------------------------------------
   UTILITY
   ------------------------------------------------ */
function fmt(n, d = 2) {
  const v = parseFloat(n);
  if (Number.isInteger(v)) return v.toFixed(0);
  return v.toFixed(d);
}

function fmtCoeff(n, showPlus = false) {
  const v = parseFloat(n);
  if (v === 0) return showPlus ? '' : '0';
  const sign = showPlus && v > 0 ? '+' : '';
  return sign + fmt(v);
}

/* ------------------------------------------------
   HERO CANVAS — animated parabola curves
   ------------------------------------------------ */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, curves = [], animId;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeCurve() {
    return {
      a: (Math.random() - 0.5) * 0.003,
      cx: Math.random() * W,
      cy: Math.random() * H * 0.5 + H * 0.25,
      speed: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.3 + 0.05,
      hue: Math.floor(Math.random() * 60) + 200, // blue-purple range
      width: Math.random() * 1.5 + 0.5,
    };
  }

  function drawCurve(c) {
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${c.hue}, 80%, 65%, ${c.alpha})`;
    ctx.lineWidth = c.width;
    for (let x = 0; x <= W; x += 3) {
      const dx = x - c.cx;
      const y = c.a * dx * dx + c.cy;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    curves.forEach(c => {
      c.cy += c.speed;
      if (c.cy < -100 || c.cy > H + 100) c.cy = c.speed > 0 ? -100 : H + 100;
      drawCurve(c);
    });
    animId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 12; i++) curves.push(makeCurve());
  animate();
})();

/* ------------------------------------------------
   PARABOLA CANVAS — interactive graph
   ------------------------------------------------ */
(function initGraph() {
  const canvas = document.getElementById('parabola-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let a = 1, b = 0, c = 0;
  let showVertex = true, showFocus = true, showDirectrix = true, showAxis = true, showRoots = true;

  // coordinate mapping
  const RANGE = 8; // units visible on each side
  let W, H, ox, oy, scale;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 580);
    canvas.width = size;
    canvas.height = size;
    W = H = size;
    ox = W / 2;
    oy = H / 2;
    scale = W / (RANGE * 2);
    draw();
  }

  function toScreen(x, y) { return [ox + x * scale, oy - y * scale]; }
  function toWorld(px, py) { return [(px - ox) / scale, (oy - py) / scale]; }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = -RANGE; i <= RANGE; i++) {
      const [sx] = toScreen(i, 0);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
      const [, sy] = toScreen(0, i);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    const [, ayS] = toScreen(0, RANGE); const [, ayE] = toScreen(0, -RANGE);
    ctx.beginPath(); ctx.moveTo(ox, ayS); ctx.lineTo(ox, ayE); ctx.stroke();
    const [axS] = toScreen(-RANGE, 0); const [axE] = toScreen(RANGE, 0);
    ctx.beginPath(); ctx.moveTo(axS, oy); ctx.lineTo(axE, oy); ctx.stroke();

    // labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    for (let i = -RANGE; i <= RANGE; i++) {
      if (i === 0) continue;
      const [sx] = toScreen(i, 0);
      ctx.fillText(i, sx, oy + 16);
      const [, sy] = toScreen(0, i);
      ctx.textAlign = 'right';
      ctx.fillText(i, ox - 6, sy + 4);
      ctx.textAlign = 'center';
    }
  }

  function drawParabola() {
    if (Math.abs(a) < 0.001) return;
    ctx.beginPath();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#6c3ce3';
    ctx.shadowBlur = 8;

    let first = true;
    for (let px = 0; px <= W; px++) {
      const wx = (px - ox) / scale;
      const wy = a * wx * wx + b * wx + c;
      const py = oy - wy * scale;
      if (py < -50 || py > H + 50) { first = true; continue; }
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function getVertex() {
    const h = -b / (2 * a);
    const k = a * h * h + b * h + c;
    return { h, k };
  }

  function getFocusAndDirectrix() {
    const { h, k } = getVertex();
    const p = 1 / (4 * a);
    return { fx: h, fy: k + p, dy: k - p };
  }

  function drawExtras() {
    const { h, k } = getVertex();
    const { fx, fy, dy } = getFocusAndDirectrix();
    const delta = b * b - 4 * a * c;

    // directrix
    if (showDirectrix) {
      const [, sy] = toScreen(0, dy);
      ctx.beginPath();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(0, sy); ctx.lineTo(W, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#34d399';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`d: y=${fmt(dy)}`, 8, sy - 5);
    }

    // axis of symmetry
    if (showAxis) {
      const [sx] = toScreen(h, 0);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(167,139,250,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // roots
    if (showRoots && delta >= 0) {
      const sqrtD = Math.sqrt(delta);
      const x1 = (-b - sqrtD) / (2 * a);
      const x2 = (-b + sqrtD) / (2 * a);
      [x1, x2].forEach(rx => {
        if (rx < -RANGE - 1 || rx > RANGE + 1) return;
        const [sx, sy] = toScreen(rx, 0);
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`(${fmt(rx)}, 0)`, sx, sy + 18);
      });
    }

    // vertex
    if (showVertex) {
      const [sx, sy] = toScreen(h, k);
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b429';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f0b429';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`V(${fmt(h)}, ${fmt(k)})`, sx + 10, sy - 8);
    }

    // focus
    if (showFocus) {
      const [sx, sy] = toScreen(fx, fy);
      if (sy >= -10 && sy <= H + 10) {
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#e94560';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#e94560';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`F(${fmt(fx)}, ${fmt(fy)})`, sx + 10, sy + 4);
      }
    }
  }

  function buildEquation(a, b, c) {
    let parts = [];
    if (Math.abs(a) >= 0.001) {
      const aS = a === 1 ? '' : a === -1 ? '-' : fmt(a);
      parts.push(aS + 'x²');
    }
    if (Math.abs(b) >= 0.001) {
      const bS = b === 1 ? '+x' : b === -1 ? '-x' : (b > 0 ? '+' : '') + fmt(b) + 'x';
      parts.push(bS);
    }
    if (Math.abs(c) >= 0.001 || parts.length === 0) {
      parts.push((c > 0 && parts.length > 0 ? '+' : '') + fmt(c));
    }
    return 'y = ' + parts.join('');
  }

  function updateInfoPanel() {
    const { h, k } = getVertex();
    const { fx, fy, dy } = getFocusAndDirectrix();
    const axisX = -b / (2 * a);
    const delta = b * b - 4 * a * c;

    document.getElementById('eq-display').textContent = buildEquation(a, b, c);
    document.getElementById('vertex-display').textContent = `V(${fmt(h)}, ${fmt(k)})`;
    document.getElementById('focus-display').textContent = `F(${fmt(fx)}, ${fmt(fy)})`;
    document.getElementById('directrix-display').textContent = `y = ${fmt(dy)}`;
    document.getElementById('axis-display').textContent = `x = ${fmt(axisX)}`;
    document.getElementById('concavity-display').textContent = a > 0 ? '↑ verso l\'alto' : '↓ verso il basso';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawParabola();
    drawExtras();
    updateInfoPanel();
  }

  function bindSlider(id, valId, onUpdate) {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      display.textContent = v.toFixed(2);
      onUpdate(v);
      draw();
    });
  }

  bindSlider('slider-a', 'val-a', v => { a = v === 0 ? 0.001 : v; });
  bindSlider('slider-b', 'val-b', v => { b = v; });
  bindSlider('slider-c', 'val-c', v => { c = v; });

  ['vertex', 'focus', 'directrix', 'axis', 'roots'].forEach(name => {
    const cb = document.getElementById(`show-${name}`);
    cb.addEventListener('change', () => {
      if (name === 'vertex') showVertex = cb.checked;
      if (name === 'focus') showFocus = cb.checked;
      if (name === 'directrix') showDirectrix = cb.checked;
      if (name === 'axis') showAxis = cb.checked;
      if (name === 'roots') showRoots = cb.checked;
      draw();
    });
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    a = 1; b = 0; c = 0;
    document.getElementById('slider-a').value = 1;
    document.getElementById('slider-b').value = 0;
    document.getElementById('slider-c').value = 0;
    document.getElementById('val-a').textContent = '1.00';
    document.getElementById('val-b').textContent = '0.00';
    document.getElementById('val-c').textContent = '0.00';
    draw();
  });

  // hover tooltip
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const [wx, wy] = toWorld(px, py);
    draw();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`(${fmt(wx)}, ${fmt(wy)})`, px + 10, py - 5);
  });

  canvas.addEventListener('mouseleave', draw);

  window.addEventListener('resize', resize);
  resize();
})();

/* ------------------------------------------------
   TABS
   ------------------------------------------------ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

/* ------------------------------------------------
   TRAJECTORY SIMULATOR — con animazione
   ------------------------------------------------ */
(function initTrajectory() {
  const canvas = document.getElementById('trajectory-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const g = 9.81;
  const STEPS = 300;
  const ANIM_DURATION = 2200; // ms totali per percorrere la traiettoria

  let animId = null;
  let currentPoints = [];
  let currentMeta = {};
  let margin = 40;

  const velSlider   = document.getElementById('vel-slider');
  const angleSlider = document.getElementById('angle-slider');
  const velDisplay   = document.getElementById('vel-display');
  const angleDisplay = document.getElementById('angle-display');
  const launchBtn    = document.getElementById('launch-btn');
  const info         = document.getElementById('traj-info');

  velSlider.addEventListener('input',   () => { velDisplay.textContent   = velSlider.value; });
  angleSlider.addEventListener('input', () => { angleDisplay.textContent = angleSlider.value; });

  /* ---- dimensioni canvas ---- */
  function getSize() {
    const w = canvas.parentElement ? canvas.parentElement.clientWidth || 600 : 600;
    return { W: Math.max(w, 200), H: 280 };
  }

  function ensureSize() {
    const { W, H } = getSize();
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width  = W;
      canvas.height = H;
    }
  }

  /* ---- fisica ---- */
  function compute(v0, angleDeg) {
    const theta   = angleDeg * Math.PI / 180;
    const vx      = v0 * Math.cos(theta);
    const vy      = v0 * Math.sin(theta);
    const tFlight = 2 * vy / g;
    const xMax    = vx * tFlight;
    const yMax    = (vy * vy) / (2 * g);
    const points  = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = (i / STEPS) * tFlight;
      points.push({ x: vx * t, y: vy * t - 0.5 * g * t * t,
                    vx, vy: vy - g * t });
    }
    return { points, tFlight, xMax, yMax, vx, vy0: vy };
  }

  /* ---- coordinate schermo ---- */
  function makeSc(W, H, xMax, yMax) {
    const scaleX = (W - margin * 2) / xMax;
    const scaleY = (H - margin * 2) / (yMax * 1.2);
    return (x, y) => [margin + x * scaleX, H - margin - y * scaleY];
  }

  /* ---- disegno frame ---- */
  function drawFrame(progress) {
    ensureSize();
    const { W, H } = getSize();
    const { points, xMax, yMax, tFlight } = currentMeta;
    if (!points || points.length === 0) return;

    const sc = makeSc(W, H, xMax, yMax);
    ctx.clearRect(0, 0, W, H);

    const idx = Math.min(Math.floor(progress * STEPS), STEPS);

    /* terreno */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    const [gx0] = sc(0, 0); const [gx1] = sc(xMax, 0);
    const [, gy] = sc(0, 0);
    ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gx1, gy); ctx.stroke();

    /* traccia completa (sfumata) */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(240,180,41,0.18)';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      const [px, py] = sc(p.x, p.y);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();

    /* traccia percorsa finora */
    if (idx > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#f0b429';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f0b429';
      ctx.shadowBlur = 10;
      for (let i = 0; i <= idx; i++) {
        const [px, py] = sc(points[i].x, points[i].y);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    /* linea altezza massima (appare quando si raggiunge il top) */
    if (progress >= 0.5) {
      const [hx, hy] = sc(xMax / 2, yMax);
      const alpha = Math.min(1, (progress - 0.5) * 4);
      ctx.strokeStyle = `rgba(255,255,255,${0.3 * alpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, H - margin); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(255,255,255,${0.8 * alpha})`;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`↕ ${yMax.toFixed(1)} m`, hx, hy - 10);
    }

    /* pallina con scia */
    if (idx > 0) {
      const trailLen = 12;
      for (let t = Math.max(0, idx - trailLen); t < idx; t++) {
        const a = (t - (idx - trailLen)) / trailLen;
        const [tx, ty] = sc(points[t].x, points[t].y);
        ctx.beginPath();
        ctx.arc(tx, ty, 3 * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,180,41,${0.3 * a})`;
        ctx.fill();
      }
      const [bx, by] = sc(points[idx].x, points[idx].y);
      /* alone */
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,180,41,0.25)';
      ctx.fill();
      /* pallina */
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b429';
      ctx.shadowColor = '#f0b429';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* punto di partenza */
    const [sx0, sy0] = sc(0, 0);
    ctx.beginPath(); ctx.arc(sx0, sy0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#6c3ce3'; ctx.fill();

    /* punto di atterraggio (appare alla fine) */
    if (progress >= 0.98) {
      const [sxE, syE] = sc(xMax, 0);
      ctx.beginPath(); ctx.arc(sxE, syE, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#e94560';
      ctx.shadowColor = '#e94560'; ctx.shadowBlur = 12;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      /* etichetta gittata */
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`↔ ${xMax.toFixed(1)} m`, margin + (W - margin * 2) / 2, H - 6);
    }

    /* info in tempo reale */
    const t_now = (idx / STEPS) * tFlight;
    const p = points[idx];
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy).toFixed(1);
    info.innerHTML = `
      <span>⏱ t = ${t_now.toFixed(2)} s</span>
      <span>↔ x = ${p.x.toFixed(1)} m</span>
      <span>↑ y = ${p.y.toFixed(1)} m</span>
      <span>⚡ v = ${speed} m/s</span>
    `;
  }

  /* ---- animazione ---- */
  function animate(v0, angleDeg) {
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    currentMeta = compute(v0, angleDeg);
    currentPoints = currentMeta.points;

    const { tFlight, xMax, yMax } = currentMeta;

    launchBtn.disabled = true;
    launchBtn.textContent = '🚀 In volo...';

    const startTime = performance.now();

    function frame(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      drawFrame(progress);

      if (progress < 1) {
        animId = requestAnimationFrame(frame);
      } else {
        animId = null;
        launchBtn.disabled = false;
        launchBtn.textContent = '🚀 Lancia!';
        /* info finale */
        info.innerHTML = `
          <span>⏱ Tempo volo: ${tFlight.toFixed(2)} s</span>
          <span>↔ Gittata: ${xMax.toFixed(1)} m</span>
          <span>↑ Altezza max: ${yMax.toFixed(1)} m</span>
          <span>📐 Angolo ottimale: 45°</span>
        `;
      }
    }
    animId = requestAnimationFrame(frame);
  }

  /* ---- preview statico (slider drag) ---- */
  function drawStatic(v0, angleDeg) {
    if (animId) return; // non interrompere animazione in corso
    currentMeta = compute(v0, angleDeg);
    drawFrame(1); // mostra tutto completato
    const { tFlight, xMax, yMax } = currentMeta;
    info.innerHTML = `
      <span>⏱ Tempo volo: ${tFlight.toFixed(2)} s</span>
      <span>↔ Gittata: ${xMax.toFixed(1)} m</span>
      <span>↑ Altezza max: ${yMax.toFixed(1)} m</span>
      <span>📐 Angolo ottimale: 45°</span>
    `;
  }

  velSlider.addEventListener('input',   () => drawStatic(+velSlider.value, +angleSlider.value));
  angleSlider.addEventListener('input', () => drawStatic(+velSlider.value, +angleSlider.value));

  launchBtn.addEventListener('click', () => animate(+velSlider.value, +angleSlider.value));

  /* ---- draw iniziale (ritardato per garantire larghezza corretta) ---- */
  setTimeout(() => drawStatic(20, 45), 100);

  window.addEventListener('resize', () => {
    if (!animId) drawStatic(+velSlider.value, +angleSlider.value);
  });
})();

/* ------------------------------------------------
   QUIZ
   ------------------------------------------------ */
(function initQuiz() {
  const questions = [
    {
      q: "Qual è la definizione geometrica della parabola?",
      opts: [
        "Il luogo dei punti equidistanti da un fuoco e da una direttrice",
        "Il luogo dei punti equidistanti da due fuochi",
        "Una curva formata dall'intersezione di un cono con un piano parallelo alla base",
        "Il luogo dei punti a distanza costante da un centro"
      ],
      correct: 0,
      explanation: "La parabola è il luogo geometrico dei punti del piano equidistanti da un punto fisso (fuoco) e da una retta fissa (direttrice)."
    },
    {
      q: "Nell'equazione y = ax² + bx + c, se a < 0, la parabola…",
      opts: [
        "Si apre verso l'alto",
        "Si apre verso il basso",
        "È un'iperbole",
        "Non interseca mai l'asse x"
      ],
      correct: 1,
      explanation: "Il coefficiente 'a' determina la concavità: se a > 0 la parabola si apre verso l'alto, se a < 0 verso il basso."
    },
    {
      q: "Come si calcola la coordinata x del vertice?",
      opts: [
        "x = b / a",
        "x = −b / (2a)",
        "x = −b² / (4a)",
        "x = b / (2a)"
      ],
      correct: 1,
      explanation: "La coordinata x del vertice è x = −b/(2a). Questa è la formula fondamentale che si ottiene derivando e ponendo uguale a zero."
    },
    {
      q: "Cosa indica il discriminante Δ = b² − 4ac?",
      opts: [
        "La coordinata y del vertice",
        "La distanza tra fuoco e direttrice",
        "Il numero e tipo di intersezioni con l'asse x",
        "L'ampiezza della parabola"
      ],
      correct: 2,
      explanation: "Il discriminante determina il numero di radici reali: Δ > 0 → 2 radici, Δ = 0 → 1 radice doppia, Δ < 0 → nessuna radice reale."
    },
    {
      q: "Qual è la 'forma vertice' della parabola?",
      opts: [
        "y = ax² + bx + c",
        "y = a(x − x₁)(x − x₂)",
        "y = a(x − h)² + k",
        "y = ax² + k"
      ],
      correct: 2,
      explanation: "La forma vertice è y = a(x − h)² + k, dove V(h, k) è il vertice della parabola."
    },
    {
      q: "Se la parabola y = 2x² − 8x + 6, qual è il vertice?",
      opts: [
        "V(2, −2)",
        "V(−2, 2)",
        "V(4, −2)",
        "V(2, 2)"
      ],
      correct: 0,
      explanation: "h = −(−8)/(2·2) = 2, k = 2(4) − 8(2) + 6 = 8 − 16 + 6 = −2. Quindi V(2, −2)."
    },
    {
      q: "In quale applicazione reale si sfrutta la proprietà riflessiva della parabola?",
      opts: [
        "Costruzione di ponti sospesi",
        "Telescopi e antenne paraboliche",
        "Calcolo della traiettoria dei pianeti",
        "Progettazione di strade"
      ],
      correct: 1,
      explanation: "I raggi paralleli all'asse di simmetria vengono tutti riflessi verso il fuoco. Questo principio è usato nei telescopi, nei fari e nelle antenne paraboliche."
    },
    {
      q: "Per quale angolo di lancio si ottiene la gittata massima (in assenza di resistenza dell'aria)?",
      opts: [
        "30°",
        "60°",
        "45°",
        "90°"
      ],
      correct: 2,
      explanation: "La gittata massima in moto parabolico si ottiene per un angolo di lancio di 45°, dove i componenti orizzontale e verticale della velocità sono uguali."
    }
  ];

  let currentQ = 0, score = 0, answered = false;

  const questionText = document.getElementById('question-text');
  const optionsGrid = document.getElementById('options-grid');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn = document.getElementById('next-btn');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const questionCard = document.getElementById('question-card');
  const quizResult = document.getElementById('quiz-result');

  function loadQuestion(i) {
    answered = false;
    const q = questions[i];
    questionText.textContent = q.q;
    optionsGrid.innerHTML = '';
    feedbackEl.className = 'feedback hidden';
    feedbackEl.textContent = '';
    nextBtn.classList.add('hidden');

    progressFill.style.width = ((i / questions.length) * 100) + '%';
    progressText.textContent = `Domanda ${i + 1} di ${questions.length}`;

    q.opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(idx));
      optionsGrid.appendChild(btn);
    });
  }

  function selectAnswer(idx) {
    if (answered) return;
    answered = true;
    const q = questions[currentQ];
    const btns = optionsGrid.querySelectorAll('.option-btn');

    btns.forEach(btn => btn.disabled = true);
    btns[q.correct].classList.add('correct');

    if (idx === q.correct) {
      score++;
      feedbackEl.className = 'feedback correct-fb';
      feedbackEl.textContent = '✅ Corretto! ' + q.explanation;
    } else {
      btns[idx].classList.add('wrong');
      feedbackEl.className = 'feedback wrong-fb';
      feedbackEl.textContent = '❌ Non esatto. ' + q.explanation;
    }

    nextBtn.textContent = currentQ < questions.length - 1 ? 'Prossima domanda →' : 'Vedi risultato →';
    nextBtn.classList.remove('hidden');
  }

  nextBtn.addEventListener('click', () => {
    currentQ++;
    if (currentQ < questions.length) {
      loadQuestion(currentQ);
    } else {
      showResult();
    }
  });

  function showResult() {
    progressFill.style.width = '100%';
    questionCard.style.display = 'none';
    quizResult.classList.remove('hidden');

    const pct = score / questions.length;
    let emoji, title, msg;
    if (pct === 1) {
      emoji = '🏆'; title = 'Perfetto!';
      msg = 'Hai risposto correttamente a tutte le domande. Sei un/a vero/a esperto/a della parabola!';
    } else if (pct >= 0.75) {
      emoji = '🎉'; title = 'Ottimo!';
      msg = 'Hai una buona conoscenza della parabola. Ripassia i punti sbagliati e sarai perfetto/a!';
    } else if (pct >= 0.5) {
      emoji = '📚'; title = 'Buono!';
      msg = 'Hai capito le basi, ma c\'è ancora qualcosa da ripassare. Rileggi la sezione teoria!';
    } else {
      emoji = '💪'; title = 'Continua a studiare!';
      msg = 'Non preoccuparti, rileggi il modulo con calma e riprova. Ce la fai!';
    }

    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-score').textContent = `${score} / ${questions.length} risposte corrette`;
    document.getElementById('result-msg').textContent = msg;
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    currentQ = 0; score = 0;
    quizResult.classList.add('hidden');
    questionCard.style.display = '';
    loadQuestion(0);
  });

  loadQuestion(0);
})();
