precision mediump float;

uniform sampler2D u_videoTexture;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_rippleStrength; // Ripple intensity (0.01 to 0.1)
uniform float u_rippleSpeed;    // Speed of ripple animation (1.0 to 5.0)
uniform float u_rippleRadius;   // Radius of the ripple effect (0.1 to 0.5)

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float dist = distance(uv, u_mouse);

  float ripple = sin(dist * 20.0 - u_time * u_rippleSpeed) * u_rippleStrength;
  float fade = 1.0 - smoothstep(0.0, u_rippleRadius, dist);
  ripple *= fade;

  vec2 direction = normalize(uv - u_mouse);
  
  // Apply the ripple deformation to UV coordinates
  vec2 deformedUv = uv + direction * ripple;

  
  vec4 videoColor = texture2D(u_videoTexture, deformedUv);
  gl_FragColor = videoColor;
  // gl_FragColor = vec4(deformedUv, 0., 1.);
}