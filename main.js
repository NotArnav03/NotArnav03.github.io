/* PORTFOLIO_OS v2.4.1 — main.js */

/* ── Scroll progress bar ───────────────── */
const scrollBar = document.getElementById('scroll-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  if (scrollBar) scrollBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

/* ── Custom cursor + trail ─────────────── */
const cursorDot = document.getElementById('cursor-dot');
let mx = -99, my = -99;
const trail = [];
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top  = my + 'px';
  const dot = document.createElement('div');
  dot.className = 'cursor-trail';
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
  document.body.appendChild(dot);
  trail.push(dot);
  setTimeout(() => { dot.remove(); }, 450);
});

/* ── Binary rain canvas ────────────────── */
(function binaryRain() {
  const c = document.getElementById('bin-rain');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, cols, drops;
  function resize() {
    W = c.width  = c.offsetWidth;
    H = c.height = c.offsetHeight;
    cols = Math.floor(W / 14);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  function tick() {
    ctx.fillStyle = 'rgba(8,8,8,0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00FF41';
    ctx.font = '12px JetBrains Mono, monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = Math.random() > 0.5 ? '1' : '0';
      ctx.fillText(ch, i * 14, drops[i] * 14);
      if (drops[i] * 14 > H && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.4;
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ── Boot splash ───────────────────────── */
(function boot() {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  const bar  = document.getElementById('boot-bar');
  const pct  = document.getElementById('boot-pct');
  const lines = document.getElementById('boot-lines');
  const msgs = [
    'BIOS v2.4.1 OK',
    'Initializing memory...',
    'Loading kernel modules...',
    'Mounting filesystem...',
    'Starting neural interface...',
    'Portfolio OS ready.'
  ];
  let pv = 0, mi = 0;
  const barInc = setInterval(() => {
    pv = Math.min(pv + (Math.random() * 4 + 1), 100);
    if (bar) bar.style.width = pv + '%';
    if (pct) pct.textContent = Math.floor(pv) + '%';
    if (mi < msgs.length && pv > (mi + 1) * (100 / msgs.length)) {
      const p = document.createElement('p');
      p.textContent = '> ' + msgs[mi++];
      if (lines) lines.appendChild(p);
    }
    if (pv >= 100) {
      clearInterval(barInc);
      setTimeout(() => {
        splash.classList.add('fade');
        setTimeout(() => { splash.style.display = 'none'; }, 700);
      }, 400);
    }
  }, 40);
})();

/* ── Navbar active + hamburger ─────────── */
const navLinks = document.querySelectorAll('.nav-link[data-section]');
const sections = [];
navLinks.forEach(a => {
  const id = a.dataset.section;
  const el = document.getElementById(id);
  if (el) sections.push({ el, a });
});
function updateActiveNav() {
  const mid = window.scrollY + window.innerHeight * 0.4;
  sections.forEach(({ el, a }) => {
    const top = el.offsetTop, bot = top + el.offsetHeight;
    a.classList.toggle('active', mid >= top && mid < bot);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

const ham = document.getElementById('nav-ham');
const overlay = document.getElementById('nav-overlay');
const ovClose = document.getElementById('nav-overlay-close');
ham?.addEventListener('click', () => { overlay?.classList.add('open'); ham.setAttribute('aria-expanded','true'); });
ovClose?.addEventListener('click', () => { overlay?.classList.remove('open'); ham?.setAttribute('aria-expanded','false'); });
overlay?.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => { overlay.classList.remove('open'); ham?.setAttribute('aria-expanded','false'); }));

/* ── Hero typewriter ───────────────────── */
(function heroType() {
  const body = document.getElementById('hero-body');
  const cta  = document.getElementById('hero-cta');
  if (!body) return;
  const lines = [
    '> SYSTEM BOOT... OK',
    '> LOADING USER PROFILE...',
    '> NAME: Arnav Gupta',
    '> ROLE: AI/ML Engineer',
    '> LOCATION: Pune, India',
    '> SPECIALIZATION: Deep Learning, NLP, Computer Vision',
    '> STATUS: AVAILABLE FOR OPPORTUNITIES',
    '> _'
  ];
  let li = 0, ci = 0;
  let currentP = null;
  function nextChar() {
    if (li >= lines.length) {
      if (cta) { cta.style.display = 'flex'; cta.style.opacity = '1'; }
      return;
    }
    if (!currentP) {
      currentP = document.createElement('p');
      currentP.className = 'ty-line';
      body.appendChild(currentP);
    }
    const line = lines[li];
    if (ci < line.length) {
      currentP.textContent += line[ci++];
      setTimeout(nextChar, 38);
    } else {
      li++; ci = 0; currentP = null;
      setTimeout(nextChar, li < lines.length ? 180 : 0);
    }
  }
  // Start after boot splash (roughly 2.5s)
  setTimeout(nextChar, 2600);
})();

/* ── IntersectionObserver reveal ───────── */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealIO.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal-up,.reveal-left,.reveal-right').forEach(el => revealIO.observe(el));

/* ── Stat count-up ─────────────────────── */
const statIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const step = Math.ceil(target / 40);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(iv);
    }, 40);
    statIO.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-n[data-target]').forEach(el => statIO.observe(el));

/* ── Skills progress bars ──────────────── */
const skillIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.skill-row[data-pct]').forEach(row => {
      const pct = parseInt(row.dataset.pct, 10);
      const fill = row.querySelector('.sk-fill');
      const label = row.querySelector('.sk-pct');
      let cur = 0;
      const iv = setInterval(() => {
        cur = Math.min(cur + 2, pct);
        if (fill) fill.style.width = cur + '%';
        if (label) label.textContent = cur + '%';
        if (cur >= pct) clearInterval(iv);
      }, 20);
    });
    skillIO.unobserve(e.target);
  });
}, { threshold: 0.2 });
document.querySelectorAll('.skills-col').forEach(col => skillIO.observe(col));

