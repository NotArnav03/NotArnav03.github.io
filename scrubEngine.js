/* ═══════════════════════════════════════════════════════════════════════════
   ScrubEngine — Preloads an image sequence and maps scroll-progress to frames
   ═══════════════════════════════════════════════════════════════════════════ */

export class ScrubEngine {

    /**
     * @param {object}   opts
     * @param {string}   opts.basePath      — directory containing the frames
     * @param {string}   opts.prefix        — filename prefix  (e.g. "ezgif-frame-")
     * @param {string}   opts.extension     — file extension   (e.g. ".jpg")
     * @param {number}   opts.totalFrames   — total images in the sequence
     * @param {number}   opts.startIndex    — first frame number (1-based default)
     * @param {Function} [opts.onProgress]  — called with (loaded, total)
     * @param {Function} [opts.onComplete]  — called when all frames are loaded
     */
    constructor(opts) {
        this.basePath = opts.basePath || './Model image/';
        this.prefix = opts.prefix || 'ezgif-frame-';
        this.extension = opts.extension || '.jpg';
        this.totalFrames = opts.totalFrames || 150;
        this.startIndex = opts.startIndex || 1;
        this.onProgress = opts.onProgress || null;
        this.onComplete = opts.onComplete || null;

        /** @type {THREE.Texture[]} */
        this.textures = new Array(this.totalFrames).fill(null);
        this.loaded = 0;
        this.currentIdx = 0;
        this.isReady = false;

        /** The ShaderMaterial whose `uTexture` uniform we update */
        this.material = null;
    }

    /* ── Helpers ──────────────────────────────────────────────────────── */

    /** Build the zero-padded filename for a given index (0-based internal). */
    _fileName(index) {
        const num = String(index + this.startIndex).padStart(3, '0');
        return `${this.basePath}${this.prefix}${num}${this.extension}`;
    }

    /* ── Public API ───────────────────────────────────────────────────── */

    /**
     * Bind to a ShaderMaterial so we can update its `uTexture` uniform.
     * @param {THREE.ShaderMaterial} mat
     */
    bind(mat) {
        this.material = mat;
    }

    /**
     * Start preloading all frames.
     * Uses THREE.TextureLoader for GPU-ready textures.
     */
    preload() {
        const loader = new THREE.TextureLoader();

        for (let i = 0; i < this.totalFrames; i++) {
            const url = this._fileName(i);

            loader.load(
                url,
                (tex) => {
                    tex.minFilter = THREE.LinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.format = THREE.RGBAFormat;
                    this.textures[i] = tex;
                    this.loaded++;

                    if (this.onProgress) this.onProgress(this.loaded, this.totalFrames);

                    if (this.loaded === this.totalFrames) {
                        this.isReady = true;
                        // Apply the first frame immediately
                        this.setProgress(0);
                        if (this.onComplete) this.onComplete();
                    }
                },
                undefined,
                () => {
                    // Error loading a frame — fill with null and continue
                    this.loaded++;
                    if (this.onProgress) this.onProgress(this.loaded, this.totalFrames);
                    if (this.loaded === this.totalFrames) {
                        this.isReady = true;
                        this.setProgress(0);
                        if (this.onComplete) this.onComplete();
                    }
                }
            );
        }
    }

    /**
     * Map a 0 → 1 progress value to a frame index and swap the texture.
     * @param {number} progress — normalised scroll progress (0–1)
     */
    setProgress(progress) {
        const p = Math.max(0, Math.min(1, progress));
        const idx = Math.min(
            Math.floor(p * this.totalFrames),
            this.totalFrames - 1
        );

        if (idx === this.currentIdx && this.material?.uniforms.uTexture.value) return;

        this.currentIdx = idx;
        const tex = this.textures[idx];
        if (tex && this.material) {
            this.material.uniforms.uTexture.value = tex;
        }
    }

    /**
     * Release GPU memory for all loaded textures.
     */
    dispose() {
        for (const tex of this.textures) {
            if (tex) tex.dispose();
        }
        this.textures = [];
    }
}
