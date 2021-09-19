'use strict';

const Animation = require("./animation");
const JosephgNoise = require("./josephg-noise");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt, degPerVertex = 3, noiseMin = 0.4, noiseMax = 1.2) {
        super(canvas, colors, colorsAlt);
        this.noise = JosephgNoise.noise;
        this.degPerVertex = degPerVertex;
        this.noiseMin = noiseMin;
        this.noiseMax = noiseMax;

        this.zoff = 0;
        this.color1 = this.colors[0];
        this.color2 = this.colorsAlt[0];

        this.radius = 1;
        this.radiusMin = 0;
        this.radiusMax = 0;
        this.centerX = 0;
        this.centerY = 0;

        this.resize();
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "circular waves"
    }

    update(elapsed){
        this.zoff += 0.005
    }

    draw() {
        this.ctx.strokeStyle = Utils.lerpColor(this.color1, this.color2, Math.abs(Math.sin(this.zoff)));

        this.ctx.beginPath();
        for (let t = 0; t <= 360; t += this.degPerVertex) {
            const radT = t * Math.PI / 180,
                  xoff = Utils.remap(Math.cos(radT), -1, 1, 0, 1),
                  yoff = Utils.remap(Math.sin(radT), -1, 1, 0, 1),

                  n = this.noise.simplex3(xoff, yoff, this.zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = this.centerX + r * Math.cos(radT),
                  y = this.centerY + r * Math.sin(radT);

            if(t == 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }

    resize() {
        this.centerX = this.ctx.canvas.width / 2;
        this.centerY = this.ctx.canvas.height / 2;
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMax;

        Utils.clear(this.ctx, "#FFFFFF");
    }
}

module.exports = CircularWaves;
