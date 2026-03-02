/* ═══════════════════════════════════════════════════════════════════════════
   Main — Scroll-driven sky background (Canvas 2D — no Three.js dependency)
   ═══════════════════════════════════════════════════════════════════════════ */

const canvas = document.getElementById('sky-canvas');
const ctx = canvas.getContext('2d');
const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const loaderText = document.getElementById('loader-text');

/* ── Canvas sizing ─────────────────────────────────────────────────── */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ── Frame preloader ───────────────────────────────────────────────── */
const TOTAL = 150;
const frames = [];
let loaded = 0;

function padNum(n) { return String(n).padStart(3, '0'); }

function hideLoader() {
    if (loaderEl && !loaderEl.classList.contains('hidden')) {
        loaderEl.classList.add('hidden');
    }
    if (window.__loaderFallback) clearTimeout(window.__loaderFallback);
}

for (let i = 1; i <= TOTAL; i++) {
    const img = new Image();
    img.src = `./Model image/ezgif-frame-${padNum(i)}.jpg`;
    img.onload = img.onerror = () => {
        loaded++;
        const pct = Math.round((loaded / TOTAL) * 100);
        if (loaderFill) loaderFill.style.width = `${pct}%`;
        if (loaderText) loaderText.textContent = `Loading… ${pct}%`;
        if (loaded === TOTAL) {
            hideLoader();
            drawFrame(0);
        }
    };
    frames.push(img);
}

// Fallback: hide loader after 5s even if frames fail
setTimeout(hideLoader, 5000);

/* ── Draw a frame to canvas (cover-fit) ────────────────────────────── */
function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;

    // Cover fit
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
}

/* ── Scroll-driven scrub with smooth lerp ──────────────────────────── */
let currentProgress = 0;
let targetProgress = 0;
let currentFrame = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
}, { passive: true });

function animate() {
    currentProgress += (targetProgress - currentProgress) * 0.08;
    const idx = Math.min(Math.floor(currentProgress * TOTAL), TOTAL - 1);

    if (idx !== currentFrame) {
        currentFrame = idx;
        drawFrame(idx);
    }

    requestAnimationFrame(animate);
}
animate();
