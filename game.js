/* NV Flight — endless canvas runner. No dependencies. */
(() => {
  const canvas = document.getElementById("flight-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("flight-overlay");
  const overlayTitle = document.getElementById("flight-overlay-title");
  const overlayText = document.getElementById("flight-overlay-text");
  const startBtn = document.getElementById("flight-start");
  const scoreEl = document.getElementById("flight-score");
  const bestEl = document.getElementById("flight-best");
  const livesEl = document.getElementById("flight-lives");
  const BEST_KEY = "nv-flight-best";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(420, rect.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const state = {
    running: false,
    score: 0,
    lives: 3,
    time: 0,
    speed: 2.6,
    orbs: [],
    rocks: [],
    stars: [],
    particles: [],
    lastOrb: 0,
    lastRock: 0,
  };

  const ship = { x: 80, y: 200, r: 14, tx: 80, ty: 200, tilt: 0 };
  const keys = {};

  function best() {
    return Number(localStorage.getItem(BEST_KEY) || 0);
  }
  function saveBest(v) {
    if (v > best()) localStorage.setItem(BEST_KEY, String(v));
  }
  function refreshHud() {
    scoreEl.textContent = String(Math.floor(state.score));
    bestEl.textContent = String(best());
    livesEl.textContent = "●".repeat(state.lives) + "○".repeat(Math.max(0, 3 - state.lives));
  }

  function reset() {
    state.score = 0;
    state.lives = 3;
    state.time = 0;
    state.speed = 2.6;
    state.orbs = [];
    state.rocks = [];
    state.particles = [];
    state.lastOrb = 0;
    state.lastRock = 0;
    ship.tx = Math.min(110, W * 0.18);
    ship.ty = H / 2;
    ship.x = ship.tx;
    ship.y = ship.ty;
    if (!state.stars.length) {
      state.stars = Array.from({ length: reducedMotion ? 30 : 90 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        s: Math.random() * 1.6 + 0.4, v: Math.random() * 1.4 + 0.3,
      }));
    }
    refreshHud();
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function spawnOrb() {
    const labels = ["PY", "C++", "AI", "DS", "NV"];
    state.orbs.push({
      x: W + 30, y: 40 + Math.random() * (H - 80),
      r: 13, label: labels[Math.floor(Math.random() * labels.length)],
      bob: Math.random() * Math.PI * 2,
    });
  }
  function spawnRock() {
    const r = 12 + Math.random() * 16;
    state.rocks.push({
      x: W + 40, y: 30 + Math.random() * (H - 60),
      r, rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.06,
      points: 7 + Math.floor(Math.random() * 3),
    });
  }

  function explode(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      state.particles.push({ x, y, vx: Math.cos(a) * (1 + Math.random() * 2.4), vy: Math.sin(a) * (1 + Math.random() * 2.4), life: 1, color });
    }
  }

  function update(dt) {
    state.time += dt;
    state.speed = Math.min(7.5, 2.6 + state.time * 0.06);
    state.score += dt * 10;

    // Ship steering
    const kSpeed = 340 * dt;
    if (keys.ArrowUp || keys.w || keys.W) ship.ty -= kSpeed;
    if (keys.ArrowDown || keys.s || keys.S) ship.ty += kSpeed;
    if (keys.ArrowLeft || keys.a || keys.A) ship.tx -= kSpeed;
    if (keys.ArrowRight || keys.d || keys.D) ship.tx += kSpeed;
    ship.tx = Math.max(24, Math.min(W - 24, ship.tx));
    ship.ty = Math.max(24, Math.min(H - 24, ship.ty));
    const px = ship.tx - ship.x, py = ship.ty - ship.y;
    ship.x += px * Math.min(1, dt * 9);
    ship.y += py * Math.min(1, dt * 9);
    ship.tilt += ((Math.max(-1, Math.min(1, py / 24)) * 0.35) - ship.tilt) * Math.min(1, dt * 8);

    // Spawns (easier early)
    if (state.time - state.lastOrb > 0.9) { state.lastOrb = state.time; spawnOrb(); }
    const rockGap = Math.max(0.55, 1.25 - state.time * 0.008);
    if (state.time - state.lastRock > rockGap) { state.lastRock = state.time; spawnRock(); }

    // Stars
    for (const st of state.stars) {
      st.x -= st.v * state.speed * (reducedMotion ? 0.3 : 1);
      if (st.x < -4) { st.x = W + 4; st.y = Math.random() * H; }
    }

    // Orbs
    for (let i = state.orbs.length - 1; i >= 0; i--) {
      const o = state.orbs[i];
      o.x -= state.speed * 1.6;
      o.bob += dt * 3;
      const dx = o.x - ship.x, dy = (o.y + Math.sin(o.bob) * 6) - ship.y;
      if (Math.hypot(dx, dy) < o.r + ship.r) {
        state.orbs.splice(i, 1);
        state.score += 25;
        explode(o.x, o.y, "#c7bba8");
        refreshHud();
        continue;
      }
      if (o.x < -40) state.orbs.splice(i, 1);
    }

    // Rocks
    for (let i = state.rocks.length - 1; i >= 0; i--) {
      const r = state.rocks[i];
      r.x -= state.speed * 2.1;
      r.rot += r.vr;
      if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + ship.r - 4) {
        state.rocks.splice(i, 1);
        state.lives -= 1;
        explode(ship.x, ship.y, "#e8a7a0");
        refreshHud();
        if (state.lives <= 0) return gameOver();
        continue;
      }
      if (r.x < -60) state.rocks.splice(i, 1);
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= dt * 1.8;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    if (Math.floor(state.score) % 5 === 0) refreshHud();
  }

  function drawShip() {
    const warm = cssVar("--warm", "#c7bba8");
    const cream = cssVar("--cream", "#e2dbd0");
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.tilt);
    // flame
    const flick = 10 + Math.random() * 8;
    ctx.fillStyle = warm;
    ctx.beginPath();
    ctx.moveTo(-14, 6);
    ctx.lineTo(-14 - flick, 0);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    // body
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0b0b0d";
    ctx.font = "700 8px Syne, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NV", 2, 0.5);
    ctx.restore();
  }

  function draw() {
    const canvasBg = cssVar("--canvas", "#0b0b0d");
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(199,187,168,0.10)";
    ctx.lineWidth = 1;
    const gap = 44;
    const off = (state.time * 40 * state.speed * 0.4) % gap;
    ctx.beginPath();
    for (let x = -off; x < W; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += gap) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // stars
    ctx.fillStyle = "rgba(226,219,208,0.7)";
    for (const st of state.stars) {
      ctx.globalAlpha = 0.25 + st.s * 0.25;
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    const warm = cssVar("--warm", "#c7bba8");
    const cream = cssVar("--cream", "#e2dbd0");

    // orbs
    for (const o of state.orbs) {
      const y = o.y + Math.sin(o.bob) * 6;
      ctx.strokeStyle = warm;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(o.x, y, o.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = cream;
      ctx.font = "600 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.label, o.x, y + 0.5);
    }

    // rocks
    for (const r of state.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.strokeStyle = "rgba(232,167,160,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < r.points; i++) {
        const a = (i / r.points) * Math.PI * 2;
        const rr = r.r * (0.82 + (i % 2 === 0 ? 0.22 : 0));
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // particles
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    drawShip();
  }

  let raf = 0, last = 0;
  function loop(t) {
    if (!state.running) return;
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
    last = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function showOverlay(title, text, btn) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = btn;
    overlay.classList.add("is-open");
  }
  function hideOverlay() {
    overlay.classList.remove("is-open");
  }

  function start() {
    reset();
    hideOverlay();
    state.running = true;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    state.running = false;
    cancelAnimationFrame(raf);
    const final = Math.floor(state.score);
    saveBest(final);
    refreshHud();
    showOverlay("Signal lost", "Score " + final + " · Best " + best() + ". Collect skill orbs, dodge bug asteroids.", "Fly again");
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(raf);
    showOverlay("Paused", "Score " + Math.floor(state.score) + ". Resume when ready.", "Resume");
  }

  startBtn.addEventListener("click", () => {
    if (state.running) return;
    // Resume path: keep current score if lives remain
    if (state.lives > 0 && (state.score > 0 || state.time > 0) && overlayTitle.textContent === "Paused") {
      hideOverlay();
      state.running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
      return;
    }
    start();
  });

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if ((e.key === " " || e.key === "Enter") && !state.running && overlay.classList.contains("is-open")) start();
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (state.running) pause();
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  function pointTo(e) {
    const rect = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    const pt = pointTo(e);
    ship.tx = pt.x; ship.ty = pt.y;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const pt = pointTo(e);
    ship.tx = pt.x; ship.ty = pt.y;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("resize", () => {
    resize();
    if (!state.running) draw();
  });

  document.getElementById("flight-pause")?.addEventListener("click", pause);

  resize();
  reset();
  draw();
  refreshHud();
  showOverlay("NV Flight", "Steer with mouse, touch, or WASD/arrows. Collect skill orbs (+25), dodge bug asteroids. 3 lives.", "Start flight");
})();
