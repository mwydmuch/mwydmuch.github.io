/*
 * Conway's Game of Life visualization.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                degPerVertex = 2,
                noiseScale = 0.5,
                noiseMin = 0.4,
                noiseMax = 1.2
    ) {
        super(canvas, colors, colorsAlt, "circular waves", "circular-waves.js");
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.degPerVertex = degPerVertex;
        this.noiseScale = noiseScale;
        this.noiseMin = noiseMin;
        this.noiseMax = noiseMax;

        this.frame = 0;
        this.color1 = this.colors[0];
        this.color2 = this.colorsAlt[0];

        this.radiusMin = 0;
        this.radiusMax = 0;
    }

    update(timeElapsed){
        ++this.frame;
    }

    draw() {
        if(this.frame % 10 == 0) Utils.blendColor(this.ctx, "#FFFFFF", 0.01, "lighter");

        const zoff = this.frame * 0.005;
        this.ctx.strokeStyle = Utils.lerpColor(this.color1, this.color2, Math.abs(Math.sin(zoff * 5)));

        const centerX = this.ctx.canvas.width / 2,
              centerY = this.ctx.canvas.height / 2;

        this.ctx.beginPath();
        for (let a = 0; a <= 360; a += this.degPerVertex) {
            const aRad = a * Math.PI / 180,
                  xoff = Math.cos(aRad) * this.noiseScale,
                  yoff = Math.sin(aRad) * this.noiseScale,

                  n = this.noise.simplex3(xoff, yoff, zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = centerX + r * Math.cos(aRad),
                  y = centerY + r * Math.sin(aRad);

            if(a == 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }

    resize() {
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMax;
        Utils.clear(this.ctx, "#FFFFFF");
    }
}

module.exports = CircularWaves;
