/*
 * Base class for all the background animations.
 */

class Animation {
    constructor(canvas, colors, colorsAlt, name, file) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.bgColor = "#FFFFFF";
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.colorA = colors[0];
        this.colorB = colors[3];

        this.name = name;
        this.file = file;
        this.time = 0;
        this.frame = 0;
    }

    getFPS(){
        return 30;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    update(elapsed){
        this.time += elapsed / 1000;
        ++this.frame;
    }

    resize(){

    }
}

module.exports = Animation;
