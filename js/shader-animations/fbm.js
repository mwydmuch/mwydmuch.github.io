'use strict';

const NAME = "fractional Brownian motion",
      FILE = "fbm.js",
      DESC = `
Just shader test animation.
`;

const FRAGMENT_SHADER = `
    precision mediump float;
    uniform float timeMs;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    // Noise functions
    vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
        const float K1 = 0.366025404;
        const float K2 = 0.211324865;
        
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        float m = step(a.y, a.x);
        vec2 o = vec2(m, 1.0 - m);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        
        vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
        vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
        
        return dot(n, vec3(70.0));
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    void main() {
        vec2 uv = vUv - 0.5;
        vec2 st = uv * 2.0;
        
        // Create radial distortion
        float dist = length(st);
        float angle = atan(st.y, st.x);
        
        // Animated noise field
        vec2 noiseCoord = st * 3.0 + vec2(time * 0.1, time * 0.05);
        float n1 = fbm(noiseCoord);
        float n2 = fbm(noiseCoord * 1.5 + vec2(1.7, 9.2));
        
        // Create flow field
        vec2 flow = vec2(n1, n2) * 0.5;
        st += flow * 0.3;
        
        // Sample noise for shapes
        float shape = fbm(st * 2.0 + vec2(time * 0.02, 0.0));
        shape += fbm(st * 4.0 - vec2(0.0, time * 0.03)) * 0.5;
        
        // Create threshold for black shapes
        float threshold = 0.1 + sin(dist * 10.0 - time) * 0.1;
        float blackShape = smoothstep(threshold - 0.1, threshold, shape);
        
        // Create contour lines
        float contours = 0.0;
        for (float i = 0.0; i < 10.0; i++) {
            float level = i * 0.15 - 0.5;
            float line = abs(shape - level);
            contours += 1.0 - smoothstep(0.0, 0.02, line);
        }
        contours *= 0.5;
        
        // Apply contours only to black areas
        contours *= blackShape;
        
        // Background color (turquoise)
        vec3 bgColor = vec3(0.1, 0.7, 0.75);
        
        // Add some grain/texture
        float grain = (hash(st * 100.0 + time).x * 0.5 + 0.5) * 0.05;
        bgColor += grain;
        
        // Final color
        vec3 color = mix(bgColor, vec3(0.0), blackShape);
        color += vec3(contours);
        
        // Add subtle vignette
        float vignette = 1.0 - length(uv) * 0.3;
        color *= vignette;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;


//const ShaderAnimation = require("../shader-animation");
const ShaderAnimation = require("../threejs-shader-animation");

class FractionalBrownianMotion extends ShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);
    }
}

module.exports = FractionalBrownianMotion;