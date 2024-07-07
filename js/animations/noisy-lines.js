'use strict';

const NAME = "noisy lines",
      FILE = "noisy-lines.js",
      DESC = `
Another animation based on Perlin noise. 
The lines are disorted by adding noise to the position of each vertex.
The disortion are larger as the vertices are further from the center.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class NoisyLines extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 lines = 100,
                 noiseXIncr = 0.07,
                 noiseYIncr = 0.05,
                 noiseRange = 0.5,
                 speed = 1){
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.noiseXIncr = noiseXIncr;
        this.noiseYIncr = noiseYIncr;
        this.noiseRange = noiseRange,
        this.lines = lines;
        this.speed = speed;
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
            linesDist = drawY * 2 / (this.lines - 1);
            
        this.ctx.translate(centerX, centerY);

        let yNoise = this.time * 0.3;
        for (let i = 0; i < this.lines; ++i) {
            const y = -drawY + i * linesDist;
            let xNoise = this.time * 0.3;
            yNoise += this.noiseYIncr * linesDist / 5;

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
        return [{prop: "lines", type: "int", min: 2, max: 250},
                {prop: "noiseXIncr", type: "float", min: -0.2, max: 0.2, step: 0.001},
                {prop: "noiseYIncr", type: "float", min: -0.2, max: 0.2, step: 0.001},
                {prop: "noiseRange", type: "float", min: 0, max: 1, step: 0.01},
                {prop: "speed", type: "float", min: -8, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = NoisyLines;
