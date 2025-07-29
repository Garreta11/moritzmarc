precision mediump float;

uniform sampler2D u_videoTexture;
uniform sampler2D u_trailTexture;
uniform float u_trailIntensity;
uniform float u_trailBlend;
uniform vec3 u_trailColor;

varying vec2 vUv;

void main() {
    vec4 video = texture2D(u_videoTexture, vUv);
    vec4 trail = texture2D(u_trailTexture, vUv);
    
    // Create colorized trail
    vec3 colorizedTrail = trail.rgb * u_trailColor * u_trailIntensity;
    
    // Blend modes
    vec3 finalColor = video.rgb;
    
    // Add blend mode
    if (u_trailBlend < 0.5) {
        finalColor = mix(video.rgb, video.rgb + colorizedTrail, u_trailBlend * 2.0);
    }
    // Screen blend mode
    else {
        vec3 screenBlend = 1.0 - (1.0 - video.rgb) * (1.0 - colorizedTrail);
        finalColor = mix(video.rgb + colorizedTrail, screenBlend, (u_trailBlend - 0.5) * 2.0);
    }
    
    gl_FragColor = vec4(finalColor, video.a);
    // gl_FragColor = vec4(colorizedTrail, 1.0);
}