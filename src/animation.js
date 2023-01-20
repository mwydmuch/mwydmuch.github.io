'use strict';

/*
 * Base class for all the background animations.
 */

const Utils = require("./utils");

class Animation {
    constructor(canvas, colors, colorsAlt,
                name = "",
                file = "",
                description = "") {
        this.ctx = canvas.getContext("2d", { alpha: false });

        // Colors variables
        this.bgColor = "#FFFFFF";
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.colorA = colors[0];
        this.colorB = colors[3];

        // Basic info
        this.name = name;
        this.file = file;
        this.description = description;

        // Time variables
        this.time = 0;
        this.frame = 0;
        this.speed = 1;
        this.fps = 30;

        // Reset text settings
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";

        // Debug flag
        this.debug = false;
    }

    assignIfRandom(value, random){  // Commonly used by many constructors
        if(value === "random") return random;
        else return value;
    }

    clear(){  // Clear background
        Utils.clear(this.ctx, this.bgColor);
    }

    fadeOut(alpha) {  // Commonly used by some animations
        // Assumes that bgColor is white or other light color
        this.blendColorAlpha(this.bgColor, alpha, "lighter");
    }

    blendColorAlpha(color, alpha, mode) {  // More general version of the above
        if (alpha <= 0.0005 && this.frame % 20 === 0) Utils.blendColor(this.ctx, color, alpha * 20, mode);
        else if (alpha <= 0.001 && this.frame % 10 === 0) Utils.blendColor(this.ctx, color, alpha * 10, mode);
        else if (alpha <= 0.005 && this.frame % 2 === 0) Utils.blendColor(this.ctx, color, alpha * 2, mode);
        //else if(alpha > 0.005) Utils.blendColor(this.ctx, color, alpha, mode);
        else Utils.blendColor(this.ctx, color, alpha, mode);
    }

    getFPS(){
        return this.fps;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    getDescription(){
        return this.description;
    }

    update(elapsed){
        // By default just update timer and frame count
        this.time += elapsed / 1000 * this.speed;
        ++this.frame;
    }

    resize(){
        // By default do nothing
    }

    restart() {
        this.time = 0;
        this.frame = 0;
        this.resize();
    }

    getSettings() {
        return [] // By default there is no settings
    }

    mouseAction(cords) {
        // By default do nothing
    }
}

module.exports = Animation;
