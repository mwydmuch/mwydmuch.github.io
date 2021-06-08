'use strict';

class Animation {
    constructor(canvas, colors) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.colors = colors;
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "unamed animation";
    }
}

module.exports = Animation;
