/**
 * Flappy Bird — vanilla JS + Canvas
 * No dependencies. Works in any modern browser.
 */

(function () {
  'use strict';

  // ── Canvas setup ────────────────────────────────────────────────────────────
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlaySub   = document.getElementById('overlay-sub');
  const bestDisplay  = document.getElementById('best-score-display');

  const W = canvas.width;   // 400
  const H = canvas.height;  // 600

  // ── Constants ───────────────────────────────────────────────────────────────
  const GRAVITY        = 0.45;
  const FLAP_STRENGTH  = -8.5;
  const PIPE_WIDTH     = 60;
  const PIPE_GAP       = 160;
  const PIPE_SPEED     = 2.8;
  const PIPE_INTERVAL  = 90;   // frames between pipes
  const GROUND_H       = 80;
  const BIRD_R         = 16;   // bounding circle radius
  const BIRD_X         = 90;

  // Sky gradient colours
  const SKY_TOP    = '#70c5ce';
  const SKY_BOTTOM = '#b3e5fc';

  // ── State ───────────────────────────────────────────────────────────────────
  let bird, pipes, score, bestScore, frameCount, gameState;
  // gameState: 'idle' | 'running' | 'dead'

  // Ground scroll offset
  let groundX = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function randomBetween(a, b) {
    return Math.random() * (b - a) + a;
  }

  // ── Initialise / reset ──────────────────────────────────────────────────────
  function init() {
    bird = {
      x:   BIRD_X,
      y:   H / 2,
      vy:  0,
      angle: 0,
      alive: true,
    };
    pipes      = [];
    score      = 0;
    frameCount = 0;
    gameState  = 'running';
  }

  function showOverlay(title, sub) {
    overlaySub.innerHTML = sub;
    bestDisplay.textContent = bestScore > 0 ? `Best: ${bestScore}` : '';
    overlay.querySelector('h1').textContent = title;
    overlay.classList.add('visible');
  }

  function hideOverlay() {
    overlay.classList.remove('visible');
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  function flap() {
    if (gameState === 'idle') {
      hideOverlay();
      init();
      return;
    }
    if (gameState === 'dead') {
      hideOverlay();
      init();
      return;
    }
    if (gameState === 'running' && bird.alive) {
      bird.vy = FLAP_STRENGTH;
    }
  }

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
  });
  canvas.addEventListener('pointerdown', flap);

  // ── Pipe factory ─────────────────────────────────────────────────────────────
  function spawnPipe() {
    const skyH   = H - GROUND_H;
    const minTop = 60;
    const maxTop = skyH - PIPE_GAP - 60;
    const topH   = randomBetween(minTop, maxTop);
    pipes.push({
      x:     W + 10,
      topH,
      botY:  topH + PIPE_GAP,
      botH:  skyH - topH - PIPE_GAP,
      scored: false,
    });
  }

  // ── Collision (AABB circle vs rect) ──────────────────────────────────────────
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return (dx * dx + dy * dy) < (r * r);
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────────
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    grad.addColorStop(0, SKY_TOP);
    grad.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H - GROUND_H);
  }

  function drawGround() {
    // Main dirt band
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

    // Grass strip
    ctx.fillStyle = '#74bf2e';
    ctx.fillRect(0, H - GROUND_H, W, 22);

    // Scrolling grass tufts
    ctx.fillStyle = '#5aaf1e';
    const tileW = 40;
    const offset = groundX % tileW;
    for (let x = -tileW + offset; x < W + tileW; x += tileW) {
      ctx.beginPath();
      ctx.arc(x + 10, H - GROUND_H + 8, 10, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 28, H - GROUND_H + 6, 8, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawPipe(pipe) {
    const pipeGreen  = '#4caf50';
    const pipeDark   = '#388e3c';
    const capH = 20;
    const capOverhang = 4;

    // Top pipe body
    ctx.fillStyle = pipeGreen;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topH - capH);
    // Top pipe cap
    ctx.fillStyle = pipeDark;
    ctx.fillRect(pipe.x - capOverhang, pipe.topH - capH, PIPE_WIDTH + capOverhang * 2, capH);
    // Pipe highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(pipe.x + 4, 0, 10, pipe.topH - capH);

    // Bottom pipe body
    ctx.fillStyle = pipeGreen;
    ctx.fillRect(pipe.x, pipe.botY + capH, PIPE_WIDTH, pipe.botH - capH);
    // Bottom pipe cap
    ctx.fillStyle = pipeDark;
    ctx.fillRect(pipe.x - capOverhang, pipe.botY, PIPE_WIDTH + capOverhang * 2, capH);
    // Pipe highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(pipe.x + 4, pipe.botY + capH, 10, pipe.botH - capH);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.angle);

    // Body
    ctx.fillStyle = '#f9ca24';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R, BIRD_R - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#f0932b';
    ctx.beginPath();
    ctx.ellipse(-4, 4, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(7, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(9, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.moveTo(12, -2);
    ctx.lineTo(20, 0);
    ctx.lineTo(12, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 4;
    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(score, W / 2, 70);
    ctx.fillText(score, W / 2, 70);
    ctx.restore();
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  function update() {
    if (gameState !== 'running') return;

    frameCount++;
    groundX -= PIPE_SPEED;

    // Bird physics
    bird.vy    += GRAVITY;
    bird.y     += bird.vy;
    bird.angle  = Math.min(Math.max(bird.vy * 0.05, -0.5), 1.2);

    // Spawn pipes
    if (frameCount % PIPE_INTERVAL === 0) spawnPipe();

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;

      // Score
      if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
        p.scored = true;
        score++;
      }

      // Remove off-screen
      if (p.x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
        continue;
      }

      // Collision with top pipe
      if (circleRect(bird.x, bird.y, BIRD_R - 3, p.x, 0, PIPE_WIDTH, p.topH)) {
        killBird();
        return;
      }
      // Collision with bottom pipe
      if (circleRect(bird.x, bird.y, BIRD_R - 3, p.x, p.botY, PIPE_WIDTH, p.botH)) {
        killBird();
        return;
      }
    }

    // Ground & ceiling
    if (bird.y + BIRD_R >= H - GROUND_H || bird.y - BIRD_R <= 0) {
      killBird();
    }
  }

  function killBird() {
    bird.alive = false;
    gameState  = 'dead';
    if (score > (bestScore || 0)) bestScore = score;
    setTimeout(() => {
      showOverlay('Game Over', `Score: <strong>${score}</strong><br>Space / Tap to retry`);
    }, 600);
  }

  // ── Main loop ────────────────────────────────────────────────────────────────
  function draw() {
    drawBackground();
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();
    if (gameState === 'running') drawScore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  bestScore  = 0;
  gameState  = 'idle';
  bird       = { x: BIRD_X, y: H / 2, vy: 0, angle: 0, alive: true };
  pipes      = [];
  score      = 0;
  frameCount = 0;

  showOverlay('🐦 Flappy Bird', 'Press <strong>Space</strong> or <strong>Tap</strong> to start');
  loop();
}());
