'use strict';

const NAME = "noisy lines",
      FILE = "noisy-lines.js",
      DESC = `
TODO: description

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class NoisyLines extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 lines = 100,
                 noiseXIncr = "random",
                 noiseYIncr = "random",
                 noiseRange = "random",
                 speed = 1,
                 rotation = "random"){
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.noiseXIncr = 0.07;
        this.noiseYIncr = 0.06;
        this.noiseRange = 0.5,
        this.lines = lines;
        this.speed = 1;
        this.rotation = 0;
        this.margin = 0.1;
    }

    draw() {
        this.clear();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        let centerX = this.ctx.canvas.width / 2,
            centerY = this.ctx.canvas.height / 2,
            drawX = centerX * (1 - this.margin),
            drawY = centerY * (1 - this.margin),
            linesDist = drawY * 2 / this.lines;
            
        this.ctx.translate(centerX, centerY);

        let yNoise = this.time * 0.3;
        for (let y = -drawY; y <= drawY; y += linesDist) {
            yNoise += this.noiseYIncr;
            let xNoise = this.time * 0.3;

            this.ctx.beginPath();
            for (let x = -drawX ; x <= drawX; x += 5) {
              xNoise += this.noiseXIncr;
              const noiseMod = Utils.remap(this.noise.perlin2(xNoise, yNoise), -1, 1, 1 - this.noiseRange, 1.00),
                    nextX = x * noiseMod,
                    nextY = y * noiseMod;
              if(x == -drawX) this.ctx.moveTo(nextX, nextY);
              else this.ctx.lineTo(nextX, nextY);
            }
            this.ctx.stroke();
        }
        
        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "lines", type: "int", min: 1, max: 250},
                {prop: "noiseXIncr", type: "float", min: -0.2, max: 0.2, step: 0.001},
                {prop: "noiseYIncr", type: "float", min: -0.2, max: 0.2, step: 0.001},
                {prop: "noiseRange", type: "float", min: 0, max: 1, step: 0.01},
                {prop: "speed", type: "float", min: -8, max: 8},
                //{prop: "rotation", type: "float", min: 0, max: 360}
                this.getSeedSettings()];
    }
}

module.exports = NoisyLines;
