precision mediump float;

uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform float u_blurRadius;
uniform bool u_horizontal;

varying vec2 vUv;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 result = vec4(0.0);
    
    // Gaussian blur weights
    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.1945946;
    weights[2] = 0.1216216;
    weights[3] = 0.054054;
    weights[4] = 0.016216;
    
    result += texture2D(u_inputTexture, vUv) * weights[0];
    
    for(int i = 1; i < 5; ++i) {
        vec2 offset = u_horizontal ? 
            vec2(texelSize.x * float(i) * u_blurRadius, 0.0) :
            vec2(0.0, texelSize.y * float(i) * u_blurRadius);
            
        result += texture2D(u_inputTexture, vUv + offset) * weights[i];
        result += texture2D(u_inputTexture, vUv - offset) * weights[i];
    }
    
    gl_FragColor = result;
}