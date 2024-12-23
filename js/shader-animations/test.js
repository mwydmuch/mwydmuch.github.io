
'use strict';

const NAME = "Test shader animation",
      FILE = "test.js",
      DESC = `
Just shader test animation.
`;

const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec2 uResolution;

    vec4 permute(vec4 x){
        return mod(((x*34.0)+1.0)*x, 289.0);
    }

    vec4 taylorInvSqrt(vec4 r){
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec2 fade(vec2 t){
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    // Classic Perlin noise
    float cnoise(vec2 P){
        vec2 Pi = mod(floor(P), 289.0);
        vec2 Pf = fract(P);
        vec4 ix = vec4(Pi.x, Pi.x + 1.0, Pi.x, Pi.x + 1.0);
        vec4 iy = vec4(Pi.y, Pi.y, Pi.y + 1.0, Pi.y + 1.0);

        vec4 i = permute(permute(ix) + iy);

        vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
        vec4 gy = abs(gx) - 0.5;
        vec4 tx = floor(gx + 0.5);
        gx = gx - tx;

        vec2 g00 = vec2(gx.x, gy.x);
        vec2 g10 = vec2(gx.y, gy.y);
        vec2 g01 = vec2(gx.z, gy.z);
        vec2 g11 = vec2(gx.w, gy.w);

        vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g10,g10), dot(g01,g01), dot(g11,g11)));
        g00 *= norm.x;
        g10 *= norm.y;
        g01 *= norm.z;
        g11 *= norm.w;

        float n00 = dot(g00, Pf);
        float n10 = dot(g10, Pf - vec2(1.0, 0.0));
        float n01 = dot(g01, Pf - vec2(0.0, 1.0));
        float n11 = dot(g11, Pf - vec2(1.0, 1.0));

        vec2 fade_xy = fade(Pf);
        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
        float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
        return 2.3 * n_xy;
    }

    void main() {
        vec2 st = gl_FragCoord.xy / uResolution;
        // Scale the UV coordinates to increase the noise frequency
        float noiseValue = cnoise(st * 10.0);
        // Map noise from [-1,1] to [0,1]
        noiseValue = noiseValue * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(noiseValue), 1.0);
    }
`;

const ShaderAnimation = require("../shader-animation");

class TestShaderAnimation extends ShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);
    }
}

module.exports = TestShaderAnimation;
