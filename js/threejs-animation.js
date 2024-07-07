'use strict';

/*
 * Base class for all the background animations.
 */


const Animation = require("./animation");

class ThreejsAnimation extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed);
        renderer = new THREE.WebGLRenderer( { "canvas": canvas } );
        
    }

    draw() {

    }
}

module.exports = ShaderAnimation;
