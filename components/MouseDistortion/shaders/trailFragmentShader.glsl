precision mediump float;

uniform sampler2D u_previousTrail;
uniform vec2 u_mouse;
uniform vec2 u_previousMouse;
uniform float u_time;
uniform float u_trailRadius;
uniform float u_fadeSpeed;
uniform float u_intensity;
uniform bool u_isActive;

varying vec2 vUv;

void main() {
    vec4 prevTrail = texture2D(u_previousTrail, vUv);
    
    // Fade existing trail
    float fade = 1.0 - u_fadeSpeed;
    vec4 fadedTrail = prevTrail * fade;
    
    if (u_isActive) {
        // Add new trail point
        float dist = distance(vUv, u_mouse);
        float trail = smoothstep(u_trailRadius, 0.0, dist) * u_intensity;
        
        // Optional: Add motion blur by connecting current and previous mouse positions
        vec2 direction = u_mouse - u_previousMouse;
        float lineLength = length(direction);
        if (lineLength > 0.0) {
            vec2 lineDir = normalize(direction);
            vec2 toMouse = vUv - u_previousMouse;
            float projection = dot(toMouse, lineDir);
            projection = clamp(projection, 0.0, lineLength);
            vec2 closestPoint = u_previousMouse + lineDir * projection;
            float lineDist = distance(vUv, closestPoint);
            float lineTrail = smoothstep(u_trailRadius, 0.0, lineDist) * u_intensity;
            trail = max(trail, lineTrail);
        }
        
        fadedTrail.rgb = max(fadedTrail.rgb, vec3(trail));
        fadedTrail.a = max(fadedTrail.a, trail);
    }
    
    gl_FragColor = fadedTrail;
}