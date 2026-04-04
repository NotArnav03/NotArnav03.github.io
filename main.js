/* Scroll-driven: Diffusion Noise -> Loss Landscape -> Gradient Descent */
const canvas = document.getElementById("neural-canvas");
const ctx    = canvas.getContext("2d");

/* ---- Declarations ---- */
let W=0, H=0, CX=0, CY=0, SCALE=0;

const AZR = 42*Math.PI/180, ELR = 32*Math.PI/180;
const cAZ=Math.cos(AZR), sAZ=Math.sin(AZR);
const cEL=Math.cos(ELR), sEL=Math.sin(ELR);

const GRID=32, RNG=2.85;
let grid=[], lossMin=0, lossMax=1;

let gdPath = [];

const NPART = 1400;
const particles = [];

let scrollProgress = 0;
let frame = 0;
let gdLoop = 0;

/* ---- Functions ---- */
function loss(x, y) {
  return (x*x*0.32 + y*y*0.48)
       + 0.48 * Math.sin(1.9*x) * Math.cos(1.6*y)
       + 0.14 * Math.cos(2.8*x + 0.9);
}
function dloss(x, y) {
  const h=0.001;
  return [(loss(x+h,y)-loss(x-h,y))/(2*h),
          (loss(x,y+h)-loss(x,y-h))/(2*h)];
}

function project(wx, wy, wz) {
  const rx = wx*cAZ - wy*sAZ;
  const ry = wx*sAZ + wy*cAZ;
  return [CX + rx*SCALE, CY + (ry*cEL - wz*sEL)*SCALE];
}

function buildGrid() {
  lossMin=Infinity; lossMax=-Infinity;
  const tmp=[];
  for (let i=0;i<=GRID;i++) {
    tmp[i]=[];
    for (let j=0;j<=GRID;j++) {
      const wx=-RNG+(i/GRID)*2*RNG, wy=-RNG+(j/GRID)*2*RNG;
      const wz=loss(wx,wy);
      lossMin=Math.min(lossMin,wz); lossMax=Math.max(lossMax,wz);
      tmp[i][j]={wx,wy,wz};
    }
  }
  grid=[];
  for (let i=0;i<=GRID;i++) {
    grid[i]=[];
    for (let j=0;j<=GRID;j++) {
      const {wx,wy,wz}=tmp[i][j];
      const t=(wz-lossMin)/(lossMax-lossMin);
      const [sx,sy]=project(wx,wy,wz);
      grid[i][j]={sx,sy,wx,wy,wz,t};
    }
  }
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  CX = W / 2; CY = H * 0.54;
  SCALE = Math.min(W, H) * 0.145;
  buildGrid();
}

function buildGDPath() {
  gdPath = [];
  let x=-2.4, y=2.0;
  for (let i=0; i<100; i++) {
    gdPath.push([x, y, loss(x,y)]);
    const [gx,gy] = dloss(x,y);
    x -= 0.038*gx; y -= 0.038*gy;
  }
  gdPath.push([x, y, loss(x,y)]);
}

function seedParticles() {
  let s = 0xDEADBEEF;
  function rng() {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  }
  for (let i=0; i<NPART; i++) {
    particles.push({
      x: rng() * 1920,
      y: rng() * 1080,
      vx: (rng()-0.5) * 1.1,
      vy: (rng()-0.5) * 1.1,
      r:  1.4 + rng()*3.0,
      hue: rng() < 0.6 ? 188 : 265,
      phase: rng() * Math.PI * 2,
      speed: 0.5 + rng()*1.2,
      wobble: 0.4 + rng()*0.9
    });
  }
}

