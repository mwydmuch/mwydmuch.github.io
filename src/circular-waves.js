'use strict';

/*
 * Circular waves animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                vertices = 180,
                noiseScale = 0.5,
                radiusScaleMin = 0.4,
                radiusScaleMax = 1.2,
                fadingSpeed = 0.001,
                rainbowColors = false) {
        super(canvas, colors, colorsAlt, "circular waves", "circular-waves.js");
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.vertices = vertices;
        this.noiseScale = noiseScale;
        this.radiusScaleMin = radiusScaleMin;
        this.radiusScaleMax = radiusScaleMax;
        this.fadingSpeed = fadingSpeed;
        this.rainbowColors = rainbowColors;

        this.radiusMin = 0;
        this.radiusMax = 0;
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        const zoff = this.frame * 0.005,
              radPerVertex = 2 * Math.PI / this.vertices;
        if(this.rainbowColors) this.ctx.strokeStyle = 'hsl(' + Math.abs(Math.sin(zoff * 5)) * 360 + ', 100%, 50%)';
        else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB, Math.abs(Math.sin(zoff * 5)));

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        this.ctx.beginPath();
        for (let v = 0; v <= this.vertices; ++v) {
            const aRad = v * radPerVertex,
                  xoff = Math.cos(aRad) * this.noiseScale,
                  yoff = Math.sin(aRad) * this.noiseScale,
                  n = this.noise.simplex3(xoff, yoff, zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = r * Math.cos(aRad),
                  y = r * Math.sin(aRad);

            if(v === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    resize() {
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMax;
        if(this.radiusMin > this.radiusMax) [this.radiusMin, this.radiusMax] = [this.radiusMax, this.radiusMin];
        Utils.clear(this.ctx, "#FFFFFF");
    }

    getSettings() {
        return [{prop: "vertices", type: "int", min: 3, max: 720, toCall: "resize"},
                {prop: "radiusScaleMin", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "radiusScaleMax", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "noiseScale", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = CircularWaves;
