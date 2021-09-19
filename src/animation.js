'use strict';

class Animation {
    constructor(canvas, colors, colorsAlt) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.colors = colors;
        this.colorsAlt = colorsAlt;
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "unamed animation";
    }
}

module.exports = Animation;
