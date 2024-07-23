
'use strict';

const NAME = "Test shader animation",
      FILE = "test.js",
      DESC = `
Just shader test animation.
`;

const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec2 uResolution;
    void main(void) {
        vec2 st = gl_FragCoord.xy / uResolution;
        gl_FragColor = vec4(st.x, st.y, 0.5, 1.0); // Gradient effect
    }
`;

const ShaderAnimation = require("../shader-animation");

class TestShaderAnimation extends ShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);
    }
}

module.exports = TestShaderAnimation;
