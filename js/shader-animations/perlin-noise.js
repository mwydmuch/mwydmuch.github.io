
'use strict';

const NAME = "Perlin noise shader",
      FILE = "perlin-noise.js",
      DESC = `
Animated Perlin noise field rendered with a fragment shader.
`;

const SHADER_NOISE = require("../shader-noise");

const FRAGMENT_SHADER = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;
`
+ SHADER_NOISE +
`
    void main() {
        vec2 uv = vUv,
             noiseCoord = uv - 0.5;
        noiseCoord.x *= resolution.x / resolution.y;
        noiseCoord = noiseCoord * 8.0 + vec2(time * 0.02, time * 0.015);

        float noiseValue = perlin2(noiseCoord);
        noiseValue = noiseValue * 0.5 + 0.5;

        gl_FragColor = vec4(vec3(noiseValue), 1.0);
    }
`;

const ShaderAnimation = require("../threejs-shader-animation");

class PerlinNoise extends ShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);
    }
}

module.exports = PerlinNoise;