/* ── Contact info typewriter ───────────── */
const contactLines = document.getElementById('contact-lines');
const contactInfoIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting || !contactLines || contactLines.children.length > 0) return;
    const info = [
      '$ whoami',
      'Arnav Gupta',
      '',
      '$ cat contact.cfg',
      '> EMAIL    arnav.g1010@gmail.com',
      '> GITHUB   github.com/NotArnav03',
      '> LINKEDIN linkedin.com/in/arnav-gupta-099838329',
      '> LOCATION VIT Pune, India',
    ];
    let i = 0;
    function addLine() {
      if (i >= info.length) return;
      const p = document.createElement('p');
      p.textContent = info[i++];
      p.style.opacity = '0';
      contactLines.appendChild(p);
      setTimeout(() => { p.style.transition = 'opacity 0.3s'; p.style.opacity = '1'; }, 30);
      setTimeout(addLine, 120);
    }
    addLine();
    contactInfoIO.unobserve(e.target);
  });
}, { threshold: 0.3 });
if (contactLines) contactInfoIO.observe(contactLines.closest('section'));

/* ── Interactive terminal ──────────────── */
(function iterm() {
  const out   = document.getElementById('iterm-out');
  const input = document.getElementById('iterm-in');
  if (!out || !input) return;
  const history = [];
  let histIdx = -1;

  const COMMANDS = {
    help() {
      return [
        'Available commands:',
        '  help       — show this list',
        '  whoami     — agent bio',
        '  skills     — skill chart',
        '  projects   — project list',
        '  contact    — contact info',
        '  resume     — download resume',
        '  clear      — clear terminal',
      ];
    },
    whoami() {
      return [
        'NAME:   Arnav Gupta',
        'ROLE:   AI/ML Engineer',
        'SCHOOL: B.Tech CS (AI/ML), VIT Pune',
        'BIO:    Deep learning specialist — fraud detection, NLP,',
        '        clinical AI, audio classification.',
        '        Published at Springer ICAIN 2025.',
        '        Olympiad medalist. Gold in skating. Black belt.',
      ];
    },
    skills() {
      function bar(n) {
        const filled = Math.round(n / 5);
        return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + '] ' + n + '%';
      }
      return [
        'Python       ' + bar(90),
        'Scikit-learn ' + bar(85),
        'PyTorch      ' + bar(82),
        'Deep Learning' + bar(85),
        'NLP          ' + bar(80),
        'CNNs         ' + bar(85),
        'C++          ' + bar(70),
        'LLMs         ' + bar(75),
        'Flask        ' + bar(75),
      ];
    },
    projects() {
      return [
        '01  SAFEPAY AI     — Real-time fraud detection (~85-90% acc)',
        '02  CLINPATH AI    — LLaMA-powered clinical pathway generator',
        '03  GENRESOTA      — CNN-Transformer music genre classifier (~95% acc)',
        '04  ASRIS          — NLP resume ranking engine',
        '05  MINDMAPPER     — Mistral-7B clinical documentation assistant',
      ];
    },
    contact() {
      return [
        'EMAIL    arnav.g1010@gmail.com',
        'GITHUB   github.com/NotArnav03',
        'LINKEDIN linkedin.com/in/arnav-gupta-099838329',
      ];
    },
    clear() { out.innerHTML = ''; return []; },
    resume() {
      const lines = ['Initiating download...'];
      append(lines, 'amber');
      let p = 0;
      const p2 = document.createElement('p');
      p2.style.color = '#00FF41';
      out.appendChild(p2);
      out.scrollTop = out.scrollHeight;
      const iv = setInterval(() => {
        p = Math.min(p + 3, 100);
        p2.textContent = '[' + '='.repeat(Math.floor(p / 5)) + ' '.repeat(20 - Math.floor(p / 5)) + '] ' + p + '%';
        if (p >= 100) {
          clearInterval(iv);
          const done = document.createElement('p');
          done.textContent = '> DONE — opening ArnavGuptaResume.pdf';
          done.style.color = '#00FF41';
          out.appendChild(done);
          out.scrollTop = out.scrollHeight;
          setTimeout(() => { window.open('./ArnavGuptaResume.pdf', '_blank'); }, 600);
        }
      }, 40);
      return null;
    }
  };

  function append(lines, color) {
    if (!lines) return;
    lines.forEach(l => {
      const p = document.createElement('p');
      p.textContent = l;
      if (color === 'amber') p.style.color = '#FFB347';
      else if (color === 'dim') p.style.color = '#00FF4166';
      out.appendChild(p);
    });
    out.scrollTop = out.scrollHeight;
  }

  function run(cmd) {
    const trimmed = cmd.trim().toLowerCase();
    append(['student@portfolio:~$ ' + cmd], 'amber');
    if (!trimmed) return;
    if (COMMANDS[trimmed]) {
      const result = COMMANDS[trimmed]();
      if (result) append(result);
    } else {
      append([`bash: ${cmd}: command not found. Try 'help'.`], 'dim');
    }
    append(['']);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value;
      if (val.trim()) { history.unshift(val); histIdx = -1; }
      run(val);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      else { histIdx = -1; input.value = ''; }
    }
  });

  // Focus terminal on click
  document.querySelector('.iterm-wrap')?.addEventListener('click', () => input.focus());
})();

/* ── Contact form ──────────────────────── */
document.getElementById('c-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const name  = document.getElementById('f-name')?.value.trim();
  const email = document.getElementById('f-email')?.value.trim();
  const msg   = document.getElementById('f-msg')?.value.trim();
  const status = document.getElementById('f-status');
  if (!name || !email || !msg) {
    if (status) { status.textContent = '> ERROR: all fields required.'; status.className = 'f-err'; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (status) { status.textContent = '> ERROR: invalid email format.'; status.className = 'f-err'; }
    return;
  }
  if (status) {
    status.className = '';
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(p + 4, 100);
      status.textContent = 'TRANSMITTING [' + '='.repeat(Math.floor(p / 10)) + ' '.repeat(10 - Math.floor(p / 10)) + '] ' + p + '%';
      if (p >= 100) {
        clearInterval(iv);
        status.textContent = '> MESSAGE DELIVERED SUCCESSFULLY ✓';
        status.className = 'f-ok';
        e.target.reset();
      }
    }, 40);
  }
});
