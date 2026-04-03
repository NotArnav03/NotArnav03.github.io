/* ================================================================
   Neural Network Canvas + UI — Arnav Gupta Portfolio
   ================================================================ */

/* -- Canvas setup ------------------------------------------------ */
const canvas = document.getElementById('neural-canvas');
const ctx    = canvas.getContext('2d');
let W = 0, H = 0;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initNodes(); }, { passive:true });

/* -- Nodes ------------------------------------------------------- */
const NODE_COUNT = window.innerWidth < 640 ? 45 : 75;
let nodes = [];

function createNode() {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.25 + Math.random() * 0.35;
  return {
    x:     Math.random() * W,
    y:     Math.random() * H,
    vx:    Math.cos(angle) * speed,
    vy:    Math.sin(angle) * speed,
    r:     1.2 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
  };
}

function initNodes() {
  nodes = Array.from({ length: NODE_COUNT }, createNode);
}
initNodes();

/* -- Scroll progress --------------------------------------------- */
let scrollProgress = 0;
window.addEventListener('scroll', () => {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = docH > 0 ? Math.min(1, window.scrollY / docH) : 0;
}, { passive:true });

/* -- Draw loop ---------------------------------------------------- */
function draw() {
  ctx.clearRect(0, 0, W, H);

  const maxDist    = 140 + scrollProgress * 110;
  const connAlpha  = 0.10 + scrollProgress * 0.22;
  const nodeAlpha  = 0.45 + scrollProgress * 0.45;
  const speedMult  = 1   + scrollProgress * 3.5;

  /* Connections */
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist2 = dx*dx + dy*dy;
      if (dist2 > maxDist * maxDist) continue;
      const dist = Math.sqrt(dist2);
      const t = 1 - dist / maxDist;
      const alpha = t * t * connAlpha;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, `rgba(0,212,255,${alpha})`);
      grad.addColorStop(1, `rgba(124,58,237,${alpha * 0.8})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 0.5 + t * 0.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  /* Nodes */
  for (const n of nodes) {
    n.phase += 0.022;
    const pulse = Math.sin(n.phase) * 0.5 + 0.5;
    const alpha = nodeAlpha + pulse * 0.35;

    /* Glow halo */
    const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
    gr.addColorStop(0, `rgba(0,212,255,${alpha * 0.5})`);
    gr.addColorStop(1, `rgba(0,212,255,0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
    ctx.fill();

    /* Core dot */
    ctx.fillStyle = `rgba(0,212,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();

    /* Move & wrap */
    n.x += n.vx * speedMult;
    n.y += n.vy * speedMult;
    if (n.x < -30) n.x = W + 30; else if (n.x > W + 30) n.x = -30;
    if (n.y < -30) n.y = H + 30; else if (n.y > H + 30) n.y = -30;
  }

  requestAnimationFrame(draw);
}
draw();

/* -- Loader ------------------------------------------------------ */
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => loader && loader.classList.add('hidden'), 600);
});
setTimeout(() => loader && loader.classList.add('hidden'), 2000);

/* -- Scroll-reveal (IntersectionObserver) ------------------------ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.float-card').forEach(el => revealObserver.observe(el));

/* -- Hamburger nav ----------------------------------------------- */
const navToggle  = document.getElementById('nav-toggle');
const headerLinks = document.getElementById('header-links');
if (navToggle && headerLinks) {
  navToggle.addEventListener('click', () => {
    const open = headerLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  headerLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    headerLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));
}

/* -- Typewriter -------------------------------------------------- */
const WORDS = ['Deep Learning', 'Transformer Architectures', 'NLP Systems', 'Generative AI', 'AI Research'];
let wIdx = 0, cIdx = 0, deleting = false;
const twEl = document.getElementById('typewriter-text');

function type() {
  if (!twEl) return;
  const word = WORDS[wIdx];
  if (!deleting) {
    twEl.textContent = word.slice(0, ++cIdx);
    if (cIdx === word.length) { deleting = true; setTimeout(type, 2000); return; }
  } else {
    twEl.textContent = word.slice(0, --cIdx);
    if (cIdx === 0) { deleting = false; wIdx = (wIdx + 1) % WORDS.length; }
  }
  setTimeout(type, deleting ? 55 : 85);
}
setTimeout(type, 1400);
