'use strict';

const NAME = "vortex of particles",
      FILE = "particles-vortex.js",
      DESC = `
Particles vortex with randomized speed and direction.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesVortex extends Animation {
    constructor (canvas, colors, colorsAlt,
                 particles = 1500,
                 radius = "random",
                 speed = "random",
                 rotationSpeed = "random",
                 dirX = "random",
                 dirY = "random",
                 scale = 1){
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.particles = particles;

        this.radiusMin = 50;
        this.radiusMax = 250;
        this.radius = this.assignIfRandom(radius,
            Utils.round(Utils.randomRange(this.radiusMin, this.radiusMax), 2));

        this.speedMin = 0.02;
        this.speedMax = 0.05;
        this.speed = this.assignIfRandom(speed,
            Utils.round(Utils.randomRange(this.speedMin, this.speedMax) * Utils.randomChoice([-1, 1]), 2));

        this.rotationSpeedMin = 0.01;
        this.rotationSpeedMax = 0.02;
        this.rotationSpeed = this.assignIfRandom(rotationSpeed,
            Utils.round(Utils.randomRange(this.rotationSpeedMin, this.rotationSpeedMax) * Utils.randomChoice([-1, 1]), 2));

        this.dirMax = 0.75;
        this.dirX = this.assignIfRandom(dirX, Utils.round(Utils.randomRange(-this.dirMax, this.dirMax), 2));
        this.dirY = this.assignIfRandom(dirY, Utils.round(Utils.randomRange(-this.dirMax, this.dirMax), 2));

        this.scale = scale;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const offset = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 4,
              centerX = this.ctx.canvas.width / 2 + this.dirX * offset,
              centerY = this.ctx.canvas.height / 2 + this.dirY * offset,
              s = Math.round(this.time * 10000) / 10;

        this.ctx.translate(centerX, centerY);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.beginPath();
        for(let i = 1; i <= this.particles; i++){
            const r = this.radius + Math.pow(i / (this.particles / 1.5),2) * i / 2,
                  p = this.noise.perlin2(i * 0.1 + s, 0.1) * 100 + s * this.rotationSpeed,
                  x = Math.cos(p) * r + Math.sqrt(i * this.radius) * this.dirX,
                  y = Math.sin(p) * r + Math.sqrt(i * this.radius) * this.dirY;

            Utils.pathCircle(this.ctx, x, y, i * 0.01);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "particles", type: "int", min: 1, max: 3000},
                {prop: "radius", type: "float", min: this.radiusMin, max: this.radiusMax},
                {prop: "speed", type: "float", min: -this.speedMax, max: this.speedMax},
                {prop: "rotationSpeed", type: "float", min: -this.rotationSpeedMax, max: this.rotationSpeedMax},
                {prop: "dirX", type: "float", min: -this.dirMax, max: this.dirMax},
                {prop: "dirY", type: "float", min: -this.dirMax, max: this.dirMax}];
    }
}

module.exports = ParticlesVortex;
