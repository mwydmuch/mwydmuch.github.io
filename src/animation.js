/*
 * Base class for all the background animations.
 */

class Animation {
    constructor(canvas, colors, colorsAlt, name, file) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.name = name;
        this.file = file;
    }

    getFPS(){
        return 25;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    resize(){

    }
}

module.exports = Animation;
