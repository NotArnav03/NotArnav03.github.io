/* Scroll-driven: Diffusion Noise -> Loss Landscape -> Gradient Descent */
const canvas = document.getElementById("neural-canvas");
const ctx    = canvas.getContext("2d");
let W=0, H=0, CX=0, CY=0, SCALE=0;

/* Loss function ------------------------------------------------ */
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

/* Projection --------------------------------------------------- */
const AZR = 42*Math.PI/180, ELR = 32*Math.PI/180;
const cAZ=Math.cos(AZR),sAZ=Math.sin(AZR);
const cEL=Math.cos(ELR),sEL=Math.sin(ELR);

function project(wx, wy, wz) {
  const rx = wx*cAZ - wy*sAZ;
  const ry = wx*sAZ + wy*cAZ;
  return [CX + rx*SCALE, CY + (ry*cEL - wz*sEL)*SCALE];
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  CX = W / 2; CY = H * 0.54;
  SCALE = Math.min(W, H) * 0.145;
  buildGrid();
}
resize();
window.addEventListener("resize", resize, { passive:true });

/* Gradient descent path ---------------------------------------- */
let gdPath = [];
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
buildGDPath();

/* Wireframe grid ----------------------------------------------- */
const GRID=32, RNG=2.85;
let grid=[], lossMin=0, lossMax=1;

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
      grid[i][j]={sx,sy,wz,t};
    }
  }
}

/* Noise particles -------------------------------------------- */
const NPART = 800;
const particles = [];
(function seedParticles() {
  let s = 0xDEADBEEF;
  function rng() {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  }
  for (let i=0; i<NPART; i++) {
    particles.push({
      nx: rng(), ny: rng(),
      r:  1.2 + rng()*2.2,
      hue: rng() < 0.6 ? 188 : 265,
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng()*0.7
    });
  }
})();

/* Color helpers ---------------------------------------------- */
function lossColor(t, alpha) {
  const r = Math.round(0   + t*124);
  const g = Math.round(212 - t*154);
  const b = Math.round(255 - t*18);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Scroll tracking -------------------------------------------- */
let scrollProgress = 0;
function updateScroll() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollProgress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
}
window.addEventListener("scroll", updateScroll, { passive:true });
window.addEventListener("resize", updateScroll, { passive:true });

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function ease(t) { return t*t*(3-2*t); }

/* drawNoise -------------------------------------------------- */
let frame = 0;
function drawNoise(alpha) {
  for (const p of particles) {
    const x = p.nx * W;
    const y = p.ny * H + Math.sin(frame * 0.01 * p.speed + p.phase) * 6;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3);
    const hsl1 = p.hue === 188 ? `rgba(0,212,255,${alpha*0.9})`
                               : `rgba(124,58,237,${alpha*0.9})`;
    const hsl0 = p.hue === 188 ? `rgba(0,212,255,0)`
                               : `rgba(124,58,237,0)`;
    grd.addColorStop(0, hsl1);
    grd.addColorStop(1, hsl0);
    ctx.beginPath();
    ctx.arc(x, y, p.r * 3, 0, Math.PI*2);
    ctx.fillStyle = grd;
    ctx.fill();
  }
}

/* drawWireframe ---------------------------------------------- */
function drawWireframe(alpha) {
  // Painter's algorithm: sort quads back-to-front by avg screen Y
  const quads = [];
  for (let i=0; i<GRID; i++) {
    for (let j=0; j<GRID; j++) {
      const a=grid[i][j], b=grid[i+1][j], c=grid[i+1][j+1], d=grid[i][j+1];
      const avgY = (a.sy+b.sy+c.sy+d.sy)/4;
      const avgT = (a.t+b.t+c.t+d.t)/4;
      quads.push({a,b,c,d,avgY,avgT});
    }
  }
  quads.sort((p,q) => q.avgY - p.avgY);

  for (const {a,b,c,d,avgT} of quads) {
    ctx.beginPath();
    ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy);
    ctx.lineTo(c.sx,c.sy); ctx.lineTo(d.sx,d.sy);
    ctx.closePath();
    ctx.fillStyle   = lossColor(avgT, alpha * 0.08);
    ctx.strokeStyle = lossColor(avgT, alpha * 0.55);
    ctx.lineWidth   = 0.6;
    ctx.fill();
    ctx.stroke();
  }
}

/* drawGDPath ------------------------------------------------- */
function drawGDPath(t) {
  if (t <= 0 || gdPath.length < 2) return;
  const steps = Math.floor(t * (gdPath.length - 1));

  // Trail
  ctx.save();
  for (let i=0; i<steps; i++) {
    const [ax,ay] = project(...gdPath[i]);
    const [bx,by] = project(...gdPath[i+1]);
    const prog = i / (gdPath.length-1);
    ctx.beginPath();
    ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
    ctx.strokeStyle = lossColor(prog * 0.6, 0.7);
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Glowing ball at current position
  const cur = gdPath[steps];
  const [bx,by] = project(...cur);
  const grd = ctx.createRadialGradient(bx,by,0, bx,by,18);
  grd.addColorStop(0, `rgba(0,255,220,0.95)`);
  grd.addColorStop(0.3, `rgba(0,212,255,0.5)`);
  grd.addColorStop(1, `rgba(0,212,255,0)`);
  ctx.beginPath();
  ctx.arc(bx, by, 18, 0, Math.PI*2);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx, by, 4, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

/* Main draw loop --------------------------------------------- */
function draw() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  const s = scrollProgress;
  // Act 1: noise fades out 0 -> 0.4
  const noiseA = ease(clamp01(1 - s / 0.40));
  // Act 2: wireframe fades in 0.2 -> 0.55
  const wireA  = ease(clamp01((s - 0.20) / 0.35));
  // Act 3: GD ball 0.50 -> 1.0
  const gdT    = ease(clamp01((s - 0.50) / 0.50));

  if (noiseA > 0.001) drawNoise(noiseA);
  if (wireA  > 0.001) drawWireframe(wireA);
  if (gdT    > 0.001) drawGDPath(gdT);

  requestAnimationFrame(draw);
}

/* Init — script is at end of <body>, DOM is ready immediately */
(function init() {
  /* Hide loader */
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
      setTimeout(() => { loader.style.display = "none"; }, 850);
    }, 700);
  }

  /* Intersection observer for float-cards */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".float-card").forEach(el => io.observe(el));

  /* Hamburger nav */
  const toggle = document.getElementById("nav-toggle");
  const links  = document.getElementById("header-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
    });
  }

  /* Typewriter */
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
