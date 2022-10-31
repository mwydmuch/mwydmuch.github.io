'use strict';

/*
 * Base class for all the background animations.
 */

const Utils = require("./utils");

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
        this.speed = 1;

        // Reset text settings
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }

    assignIfRandom(value, random){  // Commonly used by many constructors
        if(value === "random") return random;
        else return value;
    }

    clear(){
        Utils.clear(this.ctx, this.bgColor);
    }

    fadeOut(alpha) {  // Commonly used by some animations
        if (alpha <= 0.001 && this.frame % 10 === 0) Utils.blendColor(this.ctx, this.bgColor, alpha * 10, "lighter");
        else if (alpha <= 0.005 && this.frame % 2 === 0) Utils.blendColor(this.ctx, this.bgColor, alpha * 2, "lighter");
        else Utils.blendColor(this.ctx, this.bgColor, alpha, "lighter");
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
        // By default just update timer and frame count
        this.time += elapsed / 1000 * this.speed;
        ++this.frame;
    }

    resize(){
        // By default do nothing
    }

    getSettings() {
        return [] // By default there is no settings
    }

    mouseAction(cords) {
        // By default do nothing
    }
}

module.exports = Animation;
