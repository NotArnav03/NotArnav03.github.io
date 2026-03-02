/* ═══════════════════════════════════════════════════════════════════════════
   Tunnel Shader — Subtle center-out zoom / lens distortion
   Creates a soft, futuristic, premium feel  (NOT dark or horror-like)
   ═══════════════════════════════════════════════════════════════════════════ */

export const TunnelShader = {

  uniforms: {
    uTexture:    { value: null },
    uDistortion: { value: 0.0 },   // 0 → 1 range, driven by scroll progress
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D uTexture;
    uniform float     uDistortion;

    varying vec2 vUv;

    void main() {
      // Focal point slightly below centre — feels more cinematic
      vec2 center = vec2(0.5, 0.51);
      vec2 delta  = vUv - center;

      // Barrel-style distortion that pushes outward from centre
      float dist   = length(delta);
      float power  = uDistortion * 0.35;                // keep it subtle
      float barrel = 1.0 + power * dist * dist;

      vec2 distortedUv = center + delta * barrel;

      // Clamp UVs to prevent border artefacts
      distortedUv = clamp(distortedUv, 0.0, 1.0);

      vec4 texColor = texture2D(uTexture, distortedUv);

      // Subtle brightness / contrast lift in the centre (futuristic glow)
      float vignetteLift = 1.0 + 0.08 * (1.0 - smoothstep(0.0, 0.7, dist));
      texColor.rgb *= vignetteLift;

      gl_FragColor = texColor;
    }
  `
};
