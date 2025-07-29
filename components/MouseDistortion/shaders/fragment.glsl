precision mediump float;

uniform float u_videoAspect;
uniform float u_canvasAspect;

uniform sampler2D u_videoTexture;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_rippleStrength;
uniform float u_rippleSpeed;
uniform float u_rippleRadius;
uniform float u_rippleIntensity;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Ripple effect using coverUv
  float dist = distance(uv, u_mouse);
  float ripple = sin(dist * 20.0 - u_time * u_rippleSpeed) * u_rippleStrength;
  float fade = 1.0 - smoothstep(0.0, u_rippleRadius, dist);
  ripple *= fade * u_rippleIntensity;

  vec2 direction = normalize(uv - u_mouse);
  vec2 deformedUv = uv + direction * ripple;

  // Clamp to avoid sampling outside
  vec4 videoColor = texture2D(u_videoTexture, clamp(deformedUv, 0.0, 1.0));
  gl_FragColor = videoColor;
}