function lossColor(t, alpha) {
  const r = Math.round(0   + t*124);
  const g = Math.round(212 - t*154);
  const b = Math.round(255 - t*18);
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateScroll() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollProgress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function ease(t) { return t*t*(3-2*t); }

function drawNoise(alpha) {
  for (const p of particles) {
    p.x += p.vx + Math.sin(frame * 0.008 * p.speed + p.phase) * p.wobble;
    p.y += p.vy + Math.cos(frame * 0.006 * p.speed + p.phase) * p.wobble;
    if (p.x < -30) p.x = W + 30;
    if (p.x > W+30) p.x = -30;
    if (p.y < -30) p.y = H + 30;
    if (p.y > H+30) p.y = -30;

    const pulse = 1 + Math.sin(frame * 0.05 * p.speed + p.phase) * 0.3;
    const glowR = p.r * (4.5 + pulse * 2);
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
    const col  = p.hue === 188
      ? `rgba(0,212,255,${alpha * 0.9})`
      : `rgba(124,58,237,${alpha * 0.9})`;
    const col0 = p.hue === 188
      ? `rgba(0,212,255,0)`
      : `rgba(124,58,237,0)`;
    grd.addColorStop(0, col);
    grd.addColorStop(1, col0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowR, 0, Math.PI*2);
    ctx.fillStyle = grd;
    ctx.fill();
  }
}

function drawWireframe(alpha) {
  const ripple = frame * 0.018;
  const quads = [];
  for (let i=0; i<GRID; i++) {
    for (let j=0; j<GRID; j++) {
      const ga=grid[i][j], gb=grid[i+1][j], gc=grid[i+1][j+1], gd=grid[i][j+1];
      function animPt(g) {
        const breathe = Math.sin(ripple + g.wx*0.7 + g.wy*0.5) * 0.15;
        const [sx,sy] = project(g.wx, g.wy, g.wz + breathe);
        return {sx, sy, t: g.t};
      }
      const a=animPt(ga), b=animPt(gb), c=animPt(gc), d=animPt(gd);
      const avgY = (a.sy+b.sy+c.sy+d.sy)/4;
      const avgT = (a.t+b.t+c.t+d.t)/4;
      quads.push({a,b,c,d,avgY,avgT});
    }
  }
  quads.sort((a,b) => b.avgY - a.avgY);
  for (const {a,b,c,d,avgT} of quads) {
    ctx.beginPath();
    ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy);
    ctx.lineTo(c.sx,c.sy); ctx.lineTo(d.sx,d.sy);
    ctx.closePath();
    ctx.fillStyle   = lossColor(avgT, alpha * 0.09);
    ctx.strokeStyle = lossColor(avgT, alpha * 0.6);
    ctx.lineWidth   = 0.7;
    ctx.fill();
    ctx.stroke();
  }
}

function drawGDPath(alpha) {
  if (gdPath.length < 2) return;
  gdLoop += 0.45;
  if (gdLoop > gdPath.length - 1) gdLoop = 0;
  const steps = Math.floor(gdLoop);

  ctx.save();
  for (let i=0; i<steps; i++) {
    const [ax,ay] = project(...gdPath[i]);
    const [bx,by] = project(...gdPath[i+1]);
    const prog = i / (gdPath.length-1);
    const trailAlpha = (i / Math.max(steps,1)) * 0.85 * alpha;
    ctx.beginPath();
    ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
    ctx.strokeStyle = lossColor(prog * 0.6, trailAlpha);
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }

  const cur = gdPath[steps];
  const [px,py] = project(...cur);
  const pulse = 14 + Math.sin(frame * 0.12) * 6;
  const grd = ctx.createRadialGradient(px,py,0, px,py, pulse*1.8);
  grd.addColorStop(0, `rgba(0,255,220,${0.95*alpha})`);
  grd.addColorStop(0.35, `rgba(0,212,255,${0.5*alpha})`);
  grd.addColorStop(1, `rgba(0,212,255,0)`);
  ctx.beginPath();
  ctx.arc(px, py, pulse*1.8, 0, Math.PI*2);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py, 4.5, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}

function draw() {
  frame++;
  ctx.clearRect(0, 0, W, H);
  const s = scrollProgress;

  const noiseA = ease(clamp01(1.3 - s * 2.2));
  const wireA  = ease(clamp01((s - 0.15) / 0.28));
  const gdA    = ease(clamp01((s - 0.42) / 0.38));

  // Always keep a base noise layer for movement
  const baseNoise = Math.max(noiseA, 0.13);
  drawNoise(baseNoise);
  if (wireA  > 0.001) drawWireframe(wireA);
  if (gdA    > 0.001) drawGDPath(gdA);

  requestAnimationFrame(draw);
}

/* ---- Init ---- */
resize();
buildGDPath();
seedParticles();
window.addEventListener("resize",  resize,       { passive:true });
window.addEventListener("scroll",  updateScroll, { passive:true });
window.addEventListener("resize",  updateScroll, { passive:true });

(function init() {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
      setTimeout(() => { loader.style.display = "none"; }, 850);
    }, 700);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".float-card").forEach(el => io.observe(el));

  const toggle = document.getElementById("nav-toggle");
  const links  = document.getElementById("header-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
    });
  }

  const phrases = [
    "Building transformer architectures",
    "Designing fraud detection systems",
    "Fine-tuning large language models",
    "Engineering clinical AI pipelines",
    "Classifying audio with deep CNNs"
  ];
  const el = document.getElementById("typewriter-text");
  if (el) {
    let pi = 0, ci = 0, deleting = false;
    function tick() {
      const word = phrases[pi];
      if (!deleting) {
        el.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      } else {
        el.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; pi = (pi+1) % phrases.length; }
      }
      setTimeout(tick, deleting ? 38 : 68);
    }
    tick();
  }

  draw();
}());
