uniform sampler2D u_texture;
uniform float u_time;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 color = texture2D(u_texture, uv);
  gl_FragColor = color;
}