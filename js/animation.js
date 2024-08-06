'use strict';

/*
 * Base class for all the background animations.
 */

const Noise = require("./noise");
const Utils = require("./utils");

class Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                name = "",
                file = "",
                description = "",
                seed = "random",
                contextType = "2d",
                contextOptions = null) {
        console.log(`Starting ${name} animation`)

        this.canvas = canvas;
        if(contextType !== null){
            if(contextOptions !== null) this.ctx = canvas.getContext(contextType, contextOptions);
            else this.ctx = canvas.getContext(contextType, { alpha: false });

            if (this.ctx) console.log(`${contextType} context obtained successfully with attributes 
                                       ${JSON.stringify(this.ctx.getContextAttributes())}`);
            else console.error(`Unable to initialize ${contextType} context. Your browser may not support it.`);
        }

        // Colors variables
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.bgColor = bgColor;
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

        // Noise, it is frequently used by many animations
        this.noise = Noise.noise;

        // Seed, might be combined with seedable rngs to make animations deterministic
        this.rand = null;
        this.maxSeedValue = 999999;
        this.seed = this.assignIfRandom(seed, Math.round(Math.random() * this.maxSeedValue));
        this.setSeed(this.seed);
        
        // Text related variables (for 2D canvas)
        this.resetFont();

        // Debug flag
        this.debug = false;
    }

    resetFont(){
        if(!this.ctx) return;

        // Reset text settings
        this.ctx.font = '14px sans-serif';
        //this.ctx.font = '14px monospace';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";        
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;
        this.lineHeight = 20;
    }

    drawTextLines(lines, startX, startY, drawBg = false){
        for(let i = 0; i < lines.length; ++i){
            const line = lines[i],
                  lineSize = this.ctx.measureText(line),
                  y = startY + (i + 1) * this.lineHeight;
            if(drawBg){
                const prevFillStyle = this.ctx.fillStyle;
                this.ctx.fillStyle = this.bgColor;
                this.ctx.fillRect(startX, y - this.lineHeight, lineSize.width, this.lineHeight);
                this.ctx.fillStyle = prevFillStyle;
            }
            Utils.fillAndStrokeText(this.ctx, line, startX, y);
        }
    }

    setSeed(seed){
        this.noise.seed(seed / this.maxSeedValue);
        this.rand = Utils.Mulberry32(seed);
    }

    assignIfRandom(value, random){  // Commonly used by many constructors
        if(value === "random") return random;
        else return value;
    }

    clear(){  // Clear background
        Utils.clear(this.ctx, this.bgColor);
    }

    fadeOut(alpha) {  // Commonly used by some animations
        // Assumes that bgColor is black or white or other light color
        if(this.bgColor == "#000000") this.blendColorAlpha(this.bgColor, alpha, "darker");
        else this.blendColorAlpha(this.bgColor, alpha, "lighter");
    }

    blendColorAlpha(color, alpha, mode) {  // More general version of the above
        if (alpha <= 0.0005 && this.frame % 20 === 0) Utils.blendColor(this.ctx, color, alpha * 20, mode);
        else if (alpha <= 0.001 && this.frame % 10 === 0) Utils.blendColor(this.ctx, color, alpha * 10, mode);
        else if (alpha <= 0.005 && this.frame % 2 === 0) Utils.blendColor(this.ctx, color, alpha * 2, mode);
        //else if(alpha > 0.005) Utils.blendColor(this.ctx, color, alpha, mode);
        else Utils.blendColor(this.ctx, color, alpha, mode);
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/animations" + this.file;
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

    updateColors(colors, colorsAlt, bgColor){
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.bgColor = bgColor;
        this.colorA = colors[0];
        this.colorB = colors[3];
    }

    restart() {
        this.time = 0;
        this.frame = 0;
        this.setSeed(this.seed);
        this.resize();
    }

    getSettings() {
        return [] // By default there is no settings
    }

    getSeedSettings(toCall = "restart") {
        return {prop: "seed", icon: '<i class="fa-solid fa-seedling"></i>', type: "int", min: 0, max: this.maxSeedValue, toCall: toCall};
    }

    mouseAction(cords, event) {
        // By default do nothing
    }

    setSettings(newSettings){
        for (const setting of this.getSettings()) {
            if (newSettings.has(setting.prop)){
                let value = newSettings.get(setting.prop);
                if(setting.type === "int") value = parseInt(value);
                else if (setting.type === "float") value = parseFloat(value);
                else if (setting.type === "bool") value = (value === "true");
                // this[setting.prop] = value;
                eval(`this.${setting.prop} = value;`);
            }
        }
        this.restart();
    }

    getURLParams(){
        let url = "";
        for (const setting of this.getSettings()) {
            if(url.length > 0) url += "&";
            //url += setting.prop + "=" + this[setting.prop];
            url += setting.prop + "=" + eval(`this.${setting.prop};`);
        }
        return url;
    }
}

module.exports = Animation;
